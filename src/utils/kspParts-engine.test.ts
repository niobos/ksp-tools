import {Engine} from "./kspParts-engine";
import {resourceInfoWithMods, Resources} from "./kspParts";

const resourceInfo = resourceInfoWithMods(new Set(['NFT', 'FFT']))

test('scale consumption for maxThrust', () => {
    const e = Engine.create({
        name: "X-6 'Clarke'",
        cost: 195_000,
        mass: 10.8228,
        size: new Set(["2"]),
        gimbal: 1,
        ispCurve: [[0, 350_000], [1, 10], [4, 2]],
        consumption: new Resources({EnrU: 1}),
        _maxThrust: 12,
        content: new Resources({EnrU: 75}),
    })
    expect(e.thrust(resourceInfo, 0)).toBeCloseTo(12)
})