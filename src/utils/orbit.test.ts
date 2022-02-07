import Orbit from "./orbit";
import Vector from "./vector";

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
})

describe('Laws of physics', () => {
    describe.each([
        ['circular', Orbit.FromStateVector(1, new Vector(1, 0, 0), new Vector(0, 1, 0))],
        ['elliptical', Orbit.FromStateVector(2, new Vector(1, 0, 0), new Vector(0, 1, 0))],
        ['parabolic', Orbit.FromStateVector(1, new Vector(2, 0, 0), new Vector(0, 1, 0))],
        ['hyperbolic', Orbit.FromStateVector(1, new Vector(2, 0, 0), new Vector(0, 2, 0))],
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
