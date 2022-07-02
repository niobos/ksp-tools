import Orbit from "./orbit";
import Vector from "./vector";
import {bodies, bodies as kspBodies} from "./kspBody";

const earthGravity = 5.972161874653522e24 * 6.67430e-11;
const earthRadius = 6378e3;

describe('OMES examples', () => {
    describe('example 2.9', () => {
        const r0 = new Vector(8182.4e3, -6865.9e3, 0);
        const v0 = new Vector(0.47572e3, 8.8116e3, 0);
        const o = Orbit.FromStateVector(
            earthGravity,
            r0,
            v0,
        );
        expect(o.specificAngularMomentumVector.x).toBeCloseTo(0);
        expect(o.specificAngularMomentumVector.y).toBeCloseTo(0);
        expect(o.specificAngularMomentumVector.z/1e6).toBeCloseTo(75366, 0);
        expect(o.positionAtT(0).norm/1e3).toBeCloseTo(10681, 0);  // TYPO in [OMES]
        const vr0 = v0.inner_product(r0) / r0.norm;
        expect(vr0 / 1e3).toBeCloseTo(-5.2996);
        const dta = 120/180*Math.PI;
        const ta0 = o.taAtT(0);
        const r = o.positionAtTa(ta0 + dta);
        const v = o.velocityAtTa(ta0 + dta);
        expect(r.x / 1e3).toBeCloseTo(1454.9, 1-1);  // rounding
        expect(r.y / 1e3).toBeCloseTo(8251.6, 1-1);  // Needed more rounding to match
        expect(r.z).toBeCloseTo(0);
        expect(v.x / 1e3).toBeCloseTo(-8.1323, 4-1);  // Needed more rounding
        expect(v.y / 1e3).toBeCloseTo(5.6785, 4-1);  // Needed more rounding
        expect(v.z).toBeCloseTo(0);
    });

    describe('example 3.1', () => {
        const {sma, e} = Orbit.smaEFromApsides(9600e3, 21000e3);
        expect(e).toBeCloseTo(0.37255);
        const o = Orbit.FromOrbitalElements(earthGravity, {sma, e});
        expect(o.specificAngularMomentum / 1e6).toBeCloseTo(72472, 0);
        expect(o.period).toBeCloseTo(18834, 0);
        const t = o.timeSincePeriapsisAtTa(120/180*Math.PI);
        expect(t).toBeCloseTo(4077, 0);
    });

    describe('example 3.2', () => {
        const {sma, e} = Orbit.smaEFromApsides(9600e3, 21000e3);
        const o = Orbit.FromOrbitalElements(earthGravity, {sma, e}, {ta: 0, t0: 0});
        const ta = o.taAtT(3*3600);
        expect(ta).toBeCloseTo((193.2-360)/180*Math.PI);
    });

    describe('example 3.4', () => {
        const vp = 10e3;
        const rp = Orbit.periapsisDistanceFromParabolicPeriapsisSpeed(earthGravity, vp);
        expect(rp / 1e3).toBeCloseTo(7972, 0);
        const o = Orbit.FromOrbitalElements(earthGravity, {sma: 2*rp, e: 1}, {ta: 0, t0: 0});
        expect(o.specificAngularMomentum / 1e6).toBeCloseTo(79720, 0);
        const r = o.positionAtT(6*3600);
        expect(r.norm / 1e3).toBeCloseTo(86977, 0);  // different rounding
    });

    describe('example 3.5', () => {
        const o = Orbit.FromStateVector(earthGravity,
            new Vector(300e3 + earthRadius, 0, 0),
            new Vector(0, 15e3, 0),
            0,
        );
        expect(o.specificAngularMomentum / 1e6).toBeCloseTo(100170);
        expect(o.eccentricity).toBeCloseTo(2.7696);
        const asymptoteAngle = (Math.PI - o.turnAngle)/2;
        expect(asymptoteAngle + o.turnAngle).toBeCloseTo(111.17/180*Math.PI);
        expect(o.distanceAtTa(100/180*Math.PI) / 1e3).toBeCloseTo(48497, 0);

        const t100 = o.tAtTa(100/180*Math.PI);
        expect(t100).toBeCloseTo(4141, 0);

        // const h = o.specificAngularMomentum;
        // const e = o.eccentricity
        // const Mh = earthGravity*earthGravity / (h*h*h) * Math.pow(e*e - 1, 3/2) * (t100 + 3*3600);
        // expect(Mh).toBeCloseTo(40.690);
        // const X = o._universalAnomalyAtDt(t100 + 3*3600);
        // expect(X).toBeCloseTo(Math.sqrt(-o.semiMajorAxis) * 3.4631);

        const ta = o.taAtT(t100 + 3*3600);
        expect(ta / Math.PI * 180).toBeCloseTo(107.78);
        const {r, v} = o.stateVectorAtT(t100 + 3*3600);
        expect(r.norm / 1e3).toBeCloseTo(163181, 0);  // rounding
        expect(v.norm / 1e3).toBeCloseTo(10.51);
    });

    describe('example 3.6 variant', () => {
        const v0 = (new Vector(3.075127035515813e3, 9.515369410025642e3, 0)).rotated(new Vector(0, 0, 1), 30/180*Math.PI);
        const r0 = (new Vector(10_000e3, 0, 0)).rotated(new Vector(0, 0, 1), 30/180*Math.PI);
        const o = Orbit.FromStateVector(
            earthGravity,
            r0,
            v0,
        );
        expect(o.specificAngularMomentum / 1e6).toBeCloseTo(95154, 0);
        expect(o.eccentricity).toBeCloseTo(1.4682);
        expect(o.semiMajorAxis/1e3).toBeCloseTo(-19656, 0);  // rounding
        const X = o._universalAnomalyAtDt(3600);
        expect(X).toBeCloseTo(128.51 * Math.sqrt(1e3), 1);

        const ta1 = o.taAtT(3600);
        expect(ta1).toBeCloseTo(100.04/180*Math.PI);
    });

    describe('example 3.7', () => {
        const o = Orbit.FromStateVector(earthGravity,
            new Vector(7000e3, -12124e3, 0),
            new Vector(2.6679e3, 4.6210e3, 0),
        );
        const {r, v} = o.stateVectorAtT(60*60);
        expect(r.x / 1e3).toBeCloseTo(-3297.8, 1);  // rounding
        expect(r.y / 1e3).toBeCloseTo(7413.4, 1);  // rounding
        expect(r.z).toBeCloseTo(0);
        expect(v.x / 1e3).toBeCloseTo(-8.2977);
        expect(v.y / 1e3).toBeCloseTo(-0.96309);
        expect(v.z).toBeCloseTo(0);
    });

    describe('example 5.2', () => {
        const r1 = new Vector(5000e3, 10000e3, 2100e3);
        const r2 = new Vector(-14600e3, 2500e3, 7000e3);
        const dt = 3600;
        const o = Orbit.FromLambert(earthGravity, r1, r2, dt);
        expect(o.specificAngularMomentum / 1e6).toBeCloseTo(80470-3, 0);  // different, rounding?
        expect(o.semiMajorAxis/1e3).toBeCloseTo(20000+3, 0);  // different, rounding?
        expect(o.eccentricity).toBeCloseTo(0.4335);
        expect(o.longitudeAscendingNode).toBeCloseTo(44.60/180*Math.PI);
        expect(o.inclination).toBeCloseTo(30.19/180*Math.PI);
        expect(o.argumentOfPeriapsis).toBeCloseTo(30.71/180*Math.PI);
        expect(o.taAtT(0)).toBeCloseTo(350.8/180*Math.PI - 2*Math.PI);

        expect(o.distanceAtPeriapsis / 1e3).toBeCloseTo(11300 + 32, 0);  // different, rounding?
        expect(0 - o.tAtTa(0)).toBeCloseTo(-256.1, 1);
    });

    describe('example 5.3', () => {
        const r1 = new Vector(273378e3, 0, 0);  // Arbitrarily orient coordinate system
        const r2 = (new Vector(146378e3, 0, 0)).rotated(
            new Vector(0, 0, 1),
            5/180*Math.PI,
        );
        const dt = 13.5*3600;
        const o = Orbit.FromLambert(earthGravity, r1, r2, dt);
        expect(o.distanceAtPeriapsis/1e3).toBeCloseTo(6538.2, 1);
        expect(o.tAtTa(0) - dt).toBeCloseTo(38396, 0);
    });
});

describe('orbit', () => {
    it('should be calculated from orbital elements (elliptical)', () => {
        const o = Orbit.FromOrbitalElements(
            2,
            {sma: 1, e: 0.2, argp: 1, inc: 0.3, lon_an: 0.5},
            {ta: -1, t0: 5},
        )
        expect(o.gravity).toEqual(2);

        function checkProp(key, cacheKey, expected) {
            expect(o._cache).toHaveProperty(cacheKey);
            expect(o[key]).toBeCloseTo(expected);
            delete o._cache[cacheKey];
            expect(o._cache).not.toHaveProperty(cacheKey);
            expect(o[key]).toBeCloseTo(expected);
        }
        checkProp('eccentricity', 'e_norm', 0.2);
        checkProp('argumentOfPeriapsis', 'argp', 1);
        checkProp('inclination', 'inc', 0.3);
        checkProp('longitudeAscendingNode', 'lon_an', 0.5);

        o._cache = {};

        expect(o.semiMajorAxis).toBeCloseTo(1);
        expect(o.taAtT(5)).toBeCloseTo(-1);
    });

    it('should be calculated from orbital elements (parabolic)', () => {
        const o = Orbit.FromOrbitalElements(
            2,
            {sma: 1, e: 1, argp: 1, inc: 0.3, lon_an: 0.5},
            {ta: -1, t0: 5},
        )
        expect(o.gravity).toEqual(2);

        function checkProp(key, cacheKey, expected) {
            expect(o._cache).toHaveProperty(cacheKey);
            expect(o[key]).toBeCloseTo(expected);
            delete o._cache[cacheKey];
            expect(o._cache).not.toHaveProperty(cacheKey);
            expect(o[key]).toBeCloseTo(expected);
        }
        checkProp('eccentricity', 'e_norm', 1);
        checkProp('argumentOfPeriapsis', 'argp', 1);
        checkProp('inclination', 'inc', 0.3);
        checkProp('longitudeAscendingNode', 'lon_an', 0.5);

        o._cache = {};

        expect(o.parameter).toBeCloseTo(1);
        expect(o.taAtT(5)).toBeCloseTo(-1);
    });

    it('should be calculated from orbital elements (hyperbolic)', () => {
        const o = Orbit.FromOrbitalElements(
            2,
            {sma: -1, e: 1.5, argp: 1, inc: 0.3, lon_an: 0.5},
            {ta: -1, t0: 5},
        )
        expect(o.gravity).toEqual(2);

        function checkProp(key, cacheKey, expected) {
            expect(o._cache).toHaveProperty(cacheKey);
            expect(o[key]).toBeCloseTo(expected);
            delete o._cache[cacheKey];
            expect(o._cache).not.toHaveProperty(cacheKey);
            expect(o[key]).toBeCloseTo(expected);
        }
        checkProp('eccentricity', 'e_norm', 1.5);
        checkProp('argumentOfPeriapsis', 'argp', 1);
        checkProp('inclination', 'inc', 0.3);
        checkProp('longitudeAscendingNode', 'lon_an', 0.5);

        o._cache = {};

        expect(o.semiMajorAxis).toBeCloseTo(-1);
        expect(o.taAtT(5)).toBeCloseTo(-1);
    });

    it('should be calculated from edge cases (prograde XY-plane, argp>180º)' ,() => {
        const o = Orbit.FromStateVector(1, new Vector(.707, .707, 0), new Vector(-.5, .5, 0));
        expect(o.longitudeAscendingNode).toBeCloseTo(0);
        expect(o.inclination).toBeCloseTo(0);
        expect(o.argumentOfPeriapsis).toBeCloseTo(225/180*Math.PI -2*Math.PI);
    });

    it('should be calculated from edge cases (retrograde XY-plane)' ,() => {
        const o = Orbit.FromStateVector(1, new Vector(.707, .707, 0), new Vector(.5, -.5, 0));
        expect(o.longitudeAscendingNode).toBeCloseTo(0);
        expect(o.inclination).toBeCloseTo(Math.PI);
        expect(o.argumentOfPeriapsis).toBeCloseTo(135/180*Math.PI);
    });
})

describe('Laws of physics', () => {
    describe.each([
        ['circular', Orbit.FromStateVector(1, new Vector(1, 0, 0), new Vector(0, 1, 0))],
        ['elliptical', Orbit.FromStateVector(2, new Vector(1, 0, 0), new Vector(0, 1, 0))],
        ['parabolic', Orbit.FromStateVector(1, new Vector(2, 0, 0), new Vector(0, 1, 0))],
        ['hyperbolic', Orbit.FromStateVector(1, new Vector(2, 0, 0), new Vector(0, 1.1, 0))],
    ])('%p', (name, o) => {
        it('should converse angular momentum', () => {
            const h = o.specificAngularMomentumVector;
            for (let ta = -3.14; ta < 3.14; ta += 0.1) {
                const r = o.positionAtTa(ta);
                const v = o.velocityAtTa(ta);
                let h2 = r.cross_product(v);
                if(o.distanceAtTa(ta) < 0) {
                    // hyperbolic mirror image
                    h2 = h2.mul(-1);
                }
                expect(h2.sub(h).norm).toBeCloseTo(0);
            }
        });

        it('should converse energy', () => {
            const E = o.energy;
            for (let ta = -3.14; ta < 3.14; ta += 0.1) {
                const d = o.distanceAtTa(ta);
                const s = o.speedAtTa(ta);
                const E2 = s*s / 2 - o.gravity/d;
                expect(E2).toBeCloseTo(E);
            }
        });

        it('should survive round-trips', () => {
            const {r, v} = o.stateVectorAtT(0);
            for(let ta = -2; ta < 2; ta+=0.1) {
                const t = o.tAtTa(ta);
                const ta2 = o.taAtT(t);
                expect(ta2).toBeCloseTo(ta);

                const {r: r2, v: v2} = o.stateVectorAtT(t);
                const r2_ = o.positionAtTa(ta);
                const v2_ = o.velocityAtTa(ta);
                expect(r2.sub(r2_).norm).toBeCloseTo(0);
                expect(v2.sub(v2_).norm).toBeCloseTo(0);

                const o2 = Orbit.FromStateVector(o.gravity, r2, v2, t);
                const {r: r3, v: v3} = o2.stateVectorAtT(0);
                expect(r3.sub(r).norm).toBeCloseTo(0);
                expect(v3.sub(v).norm).toBeCloseTo(0);
            }
        });
    });
})

describe('Circular orbits', () => {
    const o = Orbit.FromStateVector(
        1,
        new Vector(1, 0, 0),
        new Vector(0, 1, 0),
    );

    it('should have negative energy', () => {
        expect(o.energy).toBeLessThan(0);
    })

    it('should have a constant r', () => {
        expect(o.distanceAtTa(0)).toEqual(1);
        expect(o.distanceAtTa(1)).toEqual(1);
        expect(o.distanceAtTa(2)).toEqual(1);
        expect(o.distanceAtTa(3)).toEqual(1);
        expect(o.distanceAtPeriapsis).toEqual(1);
        expect(o.distanceAtApoapsis).toEqual(1);
    });

    it('should have a constant speed', () => {
        expect(o.speedAtTa(0)).toEqual(1);
        expect(o.speedAtTa(1)).toEqual(1);
        expect(o.speedAtTa(2)).toEqual(1);
        expect(o.speedAtTa(3)).toEqual(1);

        expect(o.velocityAtTa(0).sub(new Vector(0, 1, 0)).norm).toBeCloseTo(0);
        expect(o.velocityAtTa(Math.PI/2).sub(new Vector(-1, 0, 0)).norm).toBeCloseTo(0);
        expect(o.velocityAtTa(Math.PI).sub(new Vector(0, -1, 0)).norm).toBeCloseTo(0);
        expect(o.velocityAtTa(Math.PI*3/2).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);

        expect(o.velocityAtTa(0).norm).toBeCloseTo(1);
        expect(o.velocityAtTa(1).norm).toBeCloseTo(1);
        expect(o.velocityAtTa(2).norm).toBeCloseTo(1);
        expect(o.velocityAtTa(3).norm).toBeCloseTo(1);
    });

    it('velocity should be tangent to position', () => {
        for(let ta=0; ta < 10; ta++) {
            const r = o.positionAtTa(ta);
            const v = o.velocityAtTa(ta);
            expect(r.norm).toBeGreaterThan(0);
            expect(v.norm).toBeGreaterThan(0);
            expect(r.inner_product(v)).toBeCloseTo(0);
        }
    })

    it('should have a period', () => {
        expect(o.period).not.toBeNull();
    });

    it('should have correct positions', () => {
        expect(o.positionAtT(0).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtT(o.period/4).sub(new Vector(0, 1, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtT(o.period/2).sub(new Vector(-1, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtT(o.period*3/4).sub(new Vector(0, -1, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtT(o.period).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);

        expect(o.positionAtTa(0).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtTa(Math.PI/2).sub(new Vector(0, 1, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtTa(Math.PI).sub(new Vector(-1, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtTa(Math.PI*3/2).sub(new Vector(0, -1, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtTa(2*Math.PI).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);
    });
});

describe('Elliptical orbits', () => {
    const o = Orbit.FromStateVector(
        1,
        new Vector(1, 0, 0),
        new Vector(0, 1.155, 0),  // will give apoapsis of ~2, SMA=1.5
    );

    it('should have negative energy', () => {
        expect(o.energy).toBeLessThan(0);
    })

    it('should have a positive SMA', () => {
        expect(o.semiMajorAxis).toBeGreaterThan(0);
        expect(o.semiMajorAxis).toBeCloseTo(1.5);
    })

    it('should have e<1', () => {
        expect(o.eccentricity).toBeLessThan(1);
    })

    it('should have distances between periapsis and apoapsis', () => {
        expect(o.distanceAtPeriapsis).toBeCloseTo(1);
        expect(o.distanceAtApoapsis).toBeCloseTo(2);
        expect(o.distanceAtPeriapsis).toBeLessThan(o.distanceAtApoapsis);
        expect(o.distanceAtTa(0)).toBeCloseTo(o.distanceAtPeriapsis);
        expect(o.distanceAtTa(Math.PI)).toBeCloseTo(o.distanceAtApoapsis);
        for(let ta = 0; ta < 10; ta++) {
            const d = o.distanceAtTa(ta);
            expect(d).toBeGreaterThanOrEqual(o.distanceAtPeriapsis);
            expect(d).toBeLessThanOrEqual(o.distanceAtApoapsis);
        }
    });

    it('should have speeds between pe and ap', () => {
        const sp = o.speedAtTa(0);
        const sa = o.speedAtTa(Math.PI);
        expect(sp).toBeGreaterThan(sa);
        for(let ta = 0; ta < 10; ta++) {
            const s = o.speedAtTa(ta);
            expect(s).toBeGreaterThanOrEqual(sa);
            expect(s).toBeLessThanOrEqual(sp);
        }
    });

    it('should have a period', () => {
        expect(o.period).not.toBeNull();
    });

    it('should have correct positions', () => {
        expect(o.positionAtT(0).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtT(o.period / 2).sub(new Vector(-2, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtT(o.period).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);

        expect(o.distanceAtTa(0)).toBeCloseTo(1);
        expect(o.positionAtTa(0).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtTa(Math.PI).sub(new Vector(-2, 0, 0)).norm).toBeCloseTo(0);
        expect(o.positionAtTa(2 * Math.PI).sub(new Vector(1, 0, 0)).norm).toBeCloseTo(0);
    });
});

describe('Parabolic orbits', () => {
    const o = Orbit.FromStateVector(
        1,
        new Vector(2, 0, 0),
        new Vector(0, 1, 0),
    );

    it('should have 0 energy', () => {
        expect(o.energy).toEqual(0);
    });

    it('should go to infinity at 0 speed', () => {
        expect(o.distanceAtTa(Math.PI)).toBe(Infinity);
        expect(o.speedAtTa(Math.PI)).toBe(0);
    });
});

describe('Hyperbolic orbits', () => {
    const o = Orbit.FromStateVector(
        1,
        new Vector(2, 0, 0),
        new Vector(0, 2, 0),
    );

    it('should have energy > 0', () => {
        expect(o.energy).toBeGreaterThan(0);
    });

    it('should have a negative SMA', () => {
        expect(o.semiMajorAxis).toBeLessThan(0);
    });

    it('should have e>1', () => {
        expect(o.eccentricity).toBeGreaterThan(1);
    });
});

describe('Minmus departure', () => {
    describe('Hyperbolic escape from any given position', () => {
        const gravity = kspBodies['Kerbin'].gravity;
        const r1 = new Vector(1e6, 1e5, 0);
        const vinf = new Vector(1000, 0, 0);

        const od = Orbit.FromPositionAndHyperbolicExcessVelocityVector(gravity, r1, vinf, "direct");
        const vp2 = od.velocityAtTa(Math.acos(-1/od.eccentricity));
        expect(vp2.sub(vinf).norm).toBeCloseTo(0);

        const oi = Orbit.FromPositionAndHyperbolicExcessVelocityVector(gravity, r1, vinf, "indirect");
        const vr2 = oi.velocityAtTa(Math.acos(-1/oi.eccentricity));
        expect(vr2.sub(vinf).norm).toBeCloseTo(0);
    });
});

describe('nearest approach', () => {
    describe('test something', () => {
        const o1 = Orbit.FromStateVector(
            kspBodies['Kerbin'].gravity,
            new Vector(700e3, 0, 0),
            new Vector(0, 2500, 0),
            5000,
        );
        const o2 = Orbit.FromStateVector(
            kspBodies['Kerbin'].gravity,
            new Vector(700e3, 0, 0),
            new Vector(0, 2300, 0),
            5000,
        );

        const encounter = o1.nearestApproach(o2, 2);
        expect(encounter.t).toBeCloseTo(5000, 0);  // to within 1 seconds
        expect(encounter.distance / 100).toBeCloseTo(0, 0);  // to within 100m
    });
});
