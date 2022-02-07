/* References:
 *  [OMES]: Howard D. Curtis - Orbital Mechanics for Engineering Students
 *          https://en.wikipedia.org/wiki/Orbital_Mechanics_for_Engineering_Students
 *          http://www.nssc.ac.cn/wxzygx/weixin/201607/P020160718380095698873.pdf
 */

import Vector from "./vector";

type OrbitalElements = {
    sma: number,  // or parameter for parabolic orbits
    e?: number,
    argp?: number,
    inc?: number,
    lon_an?: number,
} | {
    h: Vector,
    e: Vector,
};
type OrbitalPhase = {
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

        let θ = 0, t0 = 0;
        if(orbitalPhase != null) {
            if('ma0' in orbitalPhase) {
                // Calculate true anomaly θ at t=0
                const ma0 = orbitalPhase.ma0;
                if(e_norm < 1) {  // elliptical
                    const E = Orbit._findZeroNewton( // [OMES Algorithm 3.1]
                        (E) => {
                            return {
                                f: E - e_norm * Math.sin(E) - ma0,
                                fp: 1 - e_norm * Math.cos(E),
                            }
                        },
                        ma0 < Math.PI ? ma0 + e_norm / 2 : ma0 - e_norm / 2,
                    );
                    θ = Math.acos((e_norm - Math.cos(E))
                        / (e_norm * Math.cos(E) - 1));  // [OMES 3.7b]
                    if (E > Math.PI) θ = 2 * Math.PI - θ;

                } else if(e_norm == 1) {  // parabolic
                    θ = 2 * Math.atan(
                        Math.pow(3*ma0 + Math.sqrt(9*ma0*ma0 + 1),
                            1/3)
                        - Math.pow(3*ma0 + Math.sqrt(9*ma0*ma0 + 1),
                            -1/3)
                    );  // [OMES 3.29]

                } else {  // hyperbolic
                    const F = Orbit._findZeroNewton(  // [OMES Algorithm 3.2]
                        (F) => {
                            return {
                                f: e_norm * Math.sinh(F) - F - ma0,
                                fp: e_norm * Math.cosh(F) - 1,
                            };
                        },
                        ma0,
                    );
                    θ = 2*Math.atan(
                        Math.sqrt((e_norm+1)/(e_norm-1)) * Math.tanh(F/2)
                    );  // [OMES 3.41b]
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
        // [OMES Algorithm 4.1]
        const r = this.r0.norm;
        const v = this.v0.norm;
        const vr = this.v0.inner_product(this.r0) / r;

        const h = this.specificAngularMomentumVector;
        const h_norm = this.specificAngularMomentum;
        const inc = this.inclination;

        const Ω = this.longitudeAscendingNode;

        const μ = this.gravity;
        const e = this.r0.mul(v*v - μ/r)
            .sub(this.v0.mul(r * vr))
            .mul(1 / μ);
        const e_norm = e.norm;

        const ω = this.argumentOfPeriapsis;

        let θ = Math.acos(e.inner_product(this.r0) / (e_norm * r));
        if(vr < 0) θ = 2*Math.PI - θ;

        let ma0;
        if(e_norm < 1) {  // elliptic
            const E = 2 * Math.atan(
                Math.sqrt((1-e_norm)/(1+e_norm))
                * Math.tan(θ/2)
            );  // [OMES 3.10b]
            const Me = E - e_norm * Math.sin(E);  // [OMES 3.11]
            ma0 = Me - 2*Math.PI/this.period * this.t0;

        } else if(e_norm == 1) {  // parabolic
            const Mp = 1/2 * Math.tan(θ/2)
                + 1/6 * Math.pow(Math.tan(θ/2), 3);  // [OMES 3.27]
            ma0 = Mp - μ*μ * this.t0 / (h_norm*h_norm*h_norm);

        } else {  // hyperbolic
            const F = Math.asinh(
                Math.sqrt(e_norm*e_norm - 1) * Math.sin(θ)
                / (1 + e_norm * Math.cos(θ))
            );  // [OMES 3.35]
            const Mh = e_norm * Math.sinh(F) - F;  // [OMES 3.37]
            ma0 = Mh - μ*μ / (h_norm*h_norm*h_norm) * Math.pow(e_norm*e_norm - 1, 3/2) * this.t0;  // [OMES 3.31]
        }

        return {
            sma: this.semiMajorAxis,
            h,
            e,
            inc,
            argp: ω,
            lon_an: Ω,
            ma0,
        }
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
        return 1 / this._α;
    }
    get parameter(): number {
        // Returns the parameter of the orbit
        const h = this.specificAngularMomentum;
        return h*h / this.gravity;  // [OMES 2.43]
    }
    get period(): number | null {
        if(this._cache['period'] === undefined) {
            if (this.energy < 0) {  // elliptic
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

    get argumentOfPeriapsis(): number {
        if(this._cache['argp'] === undefined) {
            let N = this.nodeLineVector;
            let N_norm = N.norm;
            const e = this.eccentricityVector;
            const e_norm = this.eccentricity;
            let ω;
            if(e_norm === 0) {  // circular
                // ArgP is undefined
                ω = 0;  // pick arbitrarily

            } else if(N_norm === 0) {  // Orbit is in XY-plane
                // Longitude of Ascending node is set arbitrarily to 0
                // Pick N = (1, 0, 0)
                ω = Math.acos(e.x / e_norm);
                if (e.z < 0) ω = 2 * Math.PI - ω;

            } else {
                ω = Math.acos(N.inner_product(e) / (N_norm * e_norm));
                if (e.z < 0) ω = 2 * Math.PI - ω;
            }
            this._cache['argp'] = ω;
        }
        return this._cache['argp'];
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

    distanceAtTa(θ: number): number {
        // [OMES] 2.35
        const h = this.specificAngularMomentum;
        const e = this.eccentricity;
        return h*h / this.gravity / (1 + e * Math.cos(θ))
    }

    positionAtTa(θ: number): Vector {
        const r_norm = this.distanceAtTa(θ);
        const r_osculating_plane = Vector.FromSpherical(r_norm, Math.PI/2, θ);
        return this.perifocalToGlobal(r_osculating_plane);
    }

    positionAtT(t: number): Vector {
        const dt = t - this.t0;
        const {r} = this._rAndχAtDt(dt);
        return r;
    }

    speedAtTa(θ: number): number {
        const r = this.distanceAtTa(θ);
        const e = this.energy;
        return Math.sqrt(2 * (e + this.gravity / r));  // [OMES] 2.48
    }

    flightAngleAtTa(θ: number): number {
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

    velocityAtTa(θ: number): Vector {
        const s = this.speedAtTa(θ);
        const fa = this.flightAngleAtTa(θ);
        const v_pf = (new Vector(s, 0, 0))
            .rotated(
                new Vector(0, 0, 1),
                θ + Math.PI/2 - fa,
            );
        return this.perifocalToGlobal(v_pf);
    }

    velocityAtT(t: number): Vector {
        const dt = t - this.t0;
        const {r, χ} = this._rAndχAtDt(dt);

        const α = this._α;
        const µ = this.gravity;
        const r_mag = r.norm;
        const r0_mag = this.r0.norm;

        const fp = Math.sqrt(µ) / (r_mag * r0_mag)
            * (α * χ*χ*χ * Orbit._S(α*χ*χ) - χ);   // 3.66c
        const gp = 1 - χ*χ / r_mag * Orbit._C(α * χ*χ);  // 3.66d

        return this.r0.mul(fp).add(this.v0.mul(gp));  // 3.65
    }

    taAtT(t: number): number {
        // Calculate the true anomaly at the given time t
        const r = this.positionAtT(t);
        const r_pf = this.globalToPerifocal(r);
        return Math.atan2(r_pf.y, r_pf.x);
    }
    tAtTa(ta: number): number {
        /* Calculate the time (parabolic, hyperbolic) or a time (elliptic) when the
         * true anomaly is `ta`
         */
        throw 'not implemented';  // TODO
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

    get _α(): number {
        // Reciprocal of the semi-major axis
        if(this._cache['_α'] === undefined) {
            this._cache['_α'] = 2/this.r0.norm - this.v0.norm*this.v0.norm / this.gravity;
        }
        return this._cache['_α'];
    }

    static _S(z: number): number {
        /* Stumpff function
         * [OMES] 3.49
         */
        if(z > 0) {
            const sqrt_z = Math.sqrt(z);
            return (sqrt_z - Math.sin(sqrt_z)) / (sqrt_z*sqrt_z*sqrt_z);
        } else if(z > 0) {
            const sqrt_mz = Math.sqrt(-z);
            return (Math.sinh(sqrt_mz) - sqrt_mz) / (sqrt_mz*sqrt_mz*sqrt_mz);
        } else {  // z == 0
            return 1/6;
        }
    }

    static _C(z: number): number {
        /* Stumpff function
         * [OMES] 3.50
         */
        if(z > 0) {
            return (1 - Math.cos(Math.sqrt(z))) / z;
        } else if (z < 0) {
            return (Math.cosh(Math.sqrt(-z)) - 1) / (-z);
        } else {  // z == 0
            return 1/2;
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
         * Stop iterating once the steps become smaller than `tolerance`
         */
        let x = x0;
        let r = tolerance;  // bootstrap
        while(Math.abs(r) >= tolerance) {
            const {f: fx, fp: fpx} = ffp(x);
            r = fx / fpx;
            x = x - r;
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
        return Orbit._findZeroNewton(
            χ => {
                const c1 = r_0 * v_r0 / Math.sqrt(µ) * χ;
                const χχ = χ*χ;
                const z = α * χχ;
                const f = c1 * χ * C(z)
                    + (1 - α * r_0) * χχ*χ * S(z)
                    + r_0 * χ - Math.sqrt(µ) * dt;
                const fp = c1 * (1 - z * S(z))
                    + (1 - α * r_0) * χχ * C(z)
                    + r_0;
                return {f, fp};
            },
           Math.sqrt(µ) * Math.abs(α) * dt,
            tolerance,
        );
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
}

export function orbitalDarkness(gravity: number, bodyRadius: number, orbitAlt: number): number {
    const r = bodyRadius + orbitAlt;

    // https://wiki.kerbalspaceprogram.com/wiki/Orbit_darkness_time
    return 2 * r * r / Math.sqrt(r * gravity) * Math.asin(bodyRadius / r);
}
