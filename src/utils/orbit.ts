/* References:
 *  [OMES]: Howard D. Curtis - Orbital Mechanics for Engineering Students
 *          https://en.wikipedia.org/wiki/Orbital_Mechanics_for_Engineering_Students
 *          http://www.nssc.ac.cn/wxzygx/weixin/201607/P020160718380095698873.pdf
 */

import Vector from "./vector";
import {minimize_Powell} from 'optimization-js';

export type OrbitalElements = {
    sma: number,  // or parameter for parabolic orbits
    e?: number,
    argp?: number,
    inc?: number,
    lon_an?: number,
} | {
    h: Vector,
    e: Vector,
};
export type OrbitalPhase = {
    ma0: number,
} | {
    ta: number,
    t0?: number,
}

// noinspection JSNonASCIINames,NonAsciiCharacters
export default class Orbit {
    _cache: object = {}

    static FromStateVector(
        gravity: number,  // m^3 s^-2
        position: Vector,  // (m, m, m)
        velocity: Vector,  // (m/s, m/s, m/s)
        time: number = 0,
    ): Orbit {
        return new Orbit(
            gravity,
            position,
            velocity,
            time,
        );
    }

    static FromOrbitalElements(
        gravity: number,
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

        let ?? = 0, t0 = 0;
        if(orbitalPhase != null) {
            if('ma0' in orbitalPhase) {
                // Calculate true anomaly ?? at t=0
                const ma0 = orbitalPhase.ma0;
                if(e_norm < 1) {  // elliptical
                    const E = Orbit._findZero( // [OMES Algorithm 3.1]
                        (E) => {
                            return {
                                f: E - e_norm * Math.sin(E) - ma0,
                                fp: 1 - e_norm * Math.cos(E),
                            }
                        },
                        ma0 < Math.PI ? ma0 + e_norm / 2 : ma0 - e_norm / 2,
                    );
                    ?? = Math.acos((e_norm - Math.cos(E))
                        / (e_norm * Math.cos(E) - 1));  // [OMES 3.7b]
                    if (E > Math.PI) ?? = 2 * Math.PI - ??;

                } else if(e_norm == 1) {  // parabolic
                    ?? = 2 * Math.atan(
                        Math.pow(3*ma0 + Math.sqrt(9*ma0*ma0 + 1),
                            1/3)
                        - Math.pow(3*ma0 + Math.sqrt(9*ma0*ma0 + 1),
                            -1/3)
                    );  // [OMES 3.29]

                } else {  // hyperbolic
                    const F = Orbit._findZero(  // [OMES Algorithm 3.2]
                        (F) => {
                            return {
                                f: e_norm * Math.sinh(F) - F - ma0,
                                fp: e_norm * Math.cosh(F) - 1,
                            };
                        },
                        ma0,
                    );
                    ?? = 2*Math.atan(
                        Math.sqrt((e_norm+1)/(e_norm-1)) * Math.tanh(F/2)
                    );  // [OMES 3.41b]
                }

            } else if('ta' in orbitalPhase) {
                ?? = orbitalPhase.ta;
                t0 = orbitalPhase.t0 || 0;
            }
        }

        // [OMES Alogirthm 4.2]
        const r_x_norm = h_norm*h_norm / gravity / (1 + e_norm * Math.cos(??));
        const r_x = new Vector(
            Math.cos(??),
            Math.sin(??),
            0,
        ).mul(r_x_norm);  // [OMES 4.37]
        const v_x = new Vector(
            -Math.sin(??),
            e_norm + Math.cos(??),
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
        sma: number,
        h: Vector,
        e: Vector,
        argp: number,
        inc: number,
        lon_an: number,
        ma0: number,
    } {
        /* Calculate the orbital elements
         * Note that the return value is redundant in several ways.
         */
        return {
            sma: this.semiMajorAxis,
            h: this.specificAngularMomentumVector,
            e: this.eccentricityVector,
            inc: this.inclination,
            argp: this.argumentOfPeriapsis,
            lon_an: this.longitudeAscendingNode,
            ma0: this.meanAnomalyAtEpoch,
        }
    }

    static FromLambert(
        gravity: number,
        position1: Vector,
        position2: Vector,
        dt: number,
        direction: "prograde" | "retrograde" = "prograde",
    ): Orbit {
        /* Solve the Lambert problem: find the orbit that will bring an object
         * from `position1` to `position2` in `dt` time, assuming a primary body
         * at the center of the coordinate system with gravity `gravity`.
         */
        // [OMES Algorithm 5.2]
        const r1_norm = position1.norm;
        const r2_norm = position2.norm;

        let d?? = position1.angle_to(position2);  // [OMES 5.26]
        const d??_quadrant = position1.cross_product(position2);
        if((direction === "prograde" && d??_quadrant.z < 0)
            || (direction === "retrograde" && d??_quadrant.z >= 0)) {
            d?? = 2*Math.PI - d??;
        }

        const A = Math.sin(d??) * Math.sqrt(r1_norm * r2_norm / (1-Math.cos(d??)));  // [OMES 5.35]

        const y = (z) => r1_norm + r2_norm + A * (z * Orbit._S(z) - 1) / (Math.sqrt(Orbit._C(z)));  // [OMES 5.38]
        const z = Orbit._findZero(
            (z) => {
                const y_z = y(z);
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
            0,
        );

        const y_z = y(z);

        // [OMES 5.46]
        const f = 1 - y_z / r1_norm;
        const g = A * Math.sqrt(y_z / gravity);
        // const fp = Math.sqrt(gravity) / (r1_norm * r2_norm) * Math.sqrt(y_z / Orbit._C(z)) * (
        //     z * Orbit._S(z) - 1
        // );
        // const gp = 1 - y_z / r2_norm;

        const v1 = position2.sub(position1.mul(f)).mul(1/g);  // [OMES 5.28]
        //const v2 = position2.mul(gp).sub(position1).mul(1/g);  // [OMES 5.29]

        return Orbit.FromStateVector(gravity, position1, v1);
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
        if(this._cache['energy'] === undefined) {
            this._cache['energy'] = this.v0.norm * this.v0.norm / 2
                - this.gravity / this.r0.norm;  // [OMES] 2.47
        }
        return this._cache['energy'];
    }

    get specificAngularMomentumVector(): Vector {
        // specific angular momentum
        if(this._cache['h'] === undefined) {
            this._cache['h'] = this.r0.cross_product(this.v0);
        }
        return this._cache['h'];
    }
    get specificAngularMomentum(): number {
        if(this._cache['h_norm'] === undefined) {
            this._cache['h_norm'] = this.specificAngularMomentumVector.norm;
        }
        return this._cache['h_norm'];
    }

    get eccentricityVector(): Vector {
        // eccentricity vector
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

    get semiMajorAxis(): number {
        // Semi-major axis
        return 1 / this._??;
    }
    get parameter(): number {
        // Returns the parameter of the orbit
        const h = this.specificAngularMomentum;
        return h*h / this.gravity;  // [OMES 2.43]
    }
    get period(): number | null {
        if(this._cache['period'] === undefined) {
            if (this.eccentricity < 1) {  // elliptic
                this._cache['period'] = 2 * Math.PI / Math.sqrt(this.gravity) * Math.pow(this.semiMajorAxis, 3 / 2);  // [OMES 2.73]
            } else {  // parabolic, hyperbolic
                this._cache['period'] = null;
            }
        }
        return this._cache['period'];
    }
    static smaFromPeriod(gravity: number, period: number): number {
        /* Calculates the sma to get a given orbital period
         * in the given gravity field.
         */
        // https://en.wikipedia.org/wiki/Orbital_period
        return Math.pow(period*period / (4 * Math.PI * Math.PI) * gravity, 1/3);
    }
    static periodFromSma(gravity: number, sma: number): number {
        /* Calculate the period of an orbit
         * given the SMA and gravity field.
         *
         * Returns undefined for hyperbolic (sma<0) and
         * parabolic (sma=NaN) orbits.
         */
        if(sma < 0) return undefined;  // hyperbolic orbits don't have a period
        if(isNaN(sma)) return undefined;  // parabolic orbits don't have a period
        // https://en.wikipedia.org/wiki/Orbital_period
        return 2 * Math.PI * Math.sqrt(sma*sma*sma / gravity);
    };
    static smaEFromApsides(ap1: number, ap2: number): {sma: number, e: number} {
        const apoapsis = ap1 >= ap2 ? ap1 : ap2;
        const periapsis = ap1 >= ap2 ? ap2 : ap1;

        const e = (apoapsis - periapsis) / (apoapsis + periapsis);
        const sma = apoapsis / (1. + e);
        return {sma, e};
    }
    static apsidesFromSmaE(sma: number, e: number): [number, number] {
        return [
            sma * (1-e),
            sma * (1+e),
        ];
    }
    static periapsisDistanceFromParabolicPeriapsisSpeed(gravity: number, speed: number): number {
        return 2 * gravity / (speed*speed); // [OMES 2.80]
    }
    get turnAngle(): number {
        // Turn angle for hyperbolic trajectory
        if(this.energy < 0) {  // elliptic
            return null;
        } else {  // parabolic (180??), hyperbolic
            return 2 * Math.asin(1/this.eccentricity);  // [OMES 2.90]
        }
    }
    get hyperbolicExcessVelocity(): number {
        if(this.energy < 0) return null
        else if(this.energy === 0) return 0;
        // else:
        return Math.sqrt(this.gravity / (-this.semiMajorAxis));  // [OMES 2.102]
    }
    static semiMajorAxisFromHyperbolicExcessVelocity(gravity: number, v: number): number {
        return -gravity / (v*v);  // from [OMES 2.102]
    }
    static FromPositionAndHyperbolicExcessVelocityVector(
        gravity: number,
        position: Vector,
        hyperbolicExcessVelocityVector: Vector,
        direction: "direct" | "indirect",
    ): Orbit {
        /* Given a position and a desired escape velocity vector, calculates
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

        function turnFromVelocityAngle(velocityAngleVsPosition: number): {turn: number, orbit: Orbit} {
            const v = position.mul(speedAtPosition/position.norm).rotated(h_dir, velocityAngleVsPosition);
            const o = Orbit.FromStateVector(gravity, position, v);
            const ta0 = o.taAtT(0);
            const tainf = Math.acos(-1/o.eccentricity);
            //console.log(o);
            //console.log(`va=${velocityAngleVsPosition}  => e=${o.eccentricity} ta0=${ta0}  tainf=${tainf}  => dta=${tainf-ta0}`);
            return {
                turn: tainf - ta0,
                orbit: o,
            };
        }

        const velocityDirection = Orbit._findZeroBisect(
            d => {
                const {turn: turnOfD} = turnFromVelocityAngle(d);
                return turnOfD - turn;
            },
            1e-8 * (direction === "direct" ? 1 : -1),
            (Math.PI - 1e-8) * (direction === "direct" ? 1 : -1),
        )
        const {orbit} = turnFromVelocityAngle(velocityDirection);

        return orbit;
    }
    static optimalPeriapsis(gravity: number, hyperbolicExcessVelocity: number): number {
        /* Calculates the optimal (in ???v terms) periapsis to switch from
         * a hyperbolic orbit into/from a circular orbit.
         */
        return 2 * gravity / (hyperbolicExcessVelocity*hyperbolicExcessVelocity);  // [OMES 8.69]
    }

    get inclination(): number {
        if(this._cache['inc'] === undefined) {
            // part of [OMES Algorithm 4.1]
            const h = this.specificAngularMomentumVector;
            const h_norm = this.specificAngularMomentum;
            this._cache['inc'] = Math.acos(h.z / h_norm);
        }
        return this._cache['inc'];
    }

    get nodeLineVector(): Vector {
        if(this._cache['N'] === undefined) {
            // part of [OMES Algorithm 4.1]
            const h = this.specificAngularMomentumVector;
            this._cache['N'] = (new Vector(0, 0, 1)).cross_product(h);
        }
        return this._cache['N'];
    }

    get longitudeAscendingNode(): number {
        if(this._cache['lon_an'] === undefined) {
            // part of [OMES Algorithm 4.1]
            const N = this.nodeLineVector;
            const N_norm = N.norm;
            let ??;
            if(N_norm === 0) {  // orbit is in XY-plane
                // ?? is undefined; pick arbitrarily
                ?? = 0;
            } else {
                ?? = Math.acos(N.x / N_norm);
                if(N.y < 0) ?? = 2*Math.PI - ??;
            }
            this._cache['lon_an'] = ??;
        }
        return this._cache['lon_an'];
    }

    get argumentOfPeriapsis(): number {
        if(this._cache['argp'] === undefined) {
            let N = this.nodeLineVector;
            let N_norm = N.norm;
            const e = this.eccentricityVector;
            const e_norm = this.eccentricity;
            let ??;
            if(e_norm === 0) {  // circular
                // ArgP is undefined
                ?? = 0;  // pick arbitrarily

            } else if(N_norm === 0) {  // Orbit is in XY-plane => e.z == 0
                // Longitude of Ascending node is set arbitrarily to 0
                // Pick N = (1, 0, 0)
                ?? = Math.atan2(e.y, e.x);
                if(this.specificAngularMomentumVector.z < 0) {  // retrograde
                    ?? = 2*Math.PI - ??;
                    if(?? > 2*Math.PI) ?? -= 2*Math.PI;
                }

            } else {
                ?? = Math.acos(N.inner_product(e) / (N_norm * e_norm));
                if (e.z < 0) ?? = 2 * Math.PI - ??;
            }
            this._cache['argp'] = ??;
        }
        return this._cache['argp'];
    }

    get meanAnomalyAtEpoch(): number {
        if(this._cache['ma0'] === undefined) {
            const r = this.r0.norm;
            const vr = this.v0.inner_product(this.r0) / r;
            const h_norm = this.specificAngularMomentum;
            const ?? = this.gravity;
            const e = this.eccentricityVector;
            const e_norm = this.eccentricity;

            let ?? = Math.acos(e.inner_product(this.r0) / (e_norm * r));
            if (vr < 0) ?? = 2 * Math.PI - ??;

            if (e_norm < 1) {  // elliptic
                const E = 2 * Math.atan(
                    Math.sqrt((1 - e_norm) / (1 + e_norm))
                    * Math.tan(?? / 2)
                );  // [OMES 3.10b]
                const Me = E - e_norm * Math.sin(E);  // [OMES 3.11]
                this._cache['ma0'] = Me - 2 * Math.PI / this.period * this.t0;

            } else if (e_norm == 1) {  // parabolic
                const Mp = 1 / 2 * Math.tan(?? / 2)
                    + 1 / 6 * Math.pow(Math.tan(?? / 2), 3);  // [OMES 3.27]
                this._cache['ma0'] = Mp - ?? * ?? * this.t0 / (h_norm * h_norm * h_norm);

            } else {  // hyperbolic
                const F = Math.asinh(
                    Math.sqrt(e_norm * e_norm - 1) * Math.sin(??)
                    / (1 + e_norm * Math.cos(??))
                );  // [OMES 3.35]
                const Mh = e_norm * Math.sinh(F) - F;  // [OMES 3.37]
                this._cache['ma0'] = Mh - ?? * ?? / (h_norm * h_norm * h_norm) * Math.pow(e_norm * e_norm - 1, 3 / 2) * this.t0;  // [OMES 3.31]
            }
        }
        return this._cache['ma0'];
    }

    get distanceAtPeriapsis(): number {
        if(this._cache['rp'] === undefined) {
            const h = this.specificAngularMomentum;
            const e = this.eccentricity;
            this._cache['rp'] = h * h / this.gravity / (1 + e);
        }
        return this._cache['rp'];
    }
    get distanceAtApoapsis(): number {
        if(this._cache['ra'] === undefined) {
            const h = this.specificAngularMomentum;
            const e = this.eccentricity;
            this._cache['ra'] = h*h / this.gravity / (1 - e);
        }
        return this._cache['ra'];
    }

    distanceAtTa(??: number): number {
        // [OMES] 2.35
        const h = this.specificAngularMomentum;
        const e = this.eccentricity;
        return h*h / this.gravity / (1 + e * Math.cos(??))
    }

    positionAtTa(??: number): Vector {
        const r_norm = this.distanceAtTa(??);
        const r_osculating_plane = Vector.FromSpherical(r_norm, Math.PI/2, ??);
        return this.perifocalToGlobal(r_osculating_plane);
    }

    positionAtT(t: number): Vector {
        const dt = t - this.t0;
        if(dt === 0) return this.r0;
        const {r} = this._rAnd??AtDt(dt);
        return r;
    }

    speedAtTa(??: number): number {
        const r = this.distanceAtTa(??);
        const e = this.energy;
        return Math.sqrt(2 * (e + this.gravity / r));  // [OMES] 2.48
    }

    flightAngleAtTa(??: number): number {
        /* Calculate the Flight Angle, the angle between the velocity vector
         * and the local horizon (i.e. perpendicular to position vector).
         * Positive values means above the horizon; negative means below.
         */
        const e = this.eccentricity;
        // [OMES 2.42]
        const tan_fa = e * Math.sin(??) / (
            1 + e * Math.cos(??)
        )
        return Math.atan(tan_fa);
    }

    velocityAtTa(??: number): Vector {
        const s = this.speedAtTa(??);
        const fa = this.flightAngleAtTa(??);
        const v_pf = (new Vector(s, 0, 0))
            .rotated(
                new Vector(0, 0, 1),
                ?? + Math.PI/2 - fa,
            );
        return this.perifocalToGlobal(v_pf);
    }

    velocityAtT(t: number): Vector {
        const {v} = this.stateVectorAtT(t);
        return v;
    }

    stateVectorAtT(t: number = 0): {r: Vector, v: Vector} {
        if(t === this.t0) return {r: this.r0, v: this.v0};

        const dt = t - this.t0;
        const {r, ??} = this._rAnd??AtDt(dt);

        const ?? = this._??;
        const ?? = this.gravity;
        const r_mag = r.norm;
        const r0_mag = this.r0.norm;

        const fp = Math.sqrt(??) / (r_mag * r0_mag)
            * (?? * ??*??*?? * Orbit._S(??*??*??) - ??);   // 3.66c
        const gp = 1 - ??*?? / r_mag * Orbit._C(?? * ??*??);  // 3.66d

        return {
            r: r,
            v: this.r0.mul(fp).add(this.v0.mul(gp)),  // 3.65
        };
    }

    taAtT(t: number): number {
        // Calculate the true anomaly at the given time t
        const r = this.positionAtT(t);
        const r_pf = this.globalToPerifocal(r);
        return Math.atan2(r_pf.y, r_pf.x);
    }
    timeSincePeriapsisAtTa(??: number): number {
        // Calculate the time since (>0, or until if <0) periapsis.
        const e = this.eccentricity;
        if(e < 1) {  // elliptic
            // [OMES Example 3.1]
            const E = 2 * Math.atan(Math.sqrt((1-e)/(1+e)) * Math.tan(??/2));  // [OMES 3.10b]
            const Me = E - e * Math.sin(E);  // [OMES 3.11]
            return Me / (2*Math.PI) * this.period;  // [OMES 3.12]

        } else if(e === 1) {  // parabolic
            const Mp = 1/2 * Math.tan(??/2) + 1/6 * Math.pow(Math.tan(??/2), 3);  // [OMES 3.27]
            const h = this.specificAngularMomentum;
            const ?? = this.gravity;
            return Mp * h*h*h / (??*??);  // from [OMES 3.28]

        } else {  // hyperbolic
            const F = 2 * Math.atanh(Math.sqrt((e-1)/(e+1)) * Math.tan(??/2));  // from [OMES 3.41a]
            const Mh = e * Math.sinh(F) - F;  // [OMES 3.37]
            const h = this.specificAngularMomentum;
            const ?? = this.gravity;
            return Mh * h*h*h / (??*??) * Math.pow(e*e - 1, -3/2);  // from [OMES 3.31]
        }
    }
    tAtTa(??: number): number {
        /* Calculate the time (parabolic, hyperbolic) or *a* time (elliptic)
         * when the true anomaly was ??.
         */
        const tp = this.timeSincePeriapsisAtTa(??);
        const tp0 = this._timeSincePeriapsisOfT0;
        return tp - tp0;
    }

    taAtDistance(r: number): number {
        /* Calculates a true anomaly where the orbit crosses distance `r`.
         * The other true anomaly will be the negative of this result.
         * Returns NaN if the specified distance is never reached.
         */
        const ?? = this.gravity;
        const h = this.specificAngularMomentum;
        const e = this.eccentricity;
        return Math.acos((h*h / (?? * r) - 1) / e); // from [OMES 2.35]
    }
    // ta of nodes vs other orbit  // TODO
    // dv for inclination change  // TODO
    // dv for apsis push  // TODO

    globalToPerifocal(g: Vector): Vector {
        // [OMES 4.43]
        const ?? = this.longitudeAscendingNode;
        const i = this.inclination;
        const ?? = this.argumentOfPeriapsis;
        const cos?? = Math.cos(??);
        const sin?? = Math.sin(??);
        const cos?? = Math.cos(??);
        const sin?? = Math.sin(??);
        const cosi = Math.cos(i);
        const sini = Math.sin(i);
        return new Vector(
            (cos?? * cos?? - sin?? * sin?? * cosi) * g.x
            + (sin?? * cos?? + cos?? * cosi * sin??) * g.y
            + (sini * sin??) * g.z,
            (-cos?? * sin?? - sin?? * cosi * cos??) * g.x
            + (-sin?? * sin?? + cos?? * cosi * cos??) * g.y
            + (sini * cos??) * g.z,
            (sin?? * sini) * g.x
            + (sini * cos??) * g.y
            + (cosi) * g.z,
        );
    }
    perifocalToGlobal(pf: Vector): Vector {
        // [OMES 4.44]
        const ?? = this.longitudeAscendingNode;
        const i = this.inclination;
        const ?? = this.argumentOfPeriapsis;
        const cos?? = Math.cos(??);
        const sin?? = Math.sin(??);
        const cos?? = Math.cos(??);
        const sin?? = Math.sin(??);
        const cosi = Math.cos(i);
        const sini = Math.sin(i);
        return new Vector(
            (cos?? * cos?? - sin?? * sin?? * cosi) * pf.x
            + (-cos?? * sin?? - sin?? * cosi * cos??) * pf.y
            + (sin?? * sini) * pf.z,
            (sin?? * cos?? + cos?? * cosi * sin??) * pf.x
            + (-sin?? * sin?? + cos?? * cosi * cos??) * pf.y
            + (-cos?? * sini) * pf.z,
            (sini * sin??) * pf.x
            + (sini * cos??) * pf.y
            + cosi * pf.z,
        );
    }

    prnToGlobal(prn: Vector, ta: number): Vector {
        // Convert a (prograde, radial-in, normal) vector at true anomaly `ta` to the global frame of reference
        const [p, r, n] = this._prnUnitVectors(ta);

        return p.mul(prn.x)
            .add(r.mul(prn.y))
            .add(n.mul(prn.z));
    }
    globalToPrn(g: Vector, ta: number): Vector {
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
        t: number = 0,
        tEnd: number = Infinity,
        accuracy: number = 10,
    ): {t: number, separation: number} {
        /* Returns the time & separation of the next intercept: A minimum in the distance between the two objects.
         * Note that this may not return the closest intercept. For that you need to iteratively call this function
         * to exhaustively search through time.
         * Sometimes, two intercepts happen very close to each other. When they are closer than `accuracy` seconds
         * apart, this function may only report one of them.
         */

        if(this.gravity !== otherOrbit.gravity) {
            console.warn('Calculating nearestApproach() between\n' +
                `${this}  and  ${otherOrbit}\n` +
                "Not in the same gravitational field!");
        }

        const d = (t) => {
            const r1 = this.positionAtT(t);
            const r2 = otherOrbit.positionAtT(t);
            const dist = r1.sub(r2).norm;
            return dist;
            // Scale to be around 1.0 for better convergence
        };

        const dt = 1;
        let prevSepP = undefined;
        while(t < tEnd) {
            console.log(`nextIntercept(): t=${t}`)
            let tStep = Math.min(this.period, otherOrbit.period) / 10;  // move 1/10 revolution forward

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
                const min = Orbit._findMinimum(
                    x => d(x[0]) / (this.semiMajorAxis + otherOrbit.semiMajorAxis),  // normalize to be scaled around 1.0
                    [t],
                );
                return {t: min.xmin[0], separation: d(min.xmin[0])};
            }

            if(separationP < 0) {  // closing
                if(separationPp > 0) {
                    // slowing down
                    tStep = Math.min(- separationP / separationPp, tStep);
                }
            }

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

    get _??(): number {
        // Reciprocal of the semi-major axis
        if(this._cache['_??'] === undefined) {
            this._cache['_??'] = 2/this.r0.norm - this.v0.norm*this.v0.norm / this.gravity;
        }
        return this._cache['_??'];
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
            return (sqrt_z - Math.sin(sqrt_z)) / (sqrt_z*sqrt_z*sqrt_z);
        } else if(z < -Z) {
            const sqrt_mz = Math.sqrt(-z);
            return (Math.sinh(sqrt_mz) - sqrt_mz) / (sqrt_mz*sqrt_mz*sqrt_mz);
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
            return Orbit._findZeroNewton(ffp, x0, tolerance);
        } catch(e) {
            if(e.error === 'did not converge') {
                // try to continue with bisecting
                // Assumes we found a low & high point, will raise otherwise
                return Orbit._findZeroBisect(x => ffp(x).f, e.xl, e.xh, tolerance);
            } else {
                throw e;
            }
        }
    }
    static _findZeroNewton(
        ffp: (x: number) => {f: number, fp: number},
        x0: number,
        tolerance: number = 1e-6,
    ): number {
        /* Find a zero of function `f(x)` with derivative `fp(x)`
         * iteratively by using Newton's method, starting from an
         * initial guess x0.
         * Stop iterating once the steps become smaller than `tolerance`.
         * May throw if convergence is not achieved
         */
        let x = x0;
        let r = tolerance;  // bootstrap
        let maxIter = 100;
        let xl, fxl, xh, fxh;  // keep track of bounds to fall back to bisecting mode
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
    static _findZeroBisect(
        f: (x: number) => number,
        a: number, b: number,
        tolerance: number = 1e-6,
    ): number {
        /* Find zero of function `f(x)` by bisecting between [a;b].
         * Expects f(a) * f(b) < 0 (i.e. should have a different sign).
         */
        let fa = f(a);
        let fb = f(b);
        if(!(fa * fb < 0)) {
            throw `Expected f(${a})=${fa} and f(${b})=${fb} to have different sign.`;
        }
        while(Math.abs(a-b) > tolerance) {
            const x = (a + b) / 2;
            const fx = f(x);
            if(fx === 0) return x;
            if(fx * fa > 0) {  // same sign
                a = x;
                fa = fx;
            } else if(fx * fb > 0) {  // same sign
                b = x;
                fb = fx;
            } else {
                throw 'Logic error';
            }
        }
        return (a+b)/2;
    }

    static _findMinimum(
        f: (x: number[]) => number,
        x0: number[],
        initialStep: number = 1,
        dxStep: number = 1,
        tolerance: number = 1e-8,
    ): {xmin: number[], fmin: number} {
        let x = [...x0];  // copy
        let error = Infinity;
        let remainingIterations = 1000;
        let previousFx;
        while(error > tolerance && --remainingIterations) {
            const fx = f(x);
            if(previousFx != null) {
                error = Math.abs(fx - previousFx);
            }
            previousFx = fx;
            const gradientX = x.map((xi, i) => {
                const xdx = [...x];
                xdx[i] += dxStep;
                const fxdx = f(xdx);
                return (fxdx - fx) / dxStep;
            });

            // Rough line-search in the direction of -gradientX
            let a = initialStep;
            let xPrevA = [...x];
            let fxPrevA = fx;
            let remainingJumps = 100;
            while(--remainingJumps) {
                const xNext = [...xPrevA];
                for (let i = 0; i < x0.length; i++) {
                    xNext[i] = x[i] - a * gradientX[i];
                }
                const fxNext = f(xNext);
                if(a >= 1 && fxNext < fxPrevA) {  // we descended, keep searching forward
                    a = 2*a;
                } else if(a <= 1 && fxNext >= fxPrevA) {  // we ascended, take smaller steps
                    a = a/2;
                } else {
                    break;
                }
                xPrevA = xNext;
                fxPrevA = fxNext;
            }
            x = xPrevA;
        }
        return {xmin: x, fmin: previousFx};
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
        const ?? = this.gravity;
        const ?? = this._??;
        return Orbit._findZero(
            ?? => {
                const c1 = r_0 * v_r0 / Math.sqrt(??) * ??;
                const ???? = ??*??;
                const z = ?? * ????;
                const f = c1 * ?? * C(z)
                    + (1 - ?? * r_0) * ????*?? * S(z)
                    + r_0 * ?? - Math.sqrt(??) * dt;
                const fp = c1 * (1 - z * S(z))
                    + (1 - ?? * r_0) * ???? * C(z)
                    + r_0;
                return {f, fp};
            },
           Math.sqrt(??) * Math.abs(??) * dt,
            tolerance,
        );
    }

    _rAnd??AtDt(dt: number): {r: Vector, ??: number} {
        // [OMES] Algorithm 3.4
        const r0_mag = this.r0.norm;
        const ?? = this._universalAnomalyAtDt(dt);

        const ?? = this._??;
        const ?? = this.gravity;
        const ???? = ??*??;
        const f = 1 - ????/r0_mag * Orbit._C(?? * ????);  // 3.66a
        const g = dt - 1 / Math.sqrt(??) * ????*?? * Orbit._S(?? * ????);  // 3.66b

        const r = this.r0.mul(f).add(this.v0.mul(g));  // 3.64

        return {r, ??};
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

        return [prograde, normal, radialIn];
    }

    get _timeSincePeriapsisOfT0(): number {
        if(this._cache['tp0'] === undefined) {
            const ??0 = this.taAtT(this.t0);
            this._cache['tp0'] = this.timeSincePeriapsisAtTa(??0);
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
