import {calcFuelTank, calcMixedTankWdr} from "./calc";
import {Engine} from "../utils/kspParts-engine";
import {resourceInfoWithMods, Resources, TechTreeNode} from "../utils/kspParts";
import {dvForDm, g0} from "../utils/rocket";

const testResInfo = {
    E: {mass: 1, cost: 123},
    I: {mass: 1, cost: 123},
    I2: {mass: 1, cost: 0},
    El: {mass: 0, cost: 0},
}
const testTankInfo = {
    E: {wdr: 10, cost: 234},
    I: {wdr: null, cost: Infinity},
    I2: {wdr: null, cost: Infinity},
    El: {wdr: null, cost: 0},
}

function calcDv(
    payloadMass: number,
    engine: Engine,
    isp: number,
    res: ReturnType<typeof calcFuelTank>,
): number {
    const fuelTankEmptyMass = Object.values(res.fuelTankEmptyMass)
        .reduce((acc, i) => acc + i, 0)
    const negativeFuelMass = Object.values(
        engine.consumption.scaled(res.burnTime).mass(testResInfo)
    ).reduce((acc, i) => acc + Math.max(-i, 0), 0)
    const emptyMass = payloadMass
        + res.numEngines * engine.emptied(testResInfo).mass
        + fuelTankEmptyMass + negativeFuelMass

    const fuelInEngines = Object.values(res.fuelInEngines.mass(testResInfo))
        .reduce((acc, i) => acc + i, 0)
    const fuelInTanks = Object.values(res.fuelInTanks.mass(testResInfo))
        .reduce((acc, i) => acc + i, 0)
    const fuel = -negativeFuelMass + fuelInEngines + fuelInTanks

    return dvForDm(emptyMass + fuel, emptyMass, isp)
}

describe('mixedTankWdr', () => {
    test('all same', () => {
        const wdr = calcMixedTankWdr({'A': 8, 'B': 8, 'C': 8}, {'A': 1, 'B': 1})
        expect(wdr).toBe(8)
    })
    test('different WDR', () => {
        // ((2+6) + (1+6)) / (2 + 1)
        const wdr = calcMixedTankWdr({'A': 4, 'B': 7, 'C': 8}, {'A': 1, 'B': 1})
        expect(wdr).toBeCloseTo(15/3)
    })
    test('different flow rate', () => {
        // ((2+6) + 2*(1+6)) / (2 + 2*1)
        const wdr = calcMixedTankWdr({'A': 4, 'B': 7, 'C': 8}, {'A': 1, 'B': 2})
        expect(wdr).toBeCloseTo(22/4)
    })
})

describe('external fuel only', () => {
    const isp = 100
    const testEngine = Engine.create({
        name: "massless",
        cost: 100, mass: 0,
        ispCurve: [[0, isp], [1, isp]],
        consumption: new Resources({E: 1}),
    })
    const engineThrust = isp * g0
    test('engine', () => {
        expect(testEngine.isp(0)).toBeCloseTo(100)
        expect(testEngine.thrust(testResInfo, 0)).toBeCloseTo(engineThrust)
    })

    test('single massless engine', () => {
        // Start: 1+1.25 = 2.25; end: 1+0.125 = 1.125 = 2.25/2
        // => fuel tank of 0.125 + 1.125 = 1.25; WDR=10/1
        // 980kN for 2.25 => 435m/s^2
        const dv = isp * g0 * Math.log(2)
        const res = calcFuelTank(1, 1, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBe(0)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.125)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(1.25 - 0.125)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
        expect(res.burnTime).toBeCloseTo(1.125)
    })

    test('unobtainable', () => {
        // Tank WDR: 10/1
        // 980kN for 2.25 => 435m/s^2
        const dv = isp * g0 * Math.log(11)
        const res = calcFuelTank(1, 1, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.fuelInEngines).toBe(null)
        expect(res.fuelTankEmptyMass).toBe(null)
        expect(res.fuelInTanks).toBe(null)
        expect(res.maxDv).toBeCloseTo(isp * g0 * Math.log(10))
    })

    test('multi massless engine', () => {
        // Tank: full: 1.25; empty: 1.25/10 = 0.125
        // Start: 1+0+1.25 = 2.25; end: 1+0+0.125 = 1.125 = 2.25/2
        // 980kN / 2.25t = 435m/s^2
        const dv = isp * g0 * Math.log(2)
        const res = calcFuelTank(1, 435 + 5, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(2)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBe(0)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.125)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(1.125)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    const heavyEngine = Engine.create({
        name: "1 ton",
        cost: 100, mass: 1,
        ispCurve: [[0, isp], [1, isp]],
        consumption: new Resources({E: 1}),
    })

    test('heavy', () => {
        const dv = isp * g0 * Math.log(2)
        const res = calcFuelTank(1, 1, dv, heavyEngine, testResInfo, testTankInfo, 0)
        // Tank: full: 2.5; empty: 2.5/10 = 0.25
        // Start: 1+1+2.5 = 4.5; end: 1+1+0.25 = 2.25 = 4.5/2
        expect(res.numEngines).toBe(1)  // 980kN for 4.5t => 217
        expect(res.fuelInEngines.totalMass(testResInfo)).toBe(0)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.25)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(2.5-0.25)
        expect(calcDv(1, heavyEngine, isp, res)).toBeCloseTo(dv)
    })
})

describe('internal fuel only', () => {
    const isp = 100
    const testEngine = Engine.create({
        name: "SF",
        cost: 100, mass: 5,
        ispCurve: [[0, isp], [1, isp]],
        consumption: new Resources({I: 1}),
        content: new Resources({I: 4.5}),
    })
    const engineThrust = isp * g0
    test('engine', () => {
        expect(testEngine.isp(0)).toBeCloseTo(100)
        expect(testEngine.thrust(testResInfo, 0)).toBeCloseTo(engineThrust)
    })

    test('single, fully needed', () => {
        const dv = isp * g0 * Math.log(6/1.5)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        // start: 1+5 = 6t; end: 1+0.5 = 1.5t  => 6/1.5
        expect(res.numEngines).toBe(1)  // 980kN for 6t = 163m/s^2
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(4.5)
        expect(res.fuelTankEmptyMass).toMatchObject({})
        expect(res.fuelInTanks.totalMass(testResInfo)).toBe(0)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('single, partially needed', () => {
        const dv = isp * g0 * Math.log(3/1.5)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        // start: 1+2 = 3t; end: 1+0.5 = 1.5t  => 3/1.5
        expect(res.numEngines).toBe(1)  // 980kN for 6t = 163m/s^2
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(1.5)
        expect(res.fuelTankEmptyMass).toMatchObject({})
        expect(res.fuelInTanks.totalMass(testResInfo)).toBe(0)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('multi for thrust', () => {
        // start: 1 + (0.5+1.5) = 3t; end: 1 + 0.5 = 1.5t ; 980kN/3t = 326m/s^2
        // start: 1 + 2*(0.5+1) = 4t; end: 1 + 2*0.5 = 2t ; 2*980kN/4t = 490m/s^2
        const dv = isp * g0 * Math.log(2)
        const res = calcFuelTank(1, 400, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(2)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(2)
        expect(res.fuelTankEmptyMass).toMatchObject({})
        expect(res.fuelInTanks.totalMass(testResInfo)).toBe(0)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('multi for ∆v', () => {
        // start: 1 + 5 = 6t; end: 1 + 0.5 = 1.5t => WDR=4 => request WDR of 5
        // start: 1 + 2*5 = 11t; end: 1 + 2*0.5 = 2t => WDR=5.5
        // 980kN for 1+2*5=11t => 89m/s^2
        const dv = isp * g0 * Math.log(5.5)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(2)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(2*5 - 2*0.5)
        expect(res.fuelTankEmptyMass).toMatchObject({})
        expect(res.fuelInTanks.totalMass(testResInfo)).toBe(0)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('unobtainable', () => {
        const dv = isp * g0 * Math.log(11)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.fuelInEngines).toBe(null)
        expect(res.fuelTankEmptyMass).toBe(null)
        expect(res.fuelInTanks).toBe(null)
        expect(res.maxDv).toBeCloseTo(isp * g0 * Math.log(10))
    })
})

describe('internal & external fuel, same type', () => {
    const isp = 100
    const testEngine = Engine.create({
        name: "Dual",
        cost: 100, mass: 5,
        ispCurve: [[0, isp], [1, isp]],
        consumption: new Resources({E: 1}),
        content: new Resources({E: 4.5}),
    })
    const engineThrust = isp * g0
    test('engine', () => {
        expect(testEngine.isp(0)).toBeCloseTo(100)
        expect(testEngine.thrust(testResInfo, 0)).toBeCloseTo(engineThrust)
    })

    test('exactly needed', () => {
        // start: 1 + 5 = 6t; end: 1 + 0.5 = 1.5t
        // 980kN for 1+5=6t => 163m/s^2
        const dv = isp * g0 * Math.log(6/1.5)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(5 - 0.5)
        expect(res.fuelTankEmptyMass).toMatchObject({})
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(0)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('more needed', () => {
        // start: 1 + 5 + 5 = 11t; end: 1 + 0.5 + 0.5 = 2t
        // 980kN for 1+5+5=11t => 89m/s^2
        const dv = isp * g0 * Math.log(11/2)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(5 - 0.5)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.5)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(4.5)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('partially needed', () => {
        // start: 1 + 1 = 2t; end: 1 + 0.5 = 1.5t
        // 980kN for 1+1=2t => 490m/s^2
        const dv = isp * g0 * Math.log(2/1.5)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(1 - 0.5)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(0)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('unobtainable', () => {
        const dv = isp * g0 * Math.log(11)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.fuelInEngines).toBe(null)
        expect(res.fuelTankEmptyMass).toBe(null)
        expect(res.fuelInTanks).toBe(null)
        expect(res.maxDv).toBeCloseTo(isp * g0 * Math.log(10))
    })
})

describe('internal & external fuel, different type', () => {
    const isp = 100
    const testEngine = Engine.create({
        name: "Dual",
        cost: 100, mass: 5,
        ispCurve: [[0, isp], [1, isp]],
        consumption: new Resources({E: 0.5, I: 0.5}),
        content: new Resources({I: 4.5}),
    })
    const engineThrust = isp * g0
    test('engine', () => {
        expect(testEngine.isp(0)).toBeCloseTo(100)
        expect(testEngine.thrust(testResInfo, 0)).toBeCloseTo(engineThrust)
    })

    test('exactly needed', () => {
        // start: 1 + 5 + 5 = 11t; end: 1 + 0.5 + 0.5 = 2t
        // 980kN for 11t = 89m/s^2
        const dv = isp * g0 * Math.log(11/2)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(5 - 0.5)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.5)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(5 - 0.5)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('partially needed', () => {
        // start: 1 + (0.5+0.9) + (0.1+0.9) = 3.4t; end: 1 + 0.5 + 0.1 = 1.6t
        // 980kN for 3.4t = 288m/s^2
        const dv = isp * g0 * Math.log(3.4/1.6)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(0.9)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(0.9)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.1)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('unobtainable ∆v', () => {
        const dv = isp * g0 * Math.log(11)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.fuelInEngines).toBe(null)
        expect(res.fuelTankEmptyMass).toBe(null)
        expect(res.fuelInTanks).toBe(null)
        expect(res.maxDv).toBeCloseTo(isp * g0 * Math.log(10))
    })
})

describe('internal fuel with negative consumption + external fuel', () => {
    const isp = 100
    const testEngine = Engine.create({
        name: "Fusion + Xenon",
        cost: 100, mass: 5,
        ispCurve: [[0, isp], [1, isp]],
        consumption: new Resources({I: 1, I2: -1, E: 1}),
        content: new Resources({I: 4.5, E: 0}),
        capacity: new Resources({I: 4.5, I2: 4.5}),
    })
    const engineThrust = isp * g0
    test('engine', () => {
        expect(testEngine.isp(0)).toBeCloseTo(100)
        expect(testEngine.thrust(testResInfo, 0)).toBeCloseTo(engineThrust)
    })

    test('single', () => {
        // start: 1 + 5 + 5 = 11t; end: 1 + 5 + 0.5 = 6.5t
        // 980/11t = 89m/s^2
        const dv = isp * g0 * Math.log(11/6.5)
        const res = calcFuelTank(1, 10, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBeCloseTo(4.5)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.5)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(4.5)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })
})

describe('LF+Ox + alternator', () => {
    const isp = 100
    const testEngine = Engine.create({
        name: "massless",
        cost: 100, mass: 0,
        ispCurve: [[0, isp], [1, isp]],
        consumption: new Resources({E: 1, El: -1}),
    })
    const engineThrust = isp * g0
    test('engine', () => {
        expect(testEngine.isp(0)).toBeCloseTo(100)
        expect(testEngine.thrust(testResInfo, 0)).toBeCloseTo(engineThrust)
    })

    test('single massless engine', () => {
        // Start: 1+1.25 = 2.25; end: 1+0.125 = 1.125 = 2.25/2
        // => fuel tank of 0.125 + 1.125 = 1.25; WDR=10/1
        // 980kN for 2.25 => 435m/s^2
        const dv = isp * g0 * Math.log(2)
        const res = calcFuelTank(1, 1, dv, testEngine, testResInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBe(0)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.125)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(1.25 - 0.125)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

    test('allow alternator when El is disallowed', () => {
        const tankInfo = {
            E: {wdr: 10, cost: 234},
            I: {wdr: null, cost: Infinity},
            I2: {wdr: null, cost: Infinity},
            // no El
        }
        // Start: 1+1.25 = 2.25; end: 1+0.125 = 1.125 = 2.25/2
        // => fuel tank of 0.125 + 1.125 = 1.25; WDR=10/1
        // 980kN for 2.25 => 435m/s^2
        const dv = isp * g0 * Math.log(2)
        const res = calcFuelTank(1, 1, dv, testEngine, testResInfo, tankInfo, 0)
        expect(res.numEngines).toBe(1)
        expect(res.fuelInEngines.totalMass(testResInfo)).toBe(0)
        expect(Object.keys(res.fuelTankEmptyMass)).toEqual(["E"])
        expect(res.fuelTankEmptyMass.E).toBeCloseTo(0.125)
        expect(res.fuelInTanks.totalMass(testResInfo)).toBeCloseTo(1.25 - 0.125)
        expect(calcDv(1, testEngine, isp, res)).toBeCloseTo(dv)
    })

})

describe('previous bugs', () => {
    const resourceInfo = resourceInfoWithMods()

    test('1', () => {
        const testEngine = Engine.create({
            name: 'S2-33 "Clydesdale"',
            mass: 144,
            ispCurve: [[0, 235], [1, 210], [7, 0.001]],
            consumption: new Resources({SF: 190.926}),
            content: new Resources({SF: 16400}),
        })
        const testTankInfo = {
            "SF": {"wdr": null, "cost": null},
        }

        const res = calcFuelTank(1.5, 14.71, 4000, testEngine, resourceInfo, testTankInfo, 0)
        expect(res.numEngines).toBe(1)
    })

    test('2', () => {
        const testEngine = Engine.create({
            name: 'LV-1 "Ant"',
            cost: 110,
            mass: 0.02,
            ispCurve: [[0, 315], [1, 80], [3, 0.001]],
            consumption: new Resources({LF: 0.058, Ox: 0.071}),
        })
        const testTankInfo = {
            "LF": {"wdr": 8.601203585172813, "cost": 267.6609257640508},
            "Ox": {"wdr": 8.68999200865544, "cost": 233.49700317569634},
        }

        const acceleration = 14.71
        const pressure = 0
        const res = calcFuelTank(1.5, acceleration, 1000, testEngine, resourceInfo, testTankInfo, pressure)
        expect(res.numEngines).toBe(Math.ceil(res._wetMass * acceleration / testEngine.thrust(resourceInfo, pressure)))
    })
})
