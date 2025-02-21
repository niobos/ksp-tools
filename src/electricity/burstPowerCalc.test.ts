import {calcBurstPowerFromDevices} from "./burstPowerCalc"

it('burst is combined correctly 1', () => {
    const bp = calcBurstPowerFromDevices([
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
    const bp = calcBurstPowerFromDevices([
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
    const bp = calcBurstPowerFromDevices([
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
