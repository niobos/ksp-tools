import Vector from "./vector";
import {bodies} from "./kspBody";
import {find_zero_1d} from "./optimize";

export default class Orbit {
    constructor({
        sma = 1,  // semi major axis [m]
        e = 0,  // eccentricity []
        argp = 0,  // argument of periapsis [rad]
        inc = 0,  // inclination [rad]
        lon_an = 0,  // longitude of ascending node [rad]
        ma0 = 0,  // mean anomaly at t=0 [rad]
        gravity = undefined,  // attracting gravity field [m^3 / s^2]
    } = {}) {
        this.sma = sma;
        this.e = e;
        this.argp = argp;
        this.inc = inc;
        this.lon_an = lon_an;
        this.ma0 = ma0;
        this.gravity = gravity;
    }

    clone() {
        return new Orbit(this);
    }

    static FromStateVector(
        pos,  // position Vector()
        vel,  // velocity Vector()
        gravity,  // [m^3/s^2]
        t,  // current time, default 0
    ) {
        /* Calculates the orbit in gravity field `gravity`
         * based on a position `pos`, velocity `vel` and time `t` (default t=0).
         *
         * Returns {orbit: Orbit(), ta: number}
         */
        // https://downloads.rene-schwarz.com/download/M002-Cartesian_State_Vectors_to_Keplerian_Orbit_Elements.pdf
        t ||= 0;

        const h = pos.cross_product(vel);
        const e = vel.cross_product(h).mul(1/gravity).sub(pos.mul(1/pos.norm));
        const e_len = e.norm;

        let n = (new ksp.Vector(0, 0, 1)).cross_product(h);
        // if ||n|| == 0, the orbit is in xy-plane
        // => ascending node is undefined
        // pick (1, 0, 0) arbitrarily to avoid divide-by-zero below in arg_p calculation
        if(n.norm === 0) n = new ksp.Vector(1, 0, 0);

        let ta = e.angle_to(pos)
        const ta_sign = pos.inner_product(vel);
        if(ta_sign < 0) ta = 2 * Math.PI - ta;  // case for e==0, set ta arbitrarily to 0
        if(isNaN(ta)) ta = 0;  // e=0 case, set ta=0 arbitrarily

        let ma;
        if(e_len < 1) {  // Elliptical
            const ecc_anom = 2 * Math.atan2(
                Math.tan(ta / 2),
                Math.sqrt((1 + e_len) / (1 - e_len))
            );
            ma = ecc_anom - e_len * Math.sin(ecc_anom);
        } else if(e_len > 1) {  // Hyperbolic
            // https://space.stackexchange.com/a/27604
            const hyp_anom = 2 * Math.atanh(
                Math.tan(ta / 2) /
                Math.sqrt((e_len + 1) / (e_len - 1))
            );
            ma = e_len * Math.sinh(hyp_anom) - hyp_anom;
        } else {  // Parabolic
            ma = 0;
        }

        let arg_peri = n.angle_to(e);
        const arg_peri_sign = n.cross_product(e).inner_product(h);
        if(arg_peri_sign < 0) arg_peri = 2 * Math.PI - arg_peri;
        if(isNaN(arg_peri)) arg_peri = 0;  // e=0 case, set arg_peri=0 arbitrarily

        const vel_norm = vel.norm;
        const sma = 1. / (2 / pos.norm - vel_norm*vel_norm / gravity);
        const inc = Math.acos(h.z / h.norm);
        const lon_an = Math.atan2(n.y, n.x);

        let o;
        if(e_len < 0) throw 'BUG: got negative eccentricity';
        else if(e_len < 1) {  // Elliptical
            o = new Orbit({sma, e: e_len, argp: arg_peri, inc, lon_an, gravity});
            const mm = o.mean_motion
            o.ma0 = ma - mm * t;
        } else if(e_len === 1) {  // Parabolic
            o = new Orbit({sma: undefined, e: 1, argp: arg_peri, inc, lon_an, gravity});
            throw 'not implemented';
        } else {  // Hyperbolic
            o = new Orbit({sma, e: e_len, argp: arg_peri, inc, lon_an, gravity});
            o.ma0 = ma - t / Math.sqrt((-sma)*sma*sma / gravity);
        }
        return {
            'orbit': o,
            'ta': ta,
        };
    }

    static sma_e_from_apsides(ap1, ap2) {
        /* Return SemiMajorAxis and Eccentricity given two apsides
         */
        const apoapsis = ap1 >= ap2 ? ap1 : ap2;
        const periapsis = ap1 >= ap2 ? ap2 : ap1;

        const e = (apoapsis - periapsis) / (apoapsis + periapsis)
        const sma = apoapsis / (1. + e)
        return {sma, e};
    }
    static apsides_from_sma_e(sma, e) {
        /* Returns the apsides given SMA and eccentricity
         */
        return [
            sma * (1-e),
            sma * (1+e),
        ];
    }

    static period_from_sma(sma, gravity) {
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
    static sma_from_period(period, gravity) {
        /* Calculates the sma to get a given orbital period
         * in the given gravity field.
         */
        // https://en.wikipedia.org/wiki/Orbital_period
        return Math.pow(period*period / (4 * Math.PI * Math.PI) * gravity, 1/3)
    };
    get period() {
        /* Period of the orbit
         */
        return Orbit.period_from_sma(this.sma, this.gravity);
    }

    get semi_latus_rectum() {
        return this.sma * (1 - this.e * this.e);  // sma(1-e)(1+e)
    }

    orbital_plane_vector_to_global(v) {
        /* Convert a vector in the orbital plane (periapsis on positive x-axis, crossing towards positive y-axis)
         * to global cartesian coordinates
         */
        return v
            .rotated(new Vector(0, 0, 1), this.argp)
            .rotated(new Vector(1, 0, 0), this.inc)
            .rotated(new Vector(0, 0, 1), this.lon_an);
    }
    global_vector_to_orbital_plane(v) {
        /* Convert a global vector to the orbital plane
         */
        return v
            .rotated(new Vector(0, 0, 1), -this.lon_an)
            .rotated(new Vector(1, 0, 0), -this.inc)
            .rotated(new Vector(0, 0, 1), -this.argp);
    }
    prn_unit_vectors(ta) {
        /* Returns a (prograde, radialIn, normal) unit vector
         * at the given true anomaly
         */
        const pos = this.position_at_ta(ta);
        let prograde = this.velocity_at_ta(ta);
        let normal = pos.cross_product(prograde);
        let radial_in = normal.cross_product(prograde);

        // Normalize
        prograde = prograde.mul(1/prograde.norm);
        normal = normal.mul(1/normal.norm);
        radial_in = radial_in.mul(1/radial_in.norm);

        return [prograde, radial_in, normal];
    }
    prn_to_cartesian(ta, prn) {
        /* Convert a (Prograde, Radial-in, Normal) Vector() at True Anomaly `ta`
         * to global cartesian coordinates
         */
        const prn_unit = this.prn_unit_vectors(ta);

        return prn_unit[0].mul(prn.x)
            .add(prn_unit[1].mul(prn.y))
            .add(prn_unit[2].mul(prn.z));
    }
    cartesian_to_prn(ta, xyz) {
        /* Convert a cartesian Vector() at True Anomaly `ta`
         * to a (Prograde, Radial-in, Normal) Vector()
         */
        const prn_unit = this.prn_unit_vectors(ta);

        return new Vector(
            xyz.inner_product(prn_unit[0]),
            xyz.inner_product(prn_unit[1]),
            xyz.inner_product(prn_unit[2]),
        );
    }

    get distance_at_periapsis() {
        const [pe, ap] = this.constructor.apsides_from_sma_e(this.sma, this.e);
        return pe;
    }
    get distance_at_apoapsis() {
        const [pe, ap] = this.constructor.apsides_from_sma_e(this.sma, this.e);
        return ap;
    }

    distance_at_ta(ta) {
        return this.semi_latus_rectum / (1 + this.e * Math.cos(ta));
    }
    distance_at_t(t) {
        const ta = this.ta_at_t(t);
        return this.distance_at_ta(ta);
    }
    position_at_ta(ta) {
        const r = this.distance_at_ta(ta);
        const p_in_orbital_plane = Vector.FromSpherical(
            r,
            Math.PI/2,
            ta,
        );
        return this.orbital_plane_vector_to_global(p_in_orbital_plane);
    }
    position_at_t(t) {
        const ta = this.ta_at_t(t);
        return this.position_at_ta(ta);
    }

    speed_at_ta(ta) {
        // https://en.wikipedia.org/wiki/Vis-viva_equation
        const r = this.distance_at_ta(ta);
        let t1;
        if(r >= 0) t1 = 2 / this.distance_at_ta(ta);
        else t1 = 0;  // hyperbolic
        return Math.sqrt(
            this.gravity * (t1 - 1/this.sma)
        );
    }
    speed_at_t(t) {
        const ta = this.ta_at_t(t);
        return this.speed_at_ta(ta);
    }
    flight_angle_at_ta(ta) {
        /* Calculate the Flight Angle, the angle between the velocity vector
         * and the local horizon (i.e. perpendicular to position vector).
         * Positive values means above the horizon; negative means below.
         */
        const tan_fa = this.e * Math.sin(ta) / (
            1 + this.e * Math.cos(ta)
        )
        return Math.atan(tan_fa);
    }
    velocity_at_ta(ta) {
        const v = this.speed_at_ta(ta);
        const fa = this.flight_angle_at_ta(ta);
        const v_angle = ta + Math.PI / 2 - fa;
        const v_in_orbital_plane = new Vector(
            v * Math.cos(v_angle),
            v * Math.sin(v_angle),
            0,
        );
        return this.orbital_plane_vector_to_global(v_in_orbital_plane);
    }
    velocity_at_t(t) {
        const ta = this.ta_at_t(t);
        return this.velocity_at_ta(ta);
    }

    get mean_motion() {
        return 2 * Math.PI / this.period;
    }

    ma_at_t(t) { // Mean Anomaly at time=t
        return this.ma0 + this.mean_motion * t;
    }
    ma_from_eccentric_anomaly(ea) {
        return ea - this.e * Math.sin(ea);
    }
    eccentric_anomaly_from_ma(ma) {
        const ea = find_zero_1d((ea) => this.ma_from_eccentric_anomaly(ea) - ma, ma);
        if(ea === false) {
            throw 'eccentric anomaly did not converge';
        }
        return ea;
    }
    ta_from_eccentric_anomaly(ea) {
        // https://www.nature1st.net/bogan/orbits/kepler/e_anomly.html
        while(ea < 0) ea += 2*Math.PI;
        while(ea > 2*Math.PI) ea -= 2*Math.PI;

        let ta = Math.acos((Math.cos(ea) - this.e) / (1 - this.e * Math.cos(ea)));
        if(ea > Math.PI) ta = 2*Math.PI - ta;
        return ta;
    }
    ta_at_t(t) {
        if(this.e < 1) { // elliptical
            const ma = this.ma_at_t(t);
            const ea = this.eccentric_anomaly_from_ma(ma);
            return this.ta_from_eccentric_anomaly(ea);
        } else if(this.e > 1) { // hyperbolic
            throw 'not implemented';
        } else {  // parabolic
            throw 'not implemented';
        }
    }
    t_from_ma(ma) {
        return (ma - this.ma0) / this.mean_motion;
    }
    eccentric_anomaly_from_ta(ta) {
        // https://www.nature1st.net/bogan/orbits/kepler/e_anomly.html
        while(ta < 0) ta += 2*Math.PI;
        while(ta > 2*Math.PI) ta -= 2*Math.PI;

        let ea = Math.acos((Math.cos(ta) + this.e) / (1 + this.e * Math.cos(ta)));
        if(ta > Math.PI) ea = 2*Math.PI - ea;
        return ea;
    }
    t_from_ta(ta) {
        /* Calculate the time when the orbiter reaches the given true anomaly.
         * ta runs from 0 all the way to infinity.
         */
        let orbits = 0;
        while(ta < 0) { ta += 2*Math.PI; orbits -= 1; }
        while(ta > 2*Math.PI) { ta -= 2*Math.PI; orbits += 1; }

        const ea = this.eccentric_anomaly_from_ta(ta);
        const ma = this.ma_from_eccentric_anomaly(ea);
        const t = this.t_from_ma(ma);
        return t + orbits * this.period;
    }

    ta_from_distance(d) {
        /* Calculate *a* (not the) true anomaly when the orbit passes the given distance
         * Returns NaN for elements where the orbit doesn't reach the given distance
         */
        const cos_ta = (this.semi_latus_rectum / d - 1) / this.e;
        if(cos >= -1 && cos <= 1) {
            return Math.acos(cos_ta);
        } else {
            return NaN;
        }
    }

    do_burn(burn) {
        const ta = this.ta_at_t(burn.t);
        const pos = this.position_at_ta(ta);
        const vel = this.velocity_at_ta(ta);
        const burn_xyz = this.prn_to_cartesian(ta, burn.prn);
        const new_vel = vel.add(burn_xyz);

        const new_orbit = Orbit.FromStateVector_(pos, new_vel, this.gravity, burn.t);
        return new_orbit;
    }
    do_burn_ta(ta, prn_dv) {
        const pos = this.position_at_ta(ta);
        const vel = this.velocity_at_ta(ta);
        const burn_xyz = this.prn_to_cartesian(ta, prn_dv);
        const new_vel = vel.add(burn_xyz);

        const new_orbit = Orbit.FromStateVector_(pos, new_vel, this.gravity);
        return new_orbit;
    }

    get normal() {
        return this.orbital_plane_vector_to_global(new Vector(0, 0, 1));
    }
    ta_of_nodes_vs(other_orbit) {
        /* Returns {ascNodeTa, descNodeTa, relIncl] of this orbit vs other_orbit.
         */
        const this_h_direction = this.normal;
        const other_h_direction = other_orbit.normal;
        const an = other_h_direction.cross_product(this_h_direction);
        const an_op = this.global_vector_to_orbital_plane(an);
        // assert(an_op.z ~= 0)
        const an_ta = Math.atan2(an_op.y, an_op.x);
        return {
            ascNodeTa: an_ta,
            descNodeTa: an_ta < Math.PI ? an_ta + Math.PI : an_ta - Math.PI,
            relIncl: this_h_direction.angle_to(other_h_direction),
        };
    }

    dv_for_inclination_change(ta, delta_incl) {
        /* https://en.wikipedia.org/w/index.php?title=Orbital_inclination_change&oldid=998215180 seems wrong
         * (see Talk, or try to make an inclination change at w+f=pi)
         */
        const pos = this.position_at_ta(ta);
        const vel = this.velocity_at_ta(ta);
        const v_rotated = vel.rotated(pos, delta_incl);
        const dv = v_rotated.sub(vel);
        const dv_prn = this.cartesian_to_prn(ta, dv);
        return dv_prn;
    }
    static _dv_for_apsis(gravity, r_current, r_other_from, r_other_to) {
        /* Calculate ∆v required to change the altitude of the opposite apsis.
         *  r_current: current apsis altitude
         *  r_other_from: current opposite apsis altitude
         *  r_other_to: desired opposite apsis altitude
         * returns prograde ∆v to perform the change
         */
        const dv = Math.sqrt(2 * gravity / r_current) * (
            Math.sqrt(
                r_other_to / (r_current + r_other_to)
            ) - Math.sqrt(
                r_other_from / (r_current + r_other_from)
            )
        )
        return dv
    }
};

export const orbits = {
    'Moho': new Orbit({gravity: bodies['Kerbol'].gravity,
        sma: 5_263_138_304, e: 0.2, argp: 15/180*Math.PI, inc: 7/180*Math.PI, lon_an: 70/180*Math.PI, ma0: 3.14}),
    'Eve': new Orbit({gravity: bodies['Kerbol'].gravity,
        sma: 9_832_684_544, e: 0.01, argp: 0, inc: 2.1/180*Math.PI, lon_an: 15/180*Math.PI, ma0: 3.14}),
    'Gilly': new Orbit({gravity: bodies['Eve'].gravity,
        sma: 31_500_000, e: 0.55, argp: 10/180*Math.PI, inc: 12/180*Math.PI, lon_an: 80/180*Math.PI, ma0: 0.9}),
    'Kerbin': new Orbit({gravity: bodies['Kerbol'].gravity,
        sma: 13_599_840_256, e: 0, argp: 0, inc: 0, lon_an: 0, ma0: 3.14}),
    'Mun': new Orbit({gravity: bodies['Kerbin'].gravity,
        sma: 12_000_000, e: 0, argp: 0, inc: 0, lon_an: 0, ma0: 1.7}),
    'Minmus': new Orbit({gravity: bodies['Kerbin'].gravity,
        sma: 47_000_000, e: 0, argp: 38/180*Math.PI, inc: 6, lon_an: 78/180*Math.PI, ma0: 0.9}),
    'Duna': new Orbit({gravity: bodies['Kerbol'].gravity,
        sma: 20_726_155_264, e: 0.051, argp: 0, inc: 0.06/180*Math.PI, lon_an: 135.5/180*Math.PI, ma0: 3.14}),
    'Ike': new Orbit({gravity: bodies['Duna'].gravity,
        sma: 3_200_000, e: 0.03, argp: 0, inc: 0.2/180*Math.PI, lon_an: 0, ma0: 1.7}),
    'Dres': new Orbit({gravity: bodies['Kerbol'].gravity,
        sma: 40_839_348_203, e: 0.145, argp: 90/180*Math.PI, inc: 5/180*Math.PI, lon_an: 280/180*Math.PI, ma0: 3.14}),
    'Jool': new Orbit({gravity: bodies['Kerbol'].gravity,
        sma: 68_773_560_320, e: 0.05, argp: 0, inc: 1.304/180*Math.PI, lon_an: 52/180*Math.PI, ma0: 0.1}),
    'Laythe': new Orbit({gravity: bodies['Jool'].gravity,
        sma: 27_184_000, e: 0, argp: 0, inc: 0, lon_an: 0, ma0: 3.14}),
    'Vall': new Orbit({gravity: bodies['Jool'].gravity,
        sma: 43_152_000, e: 0, argp: 0, inc: 0, lon_an: 0, ma0: 0.9}),
    'Tylo': new Orbit({gravity: bodies['Jool'].gravity,
        sma: 68_500_000, e: 0, argp: 0, inc: 0.025/180*Math.PI, lon_an: 0, ma0: 3.14}),
    'Bop': new Orbit({gravity: bodies['Jool'].gravity,
        sma: 128_500_000, e: 0.235, argp: 25/180*Math.PI, inc: 15/180*Math.PI, lon_an: 10/180*Math.PI, ma0: 0.9}),
    'Pol': new Orbit({gravity: bodies['Jool'].gravity,
        sma: 179_890_000, e: 0.171, argp: 15/180*Math.PI, inc: 4.25/180*Math.PI, lon_an: 2/180*Math.PI, ma0: 0.9}),
    'Eeloo': new Orbit({gravity: bodies['Kerbol'].gravity,
        sma: 90_118_820_000, e: 0.26, argp: 260/180*Math.PI, inc: 6.15/180*Math.PI, lon_an: 50/180*Math.PI, ma0: 3.14}),
};

export function orbitalDarkness(bodyGravity, bodyRadius, orbitAlt) {
    const r = bodyRadius + orbitAlt;

    // https://wiki.kerbalspaceprogram.com/wiki/Orbit_darkness_time
    return 2 * r * r / Math.sqrt(r * bodyGravity) * Math.asin(bodyRadius / r);
}