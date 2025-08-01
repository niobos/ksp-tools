import * as React from "react"
import {ReactNode, useState} from "react"
import ReactDOM from "react-dom"
import {FloatInput, SiInput} from "formattedInput"
import {formatValueYdhms, KerbalYdhmsInput} from "../components/formattedInput"
import useFragmentState from 'useFragmentState'
import Preset from "../components/preset"
import SortableTable from "sortableTable"
import FuelTank from "../components/fuelTank"
import {fuelTanksWithMods} from "../utils/kspParts-fuelTanks"
import {Battery, Convertor, electricalPartsWithMods, RTG, SolarPanel} from "../utils/kspParts-electric"
import {fromPreset, objectMap} from "../utils/utils"
import {kspSystem, KspSystem} from "../utils/kspSystems"
import {
    calcPowerFromDevices as calcContinuousPowerFromDevices,
    ContinuousPowerCalc,
    customOnly as ContinuousPowerCalcCustomOnly,
    fromString as ContinuousPowerCalcFromString,
    toString as ContinuousPowerCalcToString,
} from "./continuousPowerCalc"
import {
    BurstPowerCalc,
    calcBurstPowerFromDevices,
    fromEnergyInterval as BurstFromEnergyInterval,
    fromString as BurstPowerCalcFromString,
    toString as BurstPowerCalcToString,
} from "./burstPowerCalc"
import {
    calcShade,
    custom as ShadeCustom,
    fromString as ShadeCalcFromString,
    ShadeCalc,
    toString as ShadeCalcToString,
} from "./shadeCalc"
import KspModSelector from "../components/kspModSelector"
import {KspFund} from "../components/kspIcon"
import Part, {resourceInfoWithMods} from "../utils/kspParts";
import CopyableNumber from "../components/copyableNumber";
import knapsackMinimize, {Combo, ComboCost} from "../utils/knapsackMinimize";

import './app.css'
import {findZeroRegulaFalsi} from "../utils/optimize";
import useMultiState from "../utils/useMultiState";
import useLocalStorageState from "useLocalStorageState";

function solarPanelEfficiencyFromSunDistance(system: KspSystem, d: number): number {
    const homeWorldSma = system.defaultBody.orbit.semiMajorAxis
    return 1 / Math.pow(d/homeWorldSma, 2)
}
function sunDistanceFromSolarPanelEfficiency(system: KspSystem, e: number): number {
    const homeWorldSma = system.defaultBody.orbit.semiMajorAxis
    return Math.sqrt(1/e) * homeWorldSma
}

type Solution = {
    config: ReactNode
    cost: number
    totalMass: number
    generatorMass: number
    fuelTankMass: number
    maxPower: number
    nominalPower: number
    sparePower: number
    endurance: number
}
const columns = [
    {title: 'Config', value: i => i.config},
    {
        title: <>Cost [<KspFund/>]</>,
        value: (i: Solution) => <CopyableNumber value={i.cost} displayDecimals={0}/>,
        classList: (i: Solution) => isNaN(i.cost) ? ['number', 'zero'] : ['number'],
        cmp: (a: Solution, b: Solution) => a.cost - b.cost,
    },
    {
        title: 'Mass [t]',
        children: [
            {
                title: 'Total', classList: 'number',
                value: (i: Solution) => <CopyableNumber value={i.totalMass} displayDecimals={2}/>,
                cmp: (a: Solution, b: Solution) => a.totalMass - b.totalMass,
            },
            {
                title: 'Gen', classList: 'number',
                value: (i: Solution) => <CopyableNumber value={i.generatorMass} displayDecimals={2}/>,
                cmp: (a: Solution, b: Solution) => a.generatorMass - b.generatorMass,
            },
            {
                title: 'Fuel&Tank',
                value: (i: Solution) => <CopyableNumber value={i.fuelTankMass} displayDecimals={2}/>,
                cmp: (a: Solution, b: Solution) => a.fuelTankMass - b.fuelTankMass,
                classList: (i: Solution) => i.fuelTankMass == 0 ? ['number', 'zero'] : ['number'],
            },
        ],
    },
    {
        title: <>Power [⚡/s]</>,
        children: [
            {
                title: <>Peak</>, classList: 'number',
                value: (i: Solution) => <CopyableNumber value={i.maxPower} displayDecimals={0}/>,
                cmp: (a: Solution, b: Solution) => a.maxPower - b.maxPower,
            },
            {
                title: <>Nominal</>, classList: 'number',
                value: (i: Solution) => <CopyableNumber value={i.nominalPower} displayDecimals={0}/>,
                cmp: (a: Solution, b: Solution) => a.nominalPower - b.nominalPower,
            },
            {
                title: <>Spare</>, classList: 'number',
                value: (i: Solution) => <CopyableNumber value={i.sparePower} displayDecimals={0}/>,
                cmp: (a: Solution, b: Solution) => a.sparePower - b.sparePower,
            },
        ],
    },
    {
        title: <>Endurance</>, classList: 'number',
        value: (i: Solution) => {
            if(i.endurance == Infinity) return "∞"
            return formatValueYdhms(i.endurance, 1)
        },
        cmp: (a: Solution, b: Solution) => a.maxPower - b.maxPower,
    },
]


function formatPower(power: number): string {
    if(power < 0.1) {
        power *= 60
        if(power < 0.1) {
            power *= 60
            return `${power.toFixed(1)}⚡/h`
        } else {
            return `${power.toFixed(1)}⚡/m`
        }
    } else {
        return `${power.toFixed(1)}⚡/s`
    }
}

function findBestBatteryCombination(
        electricalParts: Array<Part>,
        energy: number,
        costFunc: (p: Part) => number
): ComboCost<Part> {
    const {combination, cost, value} = knapsackMinimize(
        electricalParts.filter(p => p instanceof Battery).map(p => (
            {value: p.content.amount.El, cost: costFunc(p), part: p}
        )),
        energy
    )
    return {
        combination: combination.map(c => ({n: c.n, item: c.item.part})),
        cost: cost,
        value: value,
    }
}
function formatCombination<T>(
        combination: Array<{n: number, item: T}>,
        nameF: (p: T) => ReactNode,
): ReactNode {
    if(combination.length == 0) return <>0</>
    const p = []
    for(let {n: num, item: part} of combination) {
        if(p.length) p.push(" + ")
        p.push(<>{num} × {nameF(part)}</>)
    }
    return <>{p}</>
}
function formatCombinationUnit(
        cc: ComboCost<Part>,
        unit: ReactNode
): ReactNode {
    return <>{formatCombination(cc.combination, p => p.name)} (<CopyableNumber value={cc.cost} displayDecimals={1}/>{unit})</>
}

function calcEndurance(combo: Combo<RTG>, power: number): number {
    /* power = sum_{i} initialPower_{i} / 2^(t / halfLife_{i})
     * => power = sum_{i} initialPower_{i} * (1/2)^(t / halfLife_{i}) )
     * => power = sum_{i} initialPower_{i} * exp(ln(1/2) * t / halfLife_{i}) )
     * => ???
     */
    const endurance = findZeroRegulaFalsi(
        (t: number) => {
            const powerAvail = combo.reduce(
                (acc, c) => {
                    const halfLifes = t / c.item.halfLife
                    return acc + c[0] * (-c.item.consumption.amount.El) / Math.pow(2, halfLifes)
                },
                0,
            )
            return powerAvail - power
        },
        0, 426*6*60*60 /* 1 year */,
    )
    if(isNaN(endurance)) return Infinity
    return endurance
}

export default function App() {
    const [activeMods, setActiveMods] = useMultiState<Set<string>>(
        [
            useFragmentState<Set<string>>("mod",
                s => {
                    if(s == null) return null
                    const v: Array<string> = JSON.parse(s)
                    return new Set(v)
                },
                o => JSON.stringify([...o]),
            ),
            useLocalStorageState<Set<string>>('ksp-active-mods',
                s => {
                    if(s == null) return null
                    const v: Array<string> = JSON.parse(s)
                    return new Set(v)
                },
                o => JSON.stringify([...o]),
            ),
        ],
        new Set(),
    )
    const resourceInfo = resourceInfoWithMods(activeMods)

    const [burstPowerConfig, setBurstPowerConfig] = useFragmentState('b', BurstPowerCalcFromString, BurstPowerCalcToString)
    const [burstPowerCalcOpen, setBurstPowerCalcOpen] = useState(false)
    const [continuousPower, setContinuousPower] = useFragmentState('c', ContinuousPowerCalcFromString, ContinuousPowerCalcToString)
    const [continuousPowerCalcOpen, setContinuousPowerCalcOpen] = useState(false)
    const [storageOtherParts, setStorageOtherParts] = useFragmentState<number>('so', 0)
    const [missionDuration, setMissionDuration] = useFragmentState('d', 10 * 6 * 60 * 60)
    const [fuelTank, setFuelTank] = useFragmentState<{fullEmptyRatio: number, cost: number} | string>(
        'ft', {fullEmptyRatio: 8.69, cost: 233.50})
    const [solarEfficiency, setSolarEfficiency] = useFragmentState('s', 1.00)
    const [shade, setShade] = useFragmentState('S', ShadeCalcFromString, ShadeCalcToString)
    const [shadeCalcOpen, setShadeCalcOpen] = useState(false)

    const system = kspSystem(activeMods)

    const burstPowerTotal = calcBurstPowerFromDevices(burstPowerConfig)

    const continuousPowerValue = calcContinuousPowerFromDevices(continuousPower)

    const shadeValue = calcShade(system, shade)
    const shadeEnergy = shadeValue.duration * continuousPowerValue
    const shadePower = shadeEnergy / (shadeValue.interval - shadeValue.duration)

    const fuelTanks = fuelTanksWithMods(activeMods)
    const {value: fuelTankValue, preset: fuelTankPreset} = fromPreset(
        fuelTank, fuelTanks.reduce((acc, ft) => {
            acc[ft.name] = {fullEmptyRatio: ft.mass / ft.emptied(resourceInfo).mass, cost: ft.cost / ft.mass}
            return acc
        }, {})
    )

    const netStorageNonSolar = Math.max(0, burstPowerTotal.energy - storageOtherParts)
    const netStorageSolar = Math.max(0, burstPowerTotal.energy - storageOtherParts + shadeEnergy)
    const totalPowerNeeded = continuousPowerValue + burstPowerTotal.energy/burstPowerTotal.interval
    const totalSolarPowerNeeded = totalPowerNeeded + shadePower;

    const electricalParts = electricalPartsWithMods(activeMods)
    const batteryParts = electricalParts.filter(p => p instanceof Battery)
    const solarParts = electricalParts.filter(p => p instanceof SolarPanel)

    const solutions: Array<{combo: Combo<{name: string, cost: number, mass: number }>, fuel?: {mass: number, cost: number}, maxPower: number, nominalPower: number, endurance: number}> = []
    {
        const solarMinCost = knapsackMinimize(
            solarParts.map(p => ({value: -p.consumption.amount.El * solarEfficiency, cost: p.cost, part: p})),
            totalSolarPowerNeeded,
        )
        const combo = solarMinCost.combination.map(c => ({n: c.n, item: c.item.part}))
        solutions.push({
            combo: combo,
            maxPower: solarMinCost.value,
            nominalPower: totalSolarPowerNeeded,
            endurance: Infinity,
        })
    }
    {
        const solarMinMass = knapsackMinimize(
            solarParts.map(p => ({value: -p.consumption.amount.El * solarEfficiency, cost: p.mass, part: p})),
            totalSolarPowerNeeded,
        )
        const combo = solarMinMass.combination.map(c => ({n: c.n, item: c.item.part}))
        solutions.push({
            combo: combo,
            maxPower: solarMinMass.value,
            nominalPower: totalSolarPowerNeeded,
            endurance: Infinity,
        })
    }

    // RTGs
    {
        const rtgMinCost = knapsackMinimize(
            electricalParts.filter(p => p instanceof RTG).map(p => {
                const missionDurationHalfLifes = missionDuration / p.halfLife
                const powerAtEndOfMission = -p.consumption.amount.El / Math.pow(2, missionDurationHalfLifes)
                return {value: powerAtEndOfMission, cost: p.cost, part: p}
            }),
            totalPowerNeeded,
        )
        const combo = rtgMinCost.combination.map(c => ({n: c.n, item: c.item.part as RTG}))
        solutions.push({
            combo: combo,
            maxPower: rtgMinCost.value,
            nominalPower: totalPowerNeeded,
            endurance: calcEndurance(combo, totalPowerNeeded),
        })
    }
    {
        const rtgMinMass = knapsackMinimize(
            electricalParts.filter(p => p instanceof RTG).map(p => {
                const missionDurationHalfLifes = missionDuration / p.halfLife
                const powerAtEndOfMission = -p.consumption.amount.El / Math.pow(2, missionDurationHalfLifes)
                return {value: powerAtEndOfMission, cost: p.mass, part: p}
            }),
            totalPowerNeeded,
        )
        const combo = rtgMinMass.combination.map(c => ({n: c.n, item: c.item.part as RTG}))
        solutions.push({
            combo: combo,
            maxPower: rtgMinMass.value,
            nominalPower: totalPowerNeeded,
            endurance: calcEndurance(combo, totalPowerNeeded),
        })
    }

    // Convertor
    // TODO: combine multiple devices together in Knapsack-style
    for(let conv of electricalParts.filter(p => p instanceof Convertor)) {
        const numDevices = Math.ceil(totalPowerNeeded / (-conv.consumption.amount.El))
        let modulation = (totalPowerNeeded / numDevices / (-conv.consumption.amount.El) )
        modulation = Math.max(modulation, conv.minimumModulation)
        const fullLoadTime = missionDuration * modulation
        const consumptionMassFlow = conv.consumption.selectiveMass(resourceInfo, (_r, m) => m > 0);
        const neededFuelMass = fullLoadTime * consumptionMassFlow
        const neededFuelMassInTanks = Math.max(0, neededFuelMass - conv.content.totalMass(resourceInfo))
        /* fullTank = emptyTank + fuel
         * fullTank / emptyTank = WDR  => emptyTank = fullTank / WDR
         * fullTank = fullTank / WDR + fuel
         * (1 - 1/WDR) fullTank = fuel
         * fullTank = fuel / (1 - 1/WDR)
         */
        const neededTankMass = neededFuelMassInTanks / (1 - 1 / fuelTankValue.fullEmptyRatio)

        const totalFuelMass = neededFuelMassInTanks + conv.content.totalMass(resourceInfo)

        solutions.push({
            combo: [{n: numDevices, item: conv}],
            fuel: {mass: neededTankMass, cost: neededTankMass * fuelTankValue.cost},
            maxPower: numDevices * (-conv.consumption.amount.El),
            nominalPower: totalPowerNeeded,
            endurance: totalFuelMass / consumptionMassFlow / modulation,
        })
    }

    const enrichedSolutions: Array<Solution> = solutions.map(solution => {
        const genMass = solution.combo.reduce((acc, p) => acc + p.n * p.item.mass, 0)
        const fuelTankMass = solution.fuel != null ? solution.fuel.mass : 0
        const fuelTankCost = solution.fuel != null ? solution.fuel.cost : 0
        return {
            config: formatCombination(solution.combo, p => p.name),
            cost: solution.combo.reduce((acc, p) => acc + p.n * p.item.cost, 0) + fuelTankCost,
            totalMass: genMass + fuelTankMass,
            generatorMass: genMass,
            fuelTankMass: fuelTankMass,
            maxPower: solution.maxPower,
            nominalPower: solution.nominalPower,
            sparePower: solution.maxPower - solution.nominalPower,
            endurance: solution.endurance,
        }
    })

    return <div>
        <h1>Electricity options</h1>
        <KspModSelector value={activeMods}
                        onChange={setActiveMods}/>

        <h2>Solar situation</h2>
        Panel efficiency: <FloatInput decimals={0} value={solarEfficiency * 100}
                                      onChange={v => setSolarEfficiency(v / 100)}
    />%, equivalent to a distance to the sun of <SiInput
        value={sunDistanceFromSolarPanelEfficiency(system, solarEfficiency)}
        onChange={d => setSolarEfficiency(solarPanelEfficiencyFromSunDistance(system, d))}
    />m <Preset options={system.root.childrenNames.reduce((acc, bodyName) => {
        acc[bodyName] = system.bodies[bodyName].orbit.semiMajorAxis
        return acc
    }, {})}
                value={sunDistanceFromSolarPanelEfficiency(system, solarEfficiency)}
                onChange={d => setSolarEfficiency(solarPanelEfficiencyFromSunDistance(system, parseInt(d)))}
    /><br/>

        <div style={{display: 'inline', cursor: 'pointer'}}
             onClick={() => setShadeCalcOpen(!shadeCalcOpen)}>
            {shadeCalcOpen ? "▾" : "▸"}</div>
        Account for <KerbalYdhmsInput
        value={shadeValue.duration} maxUnits={1}
        onChange={v => setShade(ShadeCustom(v, shadeValue.interval))}
    /> of shade every <KerbalYdhmsInput
        value={shadeValue.interval} maxUnits={1}
        onChange={v => setShade(ShadeCustom(shadeValue.duration, v))}
    />
        <div style={{
            display: shadeCalcOpen ? "block" : "none",
            borderLeft: "1px solid black",
            marginLeft: "0.3em",
            paddingLeft: "0.3em",
        }}>
            <ShadeCalc system={system} value={shade} onChange={v => setShade(v)}/>
        </div>

        <h2>Info for convertors</h2>
        <table><tbody>
        <tr>
            <td>Mission duration:</td>
            <td>
                <KerbalYdhmsInput value={missionDuration}
                                  onChange={v => setMissionDuration(v)}/>
            </td>
        </tr>
        <tr>
            <td>Resource tank:</td>
            <td>
                <Preset options={Object.keys(fuelTanks).reduce((acc, el) => {
                    if (fuelTanks[el].content.amount.LF > 0 && fuelTanks[el].content.amount.Ox > 0) acc[el] = el  // only lf+ox tanks
                    return acc
                }, {})}
                        value={fuelTankPreset} onChange={v => setFuelTank(v)}
                /><br/>
                <FuelTank value={fuelTankValue} onChange={v => setFuelTank(v)}/>
            </td>
        </tr>
        </tbody>
        </table>

        <h2>Storage requirements</h2>
        <div style={{display: 'inline', cursor: 'pointer'}}
             onClick={() => setBurstPowerCalcOpen(!burstPowerCalcOpen)}>
            {burstPowerCalcOpen ? "▾" : "▸"}</div>
        <FloatInput decimals={1} value={burstPowerTotal.energy}
                    onChange={v => setBurstPowerConfig(BurstFromEnergyInterval(v, burstPowerTotal.interval))}
        />⚡ storage, <KerbalYdhmsInput
            value={burstPowerTotal.interval} maxUnits={1}
            onChange={v => setBurstPowerConfig(BurstFromEnergyInterval(burstPowerTotal.energy, v))}
        /> charge time
        <div style={{
            display: burstPowerCalcOpen ? "block" : "none",
            borderLeft: "1px solid var(--foreground-color)",
            marginLeft: "0.3em",
            paddingLeft: "0.3em",
        }}>
            <BurstPowerCalc value={burstPowerConfig}
                            onChange={v => setBurstPowerConfig(v)}
            />
        </div><br/>
        + {shadeEnergy.toFixed(0)}⚡
        (= {(burstPowerTotal.energy + shadeEnergy).toFixed(0)}⚡)
        every {formatValueYdhms(shadeValue.interval, 1)} when using Solar Panels to account for shade<br/>
        - <FloatInput decimals={0} value={storageOtherParts}
                      onChange={setStorageOtherParts}
        />⚡ stored in other parts

        <table className="storageTable">
            <thead>
            <tr>
                <th>Storage</th>
                <th>Lowest mass</th>
                <th>Lowest cost</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>{netStorageNonSolar.toFixed(0)}⚡</td>
                <td>{formatCombinationUnit(findBestBatteryCombination(batteryParts, netStorageNonSolar, p => p.mass), 't')}</td>
                <td>{formatCombinationUnit(findBestBatteryCombination(batteryParts, netStorageNonSolar, p => p.cost), <KspFund/>)}</td>
            </tr>
            <tr>
                <td>{netStorageSolar.toFixed(0)}⚡</td>
                <td>{formatCombinationUnit(findBestBatteryCombination(batteryParts, netStorageSolar, p => p.mass), 't')}</td>
                <td>{formatCombinationUnit(findBestBatteryCombination(batteryParts, netStorageSolar, p => p.cost), <KspFund/>)}</td>
            </tr>
            </tbody>
        </table>

        <h2>Generation requirements</h2>
        <div style={{display: 'inline', cursor: 'pointer'}}
             onClick={() => setContinuousPowerCalcOpen(!continuousPowerCalcOpen)}>
            {continuousPowerCalcOpen ? "▾" : "▸"}</div>
        <FloatInput decimals={1} value={continuousPowerValue}
                    onChange={v => setContinuousPower(ContinuousPowerCalcCustomOnly(v))}
        />⚡/s
        {" = "}
        <FloatInput decimals={1} value={continuousPowerValue * 60}
                    onChange={v => setContinuousPower(ContinuousPowerCalcCustomOnly(v / 60))}
        />⚡/m
        {" = "}
        <FloatInput decimals={1} value={continuousPowerValue * 60 * 60}
                    onChange={v => setContinuousPower(ContinuousPowerCalcCustomOnly(v / 60 / 60))}
        />⚡/h<br/>
        <div style={{
            display: continuousPowerCalcOpen ? "block" : "none",
            borderLeft: "1px solid var(--foreground-color)",
            marginLeft: "0.3em",
            paddingLeft: "0.3em",
        }}>
            <ContinuousPowerCalc value={continuousPower}
                                 onChange={v => setContinuousPower(v)}
            />
        </div>
        + {formatPower(burstPowerTotal.energy/burstPowerTotal.interval)}{" "}
        (= {formatPower(continuousPowerValue + burstPowerTotal.energy/burstPowerTotal.interval )})
        to charge for burst power<br/>
        + {formatPower(shadePower)}{" "}
        (= {formatPower(totalSolarPowerNeeded)})
        when using Solar Panels to store for periods of shade

        <SortableTable columns={columns} data={enrichedSolutions} initialSortColumnNr={2} initialSortDir={1}/>
    </div>
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector))
    }
}
