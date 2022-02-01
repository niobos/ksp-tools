import {BurstPowerCalc, ShadeCalc} from "./electricity";

describe('Burst power', () => {
    it('burst is combined correctly 1', () => {
        const bp = BurstPowerCalc.calcBurstPowerFromDevices([
            {energy: 10, interval: 100},
            {energy: 20, interval: 200},
        ]);
        expect(bp.energy).toEqual(30);
        const chargePower = bp.energy / bp.interval;
        expect(chargePower).toEqual(0.2);
        // t=100 => e = 20 - 10 = 10
        // t=200 => e = 30 - 10 - 20 = 0
    });

    it('burst is combined correctly 2', () => {
        const bp = BurstPowerCalc.calcBurstPowerFromDevices([
            {energy: 10, interval: 100},
            {energy: 40, interval: 200},
        ]);
        expect(bp.energy).toEqual(50);
        const chargePower = bp.energy / bp.interval;
        expect(chargePower).toBeCloseTo(0.3);
        // t=100 => e = 25 - 10 = 15
        // t=200 => e = 40 - 10 - 40 = 0
    });

    it('burst is combined correctly 3', () => {
        const bp = BurstPowerCalc.calcBurstPowerFromDevices([
            {energy: 10, interval: 100},
            {energy: 50, interval: 150},
        ]);
        expect(bp.energy).toEqual(60);
        const chargePower = bp.energy / bp.interval;
        expect(chargePower).toBeCloseTo(130/300);
        // t=100 => e = 43.3 - 10 = 33.3
        // t=150 => e = 55 - 50 = 5
        // t=200 => e = 26.6 - 10 = 16.6
        // t=300 => e = 60 - 50 - 10 = 0
    });
});

describe('Shade', () => {
    it("should work with empty content", () => {
        const shade = ShadeCalc.calcShade([]);
        expect(shade.duration).toEqual(0);
        expect(shade.interval).toEqual(Infinity);
    });

    it("should work with zero duration item", () => {
        const shade = ShadeCalc.calcShade([
            {d: 0, i: 7},
        ]);
        expect(shade.duration).toEqual(0);
        expect(shade.interval).toEqual(Infinity);
    });

    it('should return the single custom', () => {
        const shade = ShadeCalc.calcShade([
            {d: 5, i: 7},
        ]);
        expect(shade.duration).toEqual(5);
        expect(shade.interval).toEqual(7);
    });

    it('should calculate nighttime on Kerbin', () => {
        const shade = ShadeCalc.calcShade([
            {s: 'Kerbin'},
        ]);
        expect(shade.duration).toEqual(3*60*60);
        expect(shade.interval).toEqual(6*60*60);
    });

    it('should calculate orbital darkness around Kerbin', () => {
        const shade = ShadeCalc.calcShade([
            {o: 'Kerbin', a: 100_000},
        ]);
        expect(shade.duration).toBeCloseTo(641.8, 1);
        expect(shade.interval).toBeCloseTo(1958.1, 1);
    });

    it('should combine correctly', () => {
        const shade = ShadeCalc.calcShade([
            {d: 10, i: 100},
            {d: 30, i: 1000},
        ]);
        expect(shade.duration).toEqual(30);
        expect(shade.interval).toEqual(300);
    });
});
