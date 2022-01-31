import Orbit from "./kspOrbit";

it('should have a dummy test', () => {});

describe('Orbits without gravity', () => {
    it('should have apsides', () => {
        const o = new Orbit({sma: 1, e: 0});
        expect(o.distance_at_apoapsis).toEqual(1);
        expect(o.distance_at_periapsis).toEqual(1);
        expect(o.period).toEqual(NaN);
    });

    it('should be calculated from apsides (circular)', () => {
        const {sma, e} = Orbit.sma_e_from_apsides(1, 1);
        expect(sma).toEqual(1);
        expect(e).toEqual(0);
    });

    it('should be calculated from apsides (elliptical)', () => {
        const {sma, e} = Orbit.sma_e_from_apsides(1, 2);
        expect(sma).toEqual(1.5);
        expect(e).toEqual(1/3);
    });
});