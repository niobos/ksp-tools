import {Engine} from "../utils/kspParts-engine";
import {objectFilter, objectMap} from "../utils/utils";
import {g0, massBeforeDv} from "../utils/rocket";
import {Resources} from "../utils/kspParts";
import {findZeroRegulaFalsi} from "../utils/optimize";
import {findFurthestAwayLocation} from "../commnet-line-of-sight/findFurthestAwayLocation";

export type ElectricalExtraMass = {
    batteries: boolean,
    batteryDensity: number,
    batteryDuration: number,
    generator: boolean,
    generatorDensity: number,
}

function proRata(amount: number, ratio: Record<string, number>): Record<string, number> {
    const total = Object.values(ratio).reduce((acc, i) => acc + i, 0)
    return objectMap(ratio, v => v / total * amount)
}

function splitFuel(
    engine: Engine,
    fuelTankInfo: Record<string, {wdr: number, cost: number}>,
): {
    internalOnlyFuel: Resources,
    internalOrExternalFuel: Resources,
    externalOnlyFuel: Resources,
} {
    const internal: Record<string, number> = {}
    const external: Record<string, number> = {}
    const both: Record<string, number> = {}
    for (let resource in engine.consumption.amount) {
        const cost = fuelTankInfo[resource].cost
        const amount = engine.consumption.amount[resource]

        const int = engine.capacity.amount[resource] > 0
        const ext = !(cost == null || isNaN(cost) || cost == Infinity)

        if(!int && !ext) throw(`Engine ${engine.name}: ${resource} unavailable internally and externally`)
        else if(int && !ext) internal[resource] = amount
        else if(!int && ext) external[resource] = amount
        else if(int && ext) both[resource] = amount
        else throw("Unreachable")
    }
    return {
        internalOnlyFuel: new Resources(internal),
        internalOrExternalFuel: new Resources(both),
        externalOnlyFuel: new Resources(external),
    }
}

export function calcMixedTankWdr(
    tankWdr: Record<string, number>,
    massDistribution: Record<string, number>,
): number {
    const totalMass = Object.values(massDistribution).reduce((acc, i) => acc + i, 0)
    const wetMass = Object.keys(massDistribution).reduce(
        (acc, k) => acc + massDistribution[k]/totalMass * tankWdr[k] / (tankWdr[k] - 1),
        0
    )
    const dryMass = Object.keys(massDistribution).reduce(
        (acc, k) => acc + massDistribution[k]/totalMass / (tankWdr[k] - 1),
        0
    )
    return wetMass / dryMass
}

export function calcFuelTank(
    payloadMass: number,
    acceleration: number,
    dv: number,
    engine: Engine,
    resourceInfo: Record<string, { mass: number; cost: number }>,
    fuelTankInfo: Record<string, { wdr: number; cost: number }>,
    pressureValue: number,
    electricalExtraMassConfig: ElectricalExtraMass = {batteries: false, generator: false, batteryDensity: 1, batteryDuration: 1, generatorDensity: 1},
): {
    numEngines: number,
    fuelInEngines: Resources,
    fuelTankEmptyMass: Record<string, number>,
    fuelInTanks: Resources,
    maxDv: number,
    maxAcceleration: number,
    burnTime: number,
    _wetMass: number,
    _dryMass: number,
} {
    const isp = engine.isp(pressureValue)
    const engineThrust = engine.thrust(resourceInfo, pressureValue)
    const engineMassEmpty = engine.emptied(resourceInfo).mass

    const {internalOnlyFuel, externalOnlyFuel, internalOrExternalFuel} = splitFuel(engine, fuelTankInfo)

    const augmentedTankWdr = objectMap(fuelTankInfo, v => v.wdr)
    for(let res in internalOnlyFuel.amount) {
        augmentedTankWdr[res] = engine.mass / engineMassEmpty
    }
    const engineFuelMassFlow = engine.consumption.mass(resourceInfo)
    const engineTotalFuelMassFlow = Object.values(engineFuelMassFlow).reduce((acc, m) => acc + m, 0)
    const fractionFuelMassFlow = objectMap(engineFuelMassFlow, v => v / engineTotalFuelMassFlow)
    const mixedTankWdr = calcMixedTankWdr(augmentedTankWdr, engineFuelMassFlow)
    const maxAttainableDv = isp * g0 * Math.log(mixedTankWdr)

    const maxAttainableAcceleration = engineThrust / engineMassEmpty
    if(acceleration > maxAttainableAcceleration || dv > maxAttainableDv) return {
        maxAcceleration: maxAttainableAcceleration,
        maxDv: maxAttainableDv,
        numEngines: null,
        fuelInEngines: null,
        fuelTankEmptyMass: null,
        fuelInTanks: null,
        burnTime: null,
        _wetMass: null,
        _dryMass: null,
    }

    // Let's consider the engine to be just another fuel tank for Internal-only fuels
    const engineCapacityMass = engine.capacity.mass(resourceInfo);
    const internalOnlyFuelMassFlow = internalOnlyFuel.mass(resourceInfo);
    const relativeInternalOnlyFuelConsumption = objectMap(internalOnlyFuelMassFlow,
        (v, k) => engineCapacityMass[k] / Math.abs(v)
    )
    const criticalInternalOnlyFuel = Object.keys(relativeInternalOnlyFuelConsumption).reduce(
        (acc, k) => {
            const v = relativeInternalOnlyFuelConsumption[k]
            if(v < acc.v) return {k, v}
            else return acc
        },
        {k: null, v: Infinity})
    const numEnginesPerFuelMass =
        criticalInternalOnlyFuel.k == null
            ? 0
            : fractionFuelMassFlow[criticalInternalOnlyFuel.k] / engineCapacityMass[criticalInternalOnlyFuel.k]

    const electricalExtraMassPerEngine =
        (engine.consumption.amount.El ?? 0) *
        ((electricalExtraMassConfig.batteries ? (electricalExtraMassConfig.batteryDensity * electricalExtraMassConfig.batteryDuration) : 0)
        + (electricalExtraMassConfig.generator ? electricalExtraMassConfig.generatorDensity : 0))

    // F = m*a => n * F_{single engine} = m * a
    let minNumEnginesForAcceleration = Math.ceil(payloadMass * acceleration / engineThrust)

    const wdrForFuel = (f: number, minNumEngines: number) => {
        const fuelMass = proRata(f, engineFuelMassFlow)

        // W_i = (t_i + f_i) / t_i  =>  t_i = f_i / (W_i - 1)
        const externalTanks = Object.keys(externalOnlyFuel.amount).reduce(
            (acc, i) => {
                const fuel = Math.abs(fuelMass[i])
                const tank = fuel / (fuelTankInfo[i].wdr - 1)
                return acc + tank
            },
            0)

        /* For the desired acceleration
         * n * F = (m + n*m_e) * a
         * => n*F = m * a + n*m_e * a
         * => n*f -n*m_e*a = m*a
         * => n ( F - m_e*a ) = m*a
         * => n = m * a / (f - m_e*a)
         */
        const numEngines = Math.max(
            minNumEngines,
            numEnginesPerFuelMass * f,
            (payloadMass + f + externalTanks) * acceleration
            / (engineThrust - (engineMassEmpty + electricalExtraMassPerEngine) * acceleration),
            // TODO BUG: Note that we should also add the bothTanks mass, but that is circular
        )
        /* Note that we're *NOT* doing Math.ceil here
         * this way, this function is continuous so we can do Regula Falsi root finding
         */

        const bothTanks = Object.keys(internalOrExternalFuel.amount).reduce(
            (acc, i) => {
                const fuel = Math.max(0, Math.abs(fuelMass[i]) - numEngines * engineCapacityMass[i])
                const tank = fuel / (fuelTankInfo[i].wdr - 1)
                return acc + tank
            },
            0)
        /* Negative fuel mass is fuel that is being produces
         * We need to add that to the dry mass
         */
        const negativeMass = Object.values(fuelMass)
            .reduce((acc, m) => acc + Math.max(-m, 0),0)

        const dryMass =
            payloadMass
            + numEngines * (engineMassEmpty + electricalExtraMassPerEngine)
            + bothTanks + externalTanks
            + negativeMass
        const wetMass =
            dryMass
            + Object.values(fuelMass).reduce((acc, m) => acc + m, 0)

        const fuelInEngines = objectFilter(objectMap(fuelMass, (v, i) => {
            if(i in internalOnlyFuel.amount) return Math.max(0, v)
            if(i in internalOrExternalFuel.amount) return Math.min(Math.max(0, v), numEngines * engineCapacityMass[i])
            return null
        }), (_i, v) => v != null)
        const fuelInTanks = objectFilter(objectMap(fuelMass, (v, i) => {
            if(i in internalOrExternalFuel.amount) return Math.max(0, Math.max(0, v) - numEngines * engineCapacityMass[i])
            if(i in externalOnlyFuel.amount) return Math.max(0, v)
            return null
        }), (_i, v) => v != null)
        const fuelTankEmptyMass = objectMap(fuelInTanks,
            (fuel, i) => fuel / (fuelTankInfo[i].wdr - 1)
        )
        if(electricalExtraMassPerEngine != 0) {
            fuelTankEmptyMass.El = numEngines * electricalExtraMassPerEngine
        }
        //console.log(`${numEngines} × ${engine.name} with ${f} fuel: ${wetMass}/${dryMass} = ${wetMass/dryMass}`)
        return {
            wetMass, dryMass,
            wetDryRatio: wetMass / dryMass,
            numEngines,
            fuelInEngines,
            fuelInTanks,
            fuelTankEmptyMass,
        }
    }

    const neededWdr = massBeforeDv(1, dv, isp)
    const fuelMass = findZeroRegulaFalsi(
        (f) => wdrForFuel(f, minNumEnginesForAcceleration).wetDryRatio - neededWdr,
        payloadMass, 2*payloadMass,
    )

    // Now Math.ceil() the number of engines and recalculate needed thrust
    const fullResult = wdrForFuel(fuelMass, minNumEnginesForAcceleration)
    let numEngines = Math.ceil(fullResult.numEngines)

    // Run the optimizer again, with this many engines
    const fuelMassIntegerEngines = findZeroRegulaFalsi(
        (f) => wdrForFuel(f, numEngines).wetDryRatio - neededWdr,
        fuelMass, fuelMass + 1,
    )
    const fullResultIntEngines = wdrForFuel(fuelMassIntegerEngines, numEngines)

    return {
        maxAcceleration: maxAttainableAcceleration,
        maxDv: maxAttainableDv,
        numEngines: numEngines,
        fuelInEngines: Resources.FromMass(fullResultIntEngines.fuelInEngines, resourceInfo),
        fuelInTanks: Resources.FromMass(fullResultIntEngines.fuelInTanks, resourceInfo),
        fuelTankEmptyMass: fullResultIntEngines.fuelTankEmptyMass,
        burnTime: fuelMassIntegerEngines / numEngines / engineTotalFuelMassFlow,
        _wetMass: fullResultIntEngines.wetMass,
        _dryMass: fullResultIntEngines.dryMass,
    }
}