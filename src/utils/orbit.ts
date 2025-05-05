// noinspection JSNonASCIINames,NonAsciiCharacters,JSUnusedGlobalSymbols

/* disable Non-ASCII inspection, since we use greek symbols to keep the same
 * notation from the references.
 * Disable Unused Symbols inspection, since we're providing options for a user
 */


/* References:
 *  [OMES]: Howard D. Curtis - Orbital Mechanics for Engineering Students
 *          https://en.wikipedia.org/wiki/Orbital_Mechanics_for_Engineering_Students
 *          http://www.nssc.ac.cn/wxzygx/weixin/201607/P020160718380095698873.pdf
 *  [Izzo]: Dario Izzo - Revisiting Lambert’s Problem
 *          https://arxiv.org/pdf/1403.2705.pdf
 */

import Vector from "./vector";
import {findMinimumNelderMead, findZeroBisect} from "./optimize";

/* Some type aliases to help with units
 * There is no unit-checking at all, this just help when writing code
 */
export type Seconds = number;
export type Radians = number;
export type Meter = number;
export type MeterPerSecond = number;  // m/s, velocity, speed
export type Meter2PerSecond = number;  // m²/s, specific angular momentum
export type Meter3PerSecond2 = number;  // m³ × s⁻², gravitational field

export type OrbitalElements = {
    sma: Meter,  // m, parameter for parabolic orbits, negative for hyperbolic
    e?: number,  // unitless
    argp?: Radians,  // rad
    inc?: Radians,  // rad
    lon_an?: Radians,  // rad
} | {
    h: Vector<Meter2PerSecond>,  // [m^2/s, m^2/s, m^2/s]
    e: Vector,  // [unitless, unitless, unitless]
};
export type OrbitalPhase = {
    ma0: Radians,  // rad
} | {
    ta: Radians,  // rad
    t0?: Seconds,  // s
}

export class Nodes {
    /* Helper class to postpone calculations of Ascending/Descending Nodes
     */
    private _cache = {}

    constructor(
        private _myOrbit: Orbit,
        private _otherOrbit: Orbit,
    ) {}

    get _directionAscendingNodeMy(): Vector {
        if(this._cache["dirAn"] == null) {
            let directionAscendingNode = this._myOrbit.specificAngularMomentumVector
                .cross_product(this._otherOrbit.specificAngularMomentumVector)
            if(directionAscendingNode.norm == 0) {  // coplanar orbits
                // arbitrarily choose periapsis
                directionAscendingNode = this._myOrbit.eccentricityVector
            }
            this._cache["dirAn"] = directionAscendingNode
        }
        return this._cache["dirAn"]
    }

    get relativeInclination(): Radians {
        if(this._cache['relInc'] == null) {
            this._cache['relInc'] = this._myOrbit.specificAngularMomentumVector
                .angle_to(this._otherOrbit.specificAngularMomentumVector)
        }
        return this._cache['relInc']
    }

    get _directionAscendingNodePerifocalMy(): Vector {
        if(this._cache["dirAnPfMy"] == null) {
            this._cache["dirAnPfMy"] = this._myOrbit.globalToPerifocal(this._directionAscendingNodeMy)
        }
        return this._cache["dirAnPfMy"]
    }
    get ascendingNodeTa(): Radians {
        if(this._cache["anTa"] == null) {
            const dirAnPfMy = this._directionAscendingNodePerifocalMy
            this._cache["anTa"] = Math.atan2(dirAnPfMy.y, dirAnPfMy.x)
        }
        return this._cache["anTa"]
    }
    get descendingNodeTa(): Radians {
        return (this.ascendingNodeTa + Math.PI) % (2*Math.PI)
    }

    get _directionAscendingNodePerifocalOther(): Vector {
        // We keep Ascending/Descending from *this* perspective
        if(this._cache["dirAnPfOther"] == null) {
            this._cache["dirAnPfOther"] = this._otherOrbit.globalToPerifocal(this._directionAscendingNodeMy)
        }
        return this._cache["dirAnPfOther"]
    }
    get ascendingNodeOtherTa(): Radians {
        // We keep Ascending/Descending from *this* perspective
        if(this._cache["anOtherTa"] == null) {
            const dirAnPfOther = this._directionAscendingNodePerifocalOther
            this._cache["anOtherTa"] = Math.atan2(dirAnPfOther.y, dirAnPfOther.x)
        }
        return this._cache["anOtherTa"]
    }
    get descendingNodeOtherTa(): Radians {
        // We keep Ascending/Descending from *this* perspective
        return (this.ascendingNodeOtherTa + Math.PI) % (2*Math.PI)
    }
}

export abstract class LambertSolution {
    _iterations: number
    abstract get orbit(): Orbit
    abstract get arc(): Radians
    abstract get v1(): Vector<MeterPerSecond>
    abstract get v2(): Vector<MeterPerSecond>
}

class LambertBate71 extends LambertSolution {
    private _cache = {}

    _gravity: Meter3PerSecond2
    _position1: Vector<Meter>
    _position2: Vector<Meter>
    _t0: Seconds

    _A: number
    _z: number
    _y_z: number
    _arc: Radians

    constructor(
        gravity: Meter3PerSecond2,
        position1: Vector<Meter>,
        position2: Vector<Meter>,
        dt: Seconds,
        direction: "prograde" | "retrograde" = "prograde",
        t0: Seconds = 0,
    ) {
        super()
        this._gravity = gravity
        this._position1 = position1
        this._position2 = position2
        this._t0 = t0

        // [OMES Algorithm 5.2]
        const r1_norm = position1.norm;
        const r2_norm = position2.norm;

        let dθ = position1.angle_to(position2);  // [OMES 5.26]
        const dθ_quadrant = position1.cross_product(position2);
        if((direction === "prograde" && dθ_quadrant.z < 0)
            || (direction === "retrograde" && dθ_quadrant.z >= 0)) {
            dθ = 2*Math.PI - dθ;
        }
        this._arc = dθ

        const A = Math.sin(dθ) * Math.sqrt(r1_norm * r2_norm / (1-Math.cos(dθ)));  // [OMES 5.35]
        this._A = A

        const z_estimate = 0  // TODO: allow feeding this in?
        const y = (z) => r1_norm + r2_norm + A * (z * Orbit._S(z) - 1) / Math.sqrt(Orbit._C(z));  // [OMES 5.38]
        let iterations = 0
        const z = Orbit._findZero(
            (z) => {
                iterations += 1
                const y_z = y(z);
                if(y_z < 0) throw RangeError("Solving Lambert: y(z) is negative, why?")
                const C_z = Orbit._C(z);
                const S_z = Orbit._S(z);
                const Cp_z = Orbit._Cp(z);
                const Sp_z = Orbit._Sp(z);
                const yp_z = A / 4 * Math.sqrt(C_z);
                const f = Math.pow(y_z / C_z, 3/2) * S_z
                    + A * Math.sqrt(y_z) - Math.sqrt(gravity) * dt;  // [OMES 5.40]
                const fp = 1 / (2 * Math.sqrt(y_z * Math.pow(C_z, 5))) * (
                    (2 * C_z * Sp_z - 3 * Cp_z * S_z) * y_z*y_z
                    + (A * Math.pow(C_z, 5/2) + 3 * C_z * S_z * y_z) * yp_z
                );  // [OMES 5.41]
                return {f, fp};
            },
            z_estimate,
        );
        if(isNaN(z)) throw RangeError("Solving Lambert: did not converge")

        this._iterations = iterations
        this._z = z
        this._y_z = y(z)
    }

    get arc(): Radians { return this._arc }

    // [OMES 5.46]
    get f(): number { return 1 - this._y_z / this._position1.norm }
    get g(): number { return this._A * Math.sqrt(this._y_z / this._gravity) }
    get fp(): number { return Math.sqrt(this._gravity)
        / (this._position1.norm * this._position2.norm)
        * Math.sqrt(this._y_z / Orbit._C(this._z))
        * (this._z * Orbit._S(this._z) - 1) }
    get gp(): number { return 1 - this._y_z / this._position2.norm }

    get v1(): Vector<MeterPerSecond> {
        if(this._cache["v1"] == null) {
            this._cache["v1"] = this._position2.sub(this._position1.mul(this.f)).mul(1/this.g);  // [OMES 5.28]

        }
        return this._cache["v1"]
    }
    get v2(): Vector<MeterPerSecond> {
        if(this._cache["v2"] == null) {
            this._cache["v2"] = this._position2.mul(this.gp).sub(this._position1).mul(1/this.g);  // [OMES 5.29]

        }
        return this._cache["v2"]
    }

    get orbit(): Orbit {
        if(this._cache["orbit"] == null) {
            this._cache["orbit"] = Orbit.FromStateVector(this._gravity, this._position1, this.v1, this._t0)
        }
        return this._cache["orbit"]
    }
}

// noinspection JSNonASCIINames,NonAsciiCharacters
export default class Orbit {
    _cache: object = {}

    static FromStateVector(
        gravity: Meter3PerSecond2,
        position: Vector<Meter>,
        velocity: Vector<MeterPerSecond>,
        time: Seconds = 0,
    ): Orbit {
        /**
         * create a new orbit from a given position, velocity and time
         * @param {number} gravity - gravitational field of orbit [m³ × s⁻²]
         * @param {Vector} position - position vector [m, m, m]
         * @param {Vector} velocity - velocity vector [m/s, m/s, m/s]
         * @param {number} [time] - optional time at which the vessel is at the given position [s], default to 0
         * @returns {Orbit}
         */
        return new Orbit(
            gravity,
            position,
            velocity,
            time,
        );
    }

    static FromOrbitalElements(
        gravity: Meter3PerSecond2,  // m^3 s^-2
        orbitalElements: OrbitalElements,
        orbitalPhase?: OrbitalPhase,
    ): Orbit {
        let h_norm, e_norm;
        let argp, inc, lon_an;
        let N = undefined;  // node line

        if('h' in orbitalElements) {
            // h, e Vectors
            // part of [OMES Algorithm 4.1]
            h_norm = orbitalElements.h.norm;
            e_norm = orbitalElements.e.norm;
            inc = orbitalElements.h.angle_to(new Vector(0, 0, 1));
            N = (new Vector(0, 0, 1)).cross_product(orbitalElements.h);
            lon_an = Math.acos(N.x/N.norm);
            if(N.y < 0) lon_an = 2*Math.PI - lon_an;
            argp = N.angle_to(orbitalElements.e);
            if(orbitalElements.e.z < 0) argp = 2*Math.PI - argp;

        } else {
            e_norm = orbitalElements.e || 0;
            if(e_norm != 1) {  // elliptical, hyperbolic
                if(e_norm > 1 && orbitalElements.sma > 0) {
                    throw `Expected negative SMA for hyperbolic orbit (e=${orbitalElements.e}).`
                        + `Got ${orbitalElements.sma}`;
                }
                h_norm = Math.sqrt(orbitalElements.sma * gravity * (1 - e_norm * e_norm));  // from [OMES 3.44]
            } else {  // parabolic
                // SMA is infinite, and we need the parameter p.
                // re-use sma as p in this case
                h_norm = Math.sqrt(orbitalElements.sma * gravity);  // [OMES 2.43]
            }
            argp = orbitalElements.argp || 0;
            inc = orbitalElements.inc || 0;
            lon_an = orbitalElements.lon_an || 0;
        }

        let θ = 0, t0 = 0;
        if(orbitalPhase != null) {
            if('ma0' in orbitalPhase) {
                /* Normally we'd calculate the true anomaly at t=0 from ma0.
                 * But (at least) for hyperbolic orbits, this doesn't always converge; especially when far from
                 * periapsis.
                 * Instead, work the other way around: find t0 so that true anomaly is 0.
                 */
                const ma0 = orbitalPhase.ma0;
                if(e_norm < 1) {  // elliptical
                    t0 = (-ma0) * h_norm*h_norm*h_norm / (gravity*gravity)
                        / Math.pow(1 - e_norm*e_norm, 3/2);  // from [OMES 3.4]
                    // at t=t0, Mean Anomaly is 0 and thus true anomaly is also 0

                } else if(e_norm == 1) {  // parabolic
                    t0 = (-ma0) * h_norm*h_norm*h_norm / (gravity*gravity);  // from [OMES 3.28]
                    // at t=t0, Parabolic anomaly is 0, thus true anomaly is 0

                } else {  // hyperbolic
                    t0 = (-ma0) * h_norm*h_norm*h_norm / (gravity*gravity)
                        / Math.pow(e_norm*e_norm - 1, 3/2);  // from [OMES 3.31]
                    // at t=t0, Hyperbolic anomaly is 0, thus true anomaly is 0
                }

            } else if('ta' in orbitalPhase) {
                θ = orbitalPhase.ta;
                t0 = orbitalPhase.t0 || 0;
            }
        }

        // [OMES Alogirthm 4.2]
        const r_x_norm = h_norm*h_norm / gravity / (1 + e_norm * Math.cos(θ));
        const r_x = new Vector(
            Math.cos(θ),
            Math.sin(θ),
            0,
        ).mul(r_x_norm);  // [OMES 4.37]
        const v_x = new Vector(
            -Math.sin(θ),
            e_norm + Math.cos(θ),
            0,
        ).mul(gravity / h_norm);  // [OMES 4.38]

        const r = r_x.rotated(
            new Vector(0, 0, 1),
            argp,
        ).rotated(
            new Vector(1, 0, 0),
            inc,
        ).rotated(
            new Vector(0, 0, 1),
            lon_an,
        );
        const v = v_x.rotated(
            new Vector(0, 0, 1),
            argp,
        ).rotated(
            new Vector(1, 0, 0),
            inc,
        ).rotated(
            new Vector(0, 0, 1),
            lon_an,
        );

        const o = new Orbit(gravity, r, v, t0);
        o._cache = {
            h_norm,
            e_norm,
            argp,
            lon_an,
            inc,
        };
        if('h' in orbitalElements) {
            o._cache['h'] = orbitalElements.h;
            o._cache['e'] = orbitalElements.e;
            o._cache['N'] = N;
        }
        if(orbitalPhase !== undefined && 'ma0' in orbitalPhase) {
            o._cache['ma0'] = orbitalPhase.ma0;
        }
        return o
    }
    orbitalElements(): {
        sma: Meter,
        h: Vector,
        e: Vector,
        argp: Radians,
        inc: Radians,
        lon_an: Radians,
        ma0: Radians,
    } {
        /* Calculate the orbital elements
         * Note that the return value is redundant in several ways.
         */
        return {
            sma: this._smaOrParameter,
            h: this.specificAngularMomentumVector,
            e: this.eccentricityVector,
            inc: this.inclination,
            argp: this.argumentOfPeriapsis,
            lon_an: this.longitudeAscendingNode,
            ma0: this.meanAnomalyAtEpoch,
        }
    }

    static FromOrbitWithUpdatedOrbitalElements(
        orbit: Orbit,
        changes: object,
    ): Orbit {
        let gravity = orbit.gravity;
        if('gravity' in changes) gravity = changes['gravity'] as number;

        const elements = {
            sma: orbit._smaOrParameter,
            e: orbit.eccentricity,
            argp: orbit.argumentOfPeriapsis,
            inc: orbit.inclination,
            lon_an: orbit.longitudeAscendingNode,
        };
        const phase = {
            ma0: orbit.meanAnomalyAtEpoch,
        }
        return Orbit.FromOrbitalElements(gravity,
            Object.assign({}, elements, changes),
            Object.assign({}, phase, changes),
        );
    }

    static FromLambert(
        gravity: Meter3PerSecond2,
        position1: Vector<Meter>,
        position2: Vector<Meter>,
        dt: Seconds,
        direction: "prograde" | "retrograde" = "prograde",
        t0: Seconds = 0,
        revolutions: number = 0,
        path: "high" | "low" = null,
    ): LambertSolution {
        /* Solve the Lambert problem: find the orbit that will bring an object
         * from `position1` to `position2` in `dt` time, assuming a primary body
         * at the center of the coordinate system with gravity `gravity`.
         *
         * Optionally, perform `revolutions` revolutions around the attractor before arriving.
         * Generally, there will be 2 elliptical orbits that satisfy the requirements,
         * one with the empty focus point below the chord line ("low"), and a second one above ("high")
         */
        if(dt <= 0) throw RangeError("∆t can't be <= 0, got " + dt)
        if(gravity <= 0) throw RangeError("Need gravity to solve Lambert problem, got " + gravity)

        if(revolutions != 0) throw RangeError("Multi-revolution not supported")
        if(path != null) throw RangeError("Path selection not supported")
        return new LambertBate71(
            gravity,
            position1,
            position2,
            dt,
            direction,
            t0,
        )
    }

    serialize(): string {
        return JSON.stringify({
            g: this.gravity,
            r: [this.r0.x, this.r0.y, this.r0.z],
            v: [this.v0.x, this.v0.y, this.v0.z],
            t: this.t0,
        });
    }
    static Unserialize(s: string): Orbit {
        const o = JSON.parse(s);
        return new Orbit(
            o.g,
            new Vector(o.r[0], o.r[1], o.r[2]),
            new Vector(o.v[0], o.v[1], o.v[2]),
            o.t,
        )
    }

    get energy(): number {
        /* in J/kg or m²/s² */
        if(this._cache['energy'] === undefined) {
            this._cache['energy'] = this.v0.norm * this.v0.norm / 2
                - this.gravity / this.r0.norm;  // [OMES] 2.47
        }
        return this._cache['energy'];
    }

    get specificAngularMomentumVector(): Vector<Meter2PerSecond> {
        // specific angular momentum
        if(this._cache['h'] === undefined) {
            this._cache['h'] = this.r0.cross_product(this.v0);
        }
        return this._cache['h'];
    }
    get specificAngularMomentum(): Meter2PerSecond {
        if(this._cache['h_norm'] === undefined) {
            this._cache['h_norm'] = this.specificAngularMomentumVector.norm;
        }
        return this._cache['h_norm'];
    }

    get eccentricityVector(): Vector<number> {
        // eccentricity vector, points to periapsis
        if(this._cache['e'] === undefined) {
            // [OMES] 2.30
            const h = this.specificAngularMomentumVector;
            this._cache['e'] = this.v0.cross_product(h).mul(1 / this.gravity)
                .sub(this.r0.mul(1 / this.r0.norm));
        }
        return this._cache['e'];
    }
    get eccentricity(): number {
        // eccentricity
        if(this._cache['e_norm'] === undefined) {
            this._cache['e_norm'] = this.eccentricityVector.norm;
        }
        return this._cache['e_norm'];
    }

    get semiMajorAxis(): Meter {
        // Semi-major axis
        return 1 / this._α;
    }
    get parameter(): Meter {
        // Returns the parameter of the orbit
        const h = this.specificAngularMomentum;
        return h*h / this.gravity;  // [OMES 2.43]
    }
    get _smaOrParameter(): Meter {
        if(this.eccentricity === 1) {
            return this.parameter;
        }
        // else:
        return this.semiMajorAxis;
    }
    get period(): Seconds | null {
        if(this._cache['period'] === undefined) {
            if (this.eccentricity < 1) {  // elliptic
                this._cache['period'] = 2 * Math.PI / Math.sqrt(this.gravity) * Math.pow(this.semiMajorAxis, 3 / 2);  // [OMES 2.73]
            } else {  // parabolic, hyperbolic
                this._cache['period'] = null;
            }
        }
        return this._cache['period'];
    }
    static smaFromPeriod(gravity: Meter3PerSecond2, period: Seconds): Meter {
        /* Calculates the sma to get a given orbital period
         * in the given gravity field.
         */
        // https://en.wikipedia.org/wiki/Orbital_period
        return Math.pow(period*period / (4 * Math.PI * Math.PI) * gravity, 1/3);
    }
    static periodFromSma(gravity: Meter3PerSecond2, sma: Meter): Seconds {
        /* Calculate the period of an orbit
         * given the SMA and gravity field.
         *
         * Returns undefined for hyperbolic (sma<0) and
         * parabolic (sma=NaN) orbits.
         */
        if(sma < 0) return null;  // hyperbolic orbits don't have a period
        if(isNaN(sma)) return null;  // parabolic orbits don't have a period
        // https://en.wikipedia.org/wiki/Orbital_period
        return 2 * Math.PI * Math.sqrt(sma*sma*sma / gravity);
    };
    static smaEFromApsides(ap1: Meter, ap2: Meter): {sma: Meter, e: number} {
        if(ap1 == null && ap2 == null) return null
        if(ap2 == null) return {sma: ap1, e: 0}
        if(ap1 == null) return {sma: ap2, e: 0}

        const apoapsis = ap1 >= ap2 ? ap1 : ap2;
        const periapsis = ap1 >= ap2 ? ap2 : ap1;

        if(periapsis < 0) {  // hyperbolic
            const e = (periapsis - apoapsis) / (apoapsis + periapsis);
            const sma = - apoapsis / (e - 1.);
            return {sma, e};
        } else if(apoapsis == Infinity) {  // parabolic
            return {
                sma: periapsis * 2,  // parameter
                e: 1,
            }
        } else {
            const e = (apoapsis - periapsis) / (apoapsis + periapsis);
            const sma = apoapsis / (1. + e);
            return {sma, e};
        }
    }
    static apsidesFromSmaE(sma: Meter, e: number): [Meter, Meter] {
        return [
            sma * (1-e),
            sma * (1+e),
        ];
    }
    static periapsisDistanceFromParabolicPeriapsisSpeed(gravity: Meter3PerSecond2, speed: MeterPerSecond): Meter {
        return 2 * gravity / (speed*speed); // [OMES 2.80]
    }
    get turnAngle(): Radians {
        // Turn angle for hyperbolic trajectory
        if(this.energy < 0) {  // elliptic
            return null;
        } else {  // parabolic (180º), hyperbolic
            return 2 * Math.asin(1/this.eccentricity);  // [OMES 2.90]
        }
    }
    get hyperbolicExcessVelocity(): MeterPerSecond {
        if(this.energy < 0) return null
        else if(this.energy === 0) return 0;
        // else:
        return Math.sqrt(this.gravity / (-this.semiMajorAxis));  // [OMES 2.102]
    }
    get trueAnomalyOfAsymptote(): Radians {
        if(this.energy < 0) return null  // elliptic, does not have an asymptote
        // else:  // parabolic, hyperbolic
        return Math.acos(Math.max(-1, Math.min(1,
            -1./this.eccentricity)))
    }
    static semiMajorAxisFromHyperbolicExcessVelocity(gravity: Meter3PerSecond2, v: MeterPerSecond): Meter {
        return -gravity / (v*v);  // from [OMES 2.102]
    }
    static semiMajorAxisEFromPeriapsisHyperbolicExcessVelocity(
        gravity: Meter3PerSecond2,
        periapsisDistance: Meter,
        hyperbolicExcessVelocity: MeterPerSecond
    ): {sma: Meter, e: number} {
        if(hyperbolicExcessVelocity === 0) {  // Parabolic
            return {
                sma: 2 * periapsisDistance,  // parameter in parabolic case
                e: 1,
            }
        }
        const sma = Orbit.semiMajorAxisFromHyperbolicExcessVelocity(gravity, hyperbolicExcessVelocity);
        const e = -periapsisDistance / sma + 1;
        return {sma, e};
    }
    static FromPositionAndHyperbolicExcessVelocityVector(
        gravity: Meter3PerSecond2,
        position: Vector<Meter>,
        hyperbolicExcessVelocityVector: Vector<MeterPerSecond>,
        direction: "direct" | "indirect",
        t0: Seconds = 0,
    ): Orbit {
        /* Given a position and a desired escape velocity vector, searches for
         * the orbit to accomplish that.
         * There are always two option: going directly toward the escape direction ("direct"),
         * or slinging around the primary body ("indirect"). For this last scenario, verify that
         * the orbit periapsis is above the surface and atmosphere!
         */
        const vinf = hyperbolicExcessVelocityVector.norm;
        const speedAtPosition = Math.sqrt(vinf*vinf + 2 * gravity / position.norm);  // from [OMES 2.101 & 2.102]
        let turn = position.angle_to(hyperbolicExcessVelocityVector);
        const h_dir = position.cross_product(hyperbolicExcessVelocityVector);
        if(direction === "direct") {
            // nothing
        } else if(direction === "indirect") {
            turn = 2*Math.PI - turn;
        } else {
            throw "Unrecognised direction: " + direction;
        }
        //console.log(`desired turn: ${turn}`);

        function turnFromVelocityAngle(velocityAngleVsPosition: Radians): {turn: Radians, orbit: Orbit} {
            const v = position.mul(speedAtPosition/position.norm).rotated(h_dir, velocityAngleVsPosition);
            const o = Orbit.FromStateVector(gravity, position, v, t0);
            const ta0 = o.taAtT(t0);
            const tainf = o.trueAnomalyOfAsymptote;
            //console.log(o);
            //console.log(`va=${velocityAngleVsPosition}  => e=${o.eccentricity} ta0=${ta0}  tainf=${tainf}  => dta=${tainf-ta0}`);
            return {
                turn: tainf - ta0,
                orbit: o,
            };
        }

        try {
            const velocityDirection = findZeroBisect(
                d => {
                    const {turn: turnOfD} = turnFromVelocityAngle(d);
                    return turnOfD - turn;
                },
                1e-7 * (direction === "direct" ? 1 : -1),
                (Math.PI - 1e-7) * (direction === "direct" ? 1 : -1),
            )
            const {orbit} = turnFromVelocityAngle(velocityDirection);
            return orbit;
        } catch(e) {
            if(e instanceof TypeError) return null;
            if(e instanceof RangeError) {
                // weird, shouldn't happen but swallow
                console.log(`Error detected when bisecting. Possible rounding error, ignoring. ${e}`)
                return null;
            }
            throw e;
        }
    }
    static optimalApoapsis(gravity: Meter3PerSecond2, hyperbolicExcessVelocity: MeterPerSecond): Meter {
        /* Calculates the optimal (in ∆v terms) apoapsis to switch from
         * a hyperbolic orbit into/from a circular orbit.
         * The hyperbolic periapsis depends on the desired eccentricity, and equals the
         * returned apoapsis for a circular orbit
         */
        return 2 * gravity / (hyperbolicExcessVelocity*hyperbolicExcessVelocity);  // [OMES 8.69]
    }

    get inclination(): Radians {
        if(this._cache['inc'] === undefined) {
            // part of [OMES Algorithm 4.1]
            const h = this.specificAngularMomentumVector;
            const h_norm = this.specificAngularMomentum;
            this._cache['inc'] = Math.acos(h.z / h_norm);
        }
        return this._cache['inc'];
    }

    get nodeLineVector(): Vector<Meter> {
        /* Vector pointing to the ascending node */
        if(this._cache['N'] === undefined) {
            // part of [OMES Algorithm 4.1]
            const h = this.specificAngularMomentumVector;
            this._cache['N'] = (new Vector(0, 0, 1)).cross_product(h);
        }
        return this._cache['N'];
    }

    get longitudeAscendingNode(): Radians {
        if(this._cache['lon_an'] === undefined) {
            // part of [OMES Algorithm 4.1]
            const N = this.nodeLineVector;
            const N_norm = N.norm;
            let Ω;
            if(N_norm === 0) {  // orbit is in XY-plane
                // Ω is undefined; pick arbitrarily
                Ω = 0;
            } else {
                Ω = Math.acos(N.x / N_norm);
                if(N.y < 0) Ω = 2*Math.PI - Ω;
            }
            this._cache['lon_an'] = Ω;
        }
        return this._cache['lon_an'];
    }

    get argumentOfPeriapsis(): Radians {
        if(this._cache['argp'] === undefined) {
            let N = this.nodeLineVector;
            let N_norm = N.norm;
            const e = this.eccentricityVector;
            const e_norm = this.eccentricity;
            let ω;
            if(e_norm === 0) {  // circular
                // ArgP is undefined
                ω = 0;  // pick arbitrarily

            } else if(N_norm === 0) {  // Orbit is in XY-plane => e.z == 0
                // Longitude of Ascending node is set arbitrarily to 0
                // Pick N = (1, 0, 0)
                ω = Math.atan2(e.y, e.x);
                if(this.specificAngularMomentumVector.z < 0) {  // retrograde
                    ω = 2*Math.PI - ω;
                    if(ω > 2*Math.PI) ω -= 2*Math.PI;
                }

            } else {
                ω = Math.acos(Math.max(-1, Math.min(1,  // cap for rounding errors
                    N.inner_product(e) / (N_norm * e_norm))));
                if (e.z < 0) ω = 2 * Math.PI - ω;
            }
            this._cache['argp'] = ω;
        }
        return this._cache['argp'];
    }

    get _periapsisUnitVector(): Vector {
        const v = this.positionAtTa(0);
        return v.mul(1/v.norm);
    }

    get meanAnomalyAtEpoch(): Radians {
        if(this._cache['ma0'] === undefined) {
            const r = this.r0.norm;
            const vr = this.v0.inner_product(this.r0) / r;
            const h_norm = this.specificAngularMomentum;
            const μ = this.gravity;
            const e = this.eccentricityVector;
            const e_norm = this.eccentricity;

            let θ;
            if(e_norm > 0) {
                // Cap acos() argument to [-1; 1] to avoid NaN due to rounding
                θ = Math.acos(Math.min(Math.max(e.inner_product(this.r0) / (e_norm * r), -1), 1));
            } else {  // special case for circular; arbitrarily choose argP to be 1x
                θ = Math.acos(this._periapsisUnitVector.inner_product(this.r0) / r);
            }
            if (vr < 0) θ = 2 * Math.PI - θ;

            if (e_norm < 1) {  // elliptic
                const E = 2 * Math.atan(
                    Math.sqrt((1 - e_norm) / (1 + e_norm))
                    * Math.tan(θ / 2)
                );  // [OMES 3.10b]
                const Me = E - e_norm * Math.sin(E);  // [OMES 3.11]
                this._cache['ma0'] = Me - 2 * Math.PI / this.period * this.t0;

            } else if (e_norm == 1) {  // parabolic
                const Mp = 1 / 2 * Math.tan(θ / 2)
                    + 1 / 6 * Math.pow(Math.tan(θ / 2), 3);  // [OMES 3.27]
                this._cache['ma0'] = Mp - μ * μ * this.t0 / (h_norm * h_norm * h_norm);

            } else {  // hyperbolic
                const F = Math.asinh(
                    Math.sqrt(e_norm * e_norm - 1) * Math.sin(θ)
                    / (1 + e_norm * Math.cos(θ))
                );  // [OMES 3.35]
                const Mh = e_norm * Math.sinh(F) - F;  // [OMES 3.37]
                this._cache['ma0'] = Mh - μ * μ / (h_norm * h_norm * h_norm) * Math.pow(e_norm * e_norm - 1, 3 / 2) * this.t0;  // [OMES 3.31]
            }
        }
        return this._cache['ma0'];
    }

    get distanceAtPeriapsis(): Meter {
        if(this._cache['rp'] === undefined) {
            const h = this.specificAngularMomentum;
            const e = this.eccentricity;
            this._cache['rp'] = h * h / this.gravity / (1 + e);
        }
        return this._cache['rp'];
    }
    get distanceAtApoapsis(): Meter {
        if(this._cache['ra'] === undefined) {
            const h = this.specificAngularMomentum;
            const e = this.eccentricity;
            this._cache['ra'] = h*h / this.gravity / (1 - e);
        }
        return this._cache['ra'];
    }

    distanceAtTa(θ: Radians): Meter {
        // [OMES] 2.35
        const h = this.specificAngularMomentum;
        const e = this.eccentricity;
        return h*h / this.gravity / (1 + e * Math.cos(θ))
    }

    positionAtTa(θ: Radians): Vector<Meter> {
        const r_norm = this.distanceAtTa(θ);
        const r_osculating_plane = Vector.FromSpherical(r_norm, Math.PI/2, θ);
        return this.perifocalToGlobal(r_osculating_plane);
    }

    positionAtT(t: Seconds): Vector<Meter> {
        const dt = t - this.t0;
        if(dt === 0) return this.r0;
        const {r} = this._rAndχAtDt(dt);
        return r;
    }

    speedAtTa(θ: Radians): MeterPerSecond {
        const r = this.distanceAtTa(θ);
        const e = this.energy;
        return Math.sqrt(2 * (e + this.gravity / r));  // [OMES] 2.48
    }

    flightAngleAtTa(θ: Radians): Radians {
        /* Calculate the Flight Angle, the angle between the velocity vector
         * and the local horizon (i.e. perpendicular to position vector).
         * Positive values means above the horizon; negative means below.
         */
        const e = this.eccentricity;
        // [OMES 2.42]
        const tan_fa = e * Math.sin(θ) / (
            1 + e * Math.cos(θ)
        )
        return Math.atan(tan_fa);
    }

    velocityAtTa(θ: Radians): Vector<MeterPerSecond> {
        const s = this.speedAtTa(θ);
        const fa = this.flightAngleAtTa(θ);
        const v_pf = (new Vector(s, 0, 0))
            .rotated(
                new Vector(0, 0, 1),
                θ + Math.PI/2 - fa,
            );
        return this.perifocalToGlobal(v_pf);
    }

    velocityAtT(t: Seconds): Vector<MeterPerSecond> {
        const {v} = this.stateVectorAtT(t);
        return v;
    }

    stateVectorAtT(t: Seconds = 0): {r: Vector<Meter>, v: Vector<MeterPerSecond>} {
        if(t === this.t0) return {r: this.r0, v: this.v0};

        const dt = t - this.t0;
        const {r, χ} = this._rAndχAtDt(dt);

        const α = this._α;
        const µ = this.gravity;
        const r_mag = r.norm;
        const r0_mag = this.r0.norm;

        const fp = Math.sqrt(µ) / (r_mag * r0_mag)
            * (α * χ*χ*χ * Orbit._S(α*χ*χ) - χ);   // 3.66c
        const gp = 1 - χ*χ / r_mag * Orbit._C(α * χ*χ);  // 3.66d

        return {
            r: r,
            v: this.r0.mul(fp).add(this.v0.mul(gp)),  // 3.65
        };
    }

    taAtT(t: Seconds): Radians {
        // Calculate the true anomaly at the given time t
        const r = this.positionAtT(t);
        const r_pf = this.globalToPerifocal(r);
        return Math.atan2(r_pf.y, r_pf.x);
    }
    timeSincePeriapsisAtTa(θ: Radians): Seconds {
        // Calculate the time since (>0, or until if <0) periapsis.
        const e = this.eccentricity;
        if(e < 1) {  // elliptic
            // [OMES Example 3.1]
            const E = 2 * Math.atan(Math.sqrt((1-e)/(1+e)) * Math.tan(θ/2));  // [OMES 3.10b]
            const Me = E - e * Math.sin(E);  // [OMES 3.11]
            return Me / (2*Math.PI) * this.period;  // [OMES 3.12]

        } else if(e === 1) {  // parabolic
            const Mp = 1/2 * Math.tan(θ/2) + 1/6 * Math.pow(Math.tan(θ/2), 3);  // [OMES 3.27]
            const h = this.specificAngularMomentum;
            const µ = this.gravity;
            return Mp * h*h*h / (µ*µ);  // from [OMES 3.28]

        } else {  // hyperbolic
            const F = 2 * Math.atanh(Math.sqrt((e-1)/(e+1)) * Math.tan(θ/2));  // from [OMES 3.41a]
            const Mh = e * Math.sinh(F) - F;  // [OMES 3.37]
            const h = this.specificAngularMomentum;
            const µ = this.gravity;
            return Mh * h*h*h / (µ*µ) * Math.pow(e*e - 1, -3/2);  // from [OMES 3.31]
        }
    }
    tAtTa(θ: Radians): Seconds {
        /* Calculate the time (parabolic, hyperbolic) or *a* time (elliptic)
         * when the true anomaly was θ.
         */
        const tp = this.timeSincePeriapsisAtTa(θ);
        const tp0 = this._timeSincePeriapsisOfT0;
        return this.t0 + tp - tp0;
    }

    taAtDistance(r: Meter): Radians {
        /* Calculates a true anomaly where the orbit crosses distance `r`.
         * The other true anomaly will be the negative of this result.
         * Returns NaN if the specified distance is never reached.
         */
        const µ = this.gravity;
        const h = this.specificAngularMomentum;
        const e = this.eccentricity;
        return Math.acos((h*h / (µ * r) - 1) / e); // from [OMES 2.35]
    }

    nodesVs(other: Orbit): Nodes {
        return new Nodes(this, other)
    }
    dvPrnForInclinationChange(ta: Radians, angle: Radians): Vector<MeterPerSecond> {
        /* Returns the needed burn in (Prograde, Radial-in, Normal) coordinates
         * to change the orbit's inclination by `angle` at true anomaly `ta`.
         * The new orbit will have its Ascending Node vs the old orbit at `ta`.
         */
        /* https://en.wikipedia.org/w/index.php?title=Orbital_inclination_change&oldid=998215180 seems wrong
         * (see Talk, or try to make an inclination change at w+f=pi)
         */
        const p = this.positionAtTa(ta)
        const v = this.velocityAtTa(ta)
        const vRotated = v.rotated(p, angle)
        const dv = vRotated.sub(v)
        return dv
    }

    static dvPForApsis(gravity: Meter3PerSecond2, rCurrent: Meter, rOtherFrom: Meter, rOtherTo: Meter): MeterPerSecond {
        /* Calculate ∆v required to change the altitude of the opposite apsis.
         *  rCurrent: current apsis altitude
         *  rOtherFrom: current opposite apsis altitude
         *  rOtherTo: desired opposite apsis altitude
         * returns prograde ∆v to perform the change
         */
        const dv = Math.sqrt(2 * gravity / rCurrent) * (
            Math.sqrt(
                rOtherTo / (rCurrent + rOtherTo)
            ) - Math.sqrt(
                rOtherFrom / (rCurrent + rOtherFrom)
            )
        )
        return dv
    }

    globalToPerifocal(g: Vector): Vector {
        // [OMES 4.43]
        const Ω = this.longitudeAscendingNode;
        const i = this.inclination;
        const ω = this.argumentOfPeriapsis;
        const cosΩ = Math.cos(Ω);
        const sinΩ = Math.sin(Ω);
        const cosω = Math.cos(ω);
        const sinω = Math.sin(ω);
        const cosi = Math.cos(i);
        const sini = Math.sin(i);
        return new Vector(
            (cosΩ * cosω - sinΩ * sinω * cosi) * g.x
            + (sinΩ * cosω + cosΩ * cosi * sinω) * g.y
            + (sini * sinω) * g.z,
            (-cosΩ * sinω - sinΩ * cosi * cosω) * g.x
            + (-sinΩ * sinω + cosΩ * cosi * cosω) * g.y
            + (sini * cosω) * g.z,
            (sinΩ * sini) * g.x
            + (sini * cosω) * g.y
            + (cosi) * g.z,
        );
    }
    perifocalToGlobal(pf: Vector): Vector {
        // [OMES 4.44]
        const Ω = this.longitudeAscendingNode;
        const i = this.inclination;
        const ω = this.argumentOfPeriapsis;
        const cosΩ = Math.cos(Ω);
        const sinΩ = Math.sin(Ω);
        const cosω = Math.cos(ω);
        const sinω = Math.sin(ω);
        const cosi = Math.cos(i);
        const sini = Math.sin(i);
        return new Vector(
            (cosΩ * cosω - sinΩ * sinω * cosi) * pf.x
            + (-cosΩ * sinω - sinΩ * cosi * cosω) * pf.y
            + (sinΩ * sini) * pf.z,
            (sinΩ * cosω + cosΩ * cosi * sinω) * pf.x
            + (-sinΩ * sinω + cosΩ * cosi * cosω) * pf.y
            + (-cosΩ * sini) * pf.z,
            (sini * sinω) * pf.x
            + (sini * cosω) * pf.y
            + cosi * pf.z,
        );
    }

    prnToGlobal(prn: Vector, ta: Radians): Vector {
        // Convert a (prograde, radial-in, normal) vector at true anomaly `ta` to the global frame of reference
        const [p, r, n] = this._prnUnitVectors(ta);

        return p.mul(prn.x)
            .add(r.mul(prn.y))
            .add(n.mul(prn.z));
    }
    globalToPrn(g: Vector, ta: Radians): Vector {
        // Convert a global vector to a (prograde, radial-in, normal) vector at true anomaly `ta`
        const [p, r, n] = this._prnUnitVectors(ta);

        return new Vector(
            g.inner_product(p),
            g.inner_product(r),
            g.inner_product(n),
        );
    }

    nextIntercept(
        otherOrbit: Orbit,
        t: Seconds = 0,
        tEnd: Seconds = Infinity,
        accuracy: Seconds = 10,
    ): {t: number, separation: number} {
        /* Returns the time and separation of the next intercept: A minimum in the distance between the two objects.
         * Note that this may not return the closest intercept. For that, you need to iteratively call this function
         * to exhaustively search through time.
         * Sometimes, two intercepts happen very close to each other. When they are closer than `accuracy` seconds
         * apart, this function may only report one of them.
         */

        if(this.gravity !== otherOrbit.gravity) {
            console.warn('Calculating nextIntercept() between\n' +
                `${this}  and  ${otherOrbit}\n` +
                "Not in the same gravitational field!");
        }

        const d = (t) => {
            const r1 = this.positionAtT(t);
            const r2 = otherOrbit.positionAtT(t);
            const dist = r1.sub(r2).norm;
            return dist;
        };

        const dt = 1;
        let prevSepP = undefined;
        let prevT = t;
        t += accuracy;  // prevent finding the same intercept twice
        while(t < tEnd) {
            // move 1/10 revolution forward, but in a way that's compatible with parabolic/hyperbolic orbits (where period is null)
            let tStep = Math.min(
                2 * this.timeSincePeriapsisAtTa(2 * Math.PI / 20),
                2 * otherOrbit.timeSincePeriapsisAtTa(2 * Math.PI / 20)
            )

            const separation = [d(t-dt), d(t), d(t+dt)];
            const separationP = (separation[2] - separation[0]) / (2*dt);  // estimate of d/dt separation(t)
            const separationPp = (separation[2] - 2*separation[1] + separation[0]) / (dt*dt);  // estimate of d^2/dt^2 separation(t)

            if(separationP === 0 && separationPp > 0) {
                // we hit a local minima
                if(prevSepP != null) {  // and we're not at our starting point anymore
                    return {t, separation: separation[1]};
                }
            }
            if(prevSepP != null && prevSepP < 0 && separationP > 0) {
                // we jumped over a local minimum
                const min = findMinimumNelderMead(
                    x => d(x[0]) / (this.semiMajorAxis + otherOrbit.semiMajorAxis),  // normalize to be scaled around 1.0
                    [prevT],  // start searching from previousT
                    // This avoids overshooting to before prevT
                );
                return {t: min.x[0], separation: d(min.x[0])};
            }

            if(separationP < 0) {  // closing
                if(separationPp > 0) {
                    // slowing down
                    tStep = Math.min(- separationP / separationPp, tStep);
                }
            }

            prevT = t;
            t = t + Math.max(tStep, accuracy);
            prevSepP = separationP;
        }
        return null;
    }

    // public copy(modifyObject: { [P in keyof this]?: this[P] }): this {
    //     // https://mauricereigman.medium.com/immutable-typescript-classes-with-object-copywith-typesafe-a84fff3971dc
    //     return Object.assign(Object.create(this.constructor.prototype), {...this, ...modifyObject});
    // }

    private constructor(
        public readonly gravity: number,  // m^3 s^-2
        private readonly r0: Vector,  // (m, m, m)
        private readonly v0: Vector,  // (m/s, m/s, m/s)
        private readonly t0: number = 0,  // s
    ) {}

    static FromObject(o: any): Orbit {
        return new Orbit(
            o.gravity,
            new Vector(o.r0.x, o.r0.y, o.r0.z),
            new Vector(o.v0.x, o.v0.y, o.v0.z),
            o.t0,
        )
    }

    isEqual(other: Orbit): boolean {
        return (
            this.gravity == other.gravity
            && this.r0.isEqual(other.r0)
            && this.v0.isEqual(other.v0)
            && this.t0 == other.t0
        )
    }

    isValid(): boolean {
        return !(
            isNaN(this.gravity)
            || this.r0.isNaN()
            || this.v0.isNaN()
            || isNaN(this.t0)
        )
    }

    get _α(): number {
        // Reciprocal of the semi-major axis
        if(this._cache['_α'] === undefined) {
            this._cache['_α'] = 2/this.r0.norm - this.v0.norm*this.v0.norm / this.gravity;
        }
        return this._cache['_α'];
    }

    static _factorial(n: number): number {
        let p = 1;
        for(; n > 1; n--) {
            p *= n;
        }
        return p;
    }
    static _S(z: number): number {
        /* Stumpff function c_{3}
         * [OMES] 3.49
         */
        const Z = 1e-7;
        if(z > Z) {
            const sqrt_z = Math.sqrt(z);
            return (sqrt_z - Math.sin(sqrt_z)) / (z*sqrt_z);
        } else if(z < -Z) {
            const sqrt_mz = Math.sqrt(-z);
            return (Math.sinh(sqrt_mz) - sqrt_mz) / ((-z)*sqrt_mz);
        } else {  // z near 0
            // the above expressions get unstable near 0. Use series-expansion instead
            let s = 0;
            for(let k = 0; k < 5; k++) {
                s += (k%2 ? -1 : 1) * Math.pow(z, k) / Orbit._factorial(2*k+3);
            }
            return s;
        }
    }
    static _C(z: number): number {
        /* Stumpff function c_{2}
         * [OMES] 3.50
         */
        const Z = 1e-7;
        if(z > Z) {
            return (1 - Math.cos(Math.sqrt(z))) / z;
        } else if (z < -Z) {
            return (Math.cosh(Math.sqrt(-z)) - 1) / (-z);
        } else {  // z near 0
            // the above expressions get unstable near 0. Use series-expansion instead
            let s = 0;
            for(let k = 0; k < 5; k++) {
                s += (k%2 ? -1 : 1) * Math.pow(z, k) / Orbit._factorial(2*k+2);
            }
            return s;
        }
    }
    static _Sp(z: number): number {
        /* First derivative of Stumpff function c_{3}
         * [OMES] 3.60
         */
        const Z = 1e-7;
        if(Math.abs(z) < Z) {
            return -1/120;
        } else {
            return 1 / (2*z) * (Orbit._C(z) - 3 * Orbit._S(z));
        }
    }
    static _Cp(z: number): number {
        /* First derivative of Stumpff function c_{2}
         * [OMES] 3.60
         */
        const Z = 1e-7;
        if(Math.abs(z) < Z) {
            return -1/24;
        } else {
            return 1 / (2 * z) * (1 - z * Orbit._S(z) - 2 * Orbit._C(z));
        }
    }

    static _findZero(
        ffp: (x: number) => {f: number, fp: number},
        x0: number,
        tolerance: number = 1e-6,
    ): number {
        try {
            return Orbit._findZeroNewton(ffp, x0, tolerance, true);
        } catch(e) {
            if(e.error === 'did not converge') {
                // try to continue with bisecting
                // Assumes we found a low & high point, will raise otherwise
                return findZeroBisect(x => ffp(x).f, e.xl, e.xh, tolerance);
            } else {
                throw e;
            }
        }
    }
    static _findZeroNewton(
        ffp: (x: number) => {f: number, fp: number},
        x0: number,
        tolerance: number = 1e-6,
        throwForBisect: boolean = false
    ): number {
        /* Find a zero of function `f(x)` with derivative `fp(x)`
         * iteratively by using Newton's method, starting from an
         * initial guess x0.
         * Stop iterating once the steps become smaller than `tolerance`.
         * May throw if convergence is not achieved
         */
        let x = x0;
        let r = tolerance;  // bootstrap
        let maxIter = 1000;
        let xl: number, fxl: number, xh: number, fxh: number;  // keep track of bounds to fall back to bisecting mode
        while(Math.abs(r) >= tolerance && --maxIter) {
            const {f: fx, fp: fpx} = ffp(x);
            if(xl === undefined) {  // first run
                xl = x;
                fxl = fx;
            } else if(xh === undefined) {  // runs until we have a different sign: fxl * fxh < 0
                if(fxl * fx < 0) {  // different sign
                    if(x < xl) {  // swap l<->h
                        xh = xl;
                        fxh = fxl;
                        xl = x;
                        fxl = fx;
                    } else {
                        xh = x;
                        fxh = fx;
                    }
                    if(throwForBisect) {
                        /* we have f(xl) with the opposite sign from f(xh)
                         * We can break out of Newton and start bisecting
                         */
                        maxIter = 0
                        break
                    }
                }
            } else {  // narrowing
                if(fx * fxl > 0 && xl < x) {
                    xl = x;
                    fxl = fx;
                }
                if(fx * fxh > 0 && x < xh) {
                    xh = x;
                    fxh = fx;
                }
            }
            r = fx / fpx;
            x = x - r;
        }
        if(maxIter == 0) {
            throw {error: 'did not converge', xl, xh};
        }
        return x;
    }

    _universalAnomalyAtDt(
        dt: number,
        tolerance: number = 1e-6,
    ): number {
        const C = Orbit._C;  // import into namespace
        const S = Orbit._S;
        // [OMES] Algorithm 3.3
        const r_0 = this.r0.norm;
        const v_r0 = this.v0.inner_product(this.r0) / this.r0.norm;
        const µ = this.gravity;
        const α = this._α;
        let χEstimate = Math.sqrt(µ) * Math.abs(α) * dt;
        while(true) {
            const χ = Orbit._findZero(
                χ => {
                    const c1 = r_0 * v_r0 / Math.sqrt(µ) * χ;
                    const χχ = χ * χ;
                    const z = α * χχ;
                    const f = c1 * χ * C(z)
                        + (1 - α * r_0) * χχ * χ * S(z)
                        + r_0 * χ
                        - Math.sqrt(µ) * dt;
                    const fp = c1 * (1 - z * S(z))
                        + (1 - α * r_0) * χχ * C(z)
                        + r_0;
                    return {f, fp};
                },
                χEstimate,
                tolerance,
            );
            if (!isNaN(χ) && Math.abs(χ) != Infinity) return χ
            /* For hyperbolic orbits, χEstimate may be too large so that we end up
             * with (0*Inf) or (-Inf + Inf) in the formula for f
             * In that case, reduce χEstimate toward zero and try again
             */
            χEstimate = χEstimate / 2
            if(χEstimate < 1) {
                console.log("orbit: ", this, " ∆t=", dt)
                throw "Could not find universal anomaly"
            }
        }
    }

    _rAndχAtDt(dt: number): {r: Vector, χ: number} {
        // [OMES] Algorithm 3.4
        const r0_mag = this.r0.norm;
        const χ = this._universalAnomalyAtDt(dt);

        const α = this._α;
        const µ = this.gravity;
        const χχ = χ*χ;
        const f = 1 - χχ/r0_mag * Orbit._C(α * χχ);  // 3.66a
        const g = dt - 1 / Math.sqrt(µ) * χχ*χ * Orbit._S(α * χχ);  // 3.66b

        const r = this.r0.mul(f).add(this.v0.mul(g));  // 3.64

        return {r, χ};
    }

    _prnUnitVectors(ta: number): [Vector, Vector, Vector] {
        const pos = this.positionAtTa(ta);
        let prograde = this.velocityAtTa(ta);
        let normal = pos.cross_product(prograde);
        let radialIn = normal.cross_product(prograde);

        // normalize
        prograde = prograde.mul(1/prograde.norm);
        normal = normal.mul(1/normal.norm);
        radialIn = radialIn.mul(1/radialIn.norm);

        return [prograde, radialIn, normal];
    }

    get _timeSincePeriapsisOfT0(): number {
        if(this._cache['tp0'] === undefined) {
            const θ0 = this.taAtT(this.t0);
            this._cache['tp0'] = this.timeSincePeriapsisAtTa(θ0);
        }
        return this._cache['tp0'];
    }
}

export function orbitalDarkness(gravity: number, bodyRadius: number, orbitAlt: number): number {
    const r = bodyRadius + orbitAlt;

    // https://wiki.kerbalspaceprogram.com/wiki/Orbit_darkness_time
    return 2 * r * r / Math.sqrt(r * gravity) * Math.asin(bodyRadius / r);
    // See also [OMES example 3.3]
}
