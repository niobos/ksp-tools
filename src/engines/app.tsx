import * as React from 'react'
import {ReactElement, useState} from 'react'
import ReactDOM from 'react-dom'
import useFragmentState from 'useFragmentState'
import {resourceInfoWithMods, sizesWithMods} from "../utils/kspParts"
import {FloatInput, formatValueSi} from "formattedInput"
import Multiselect from "../components/multiselect"
import {KspFund} from "../components/kspIcon"
import SortableTable from "sortableTable"
import {FuelTank, fuelTanksWithMods} from "../utils/kspParts-fuelTanks"
import {Engine, enginePartsWithMods} from "../utils/kspParts-engine"
import {fromPreset, objectMap} from "../utils/utils"
import {Body, kspSystem} from "../utils/kspSystems"
import {HierarchicalBodySelect} from "../components/kspSystemSelect"
import KeyValueList from "./keyValueList";
import CopyableNumber from "../components/copyableNumber";
import KspModSelector from "../components/kspModSelector";
import {calcFuelTank, ElectricalExtraMass} from "./calc";
import {dvForDm} from "../utils/rocket";
import './app.css'
import {KerbalYdhmsInput} from "../components/formattedInput";
import Tooltip from "../components/tooltip";
import Preset from "../components/preset";

function jsonParseWithDefault(defaultValue: any): (value: string) => any {
    return (valueFromHash) => {
        if(valueFromHash === null || valueFromHash === undefined) {
            return defaultValue;
        } // else:
        try {
            return JSON.parse(valueFromHash);
        } catch(e) {
            return defaultValue;
        }
    }
}

type EngineConfig = {
    name: string | ReactElement,
    n: number,
    engine: Engine,
    thrustPerEngine: number,
    isp: number,
    refuelable: Record<string, boolean>,
    cost: number,
    engineMass: number
    fuelMass: number,
    tankMass: number,
    resourceMass: Record<string, {net: number, tare: number}>,
    totalMass: number,
    burnTime: number,
    dv: number,
    accelerationFull: number,
    accelerationEmpty: number,
    size: string,
    gimbal: number,
    alternator: number,
}

function calcFuelTankInfo(
    engine: Engine,
    fuelType: Record<string, {wdr: number, cost: number}>
) {
    const refuelable: Record<string, boolean> = {}
    let fuelTankWdr: number = 0
    let fuelTankCost: number = 0

    let n = 0
    for (let resource in engine.consumption.amount) {
        const cons = engine.consumption.amount[resource]
        if (cons <= 0) continue
        const cost = fuelType[resource].cost;
        if (cost == null || isNaN(cost) || cost == Infinity) {
            refuelable[resource] = false
        } else {
            n = n + cons
            fuelTankWdr += fuelType[resource].wdr * cons
            fuelTankCost += cost * cons
            refuelable[resource] = true
        }
    }
    fuelTankWdr = fuelTankWdr / n
    fuelTankCost = fuelTankCost / n

    return {refuelable, fuelTankWdr, fuelTankCost};
}

function fillInFuelTypeInfo(
    fuelType_: Record<string, {wdr?: number, cost?: number}>,
    fuelTanks: Array<FuelTank>,
    resourceInfo: Record<string, {cost: number, mass: number}>
): Record<string, {wdr: number, cost: number}> {
    const fuelType = Object.assign({}, fuelType_)
    for (let resource in fuelType) {
        if (fuelType[resource].wdr == null || fuelType[resource].cost == null) {
            const fuelTanksHoldingResource = fuelTanks.filter(
                ft => ft.content.amount[resource] > 0
            )
            const wdr = fuelTanksHoldingResource.map(ft => ft.mass / ft.emptied(resourceInfo).mass)
            const cost = fuelTanksHoldingResource.map(ft => ft.cost / ft.content.totalMass(resourceInfo))
            fuelType[resource].wdr ??= wdr.reduce((acc, i) => acc + i, 0) / wdr.length
            fuelType[resource].cost ??= cost.reduce((acc, i) => acc + i, 0) / cost.length
        }
    }
    // Special cases
    if(fuelType.Air != null) fuelType.Air = {wdr: null, cost: 0}
    if(fuelType.El != null) fuelType.El = {wdr: null, cost: 0}
    return fuelType as Record<string, {wdr: number, cost: number}>
}

function calcEngine(
    engine: Engine,
    resourceInfo: Record<string, { mass: number; cost: number }>,
    fuelType: Record<string, { wdr: number; cost: number }>,
    filterSizes: Set<string>,
    payloadMass: number,
    acceleration: number,
    minGimbal: number,
    dv: number,
    pressureValue: number,
    electricalExtraMass: ElectricalExtraMass,
    showAll: boolean, availableSizes: Record<string, string>): EngineConfig {
    // Correct fuel type?
    for (let fuel of Object.keys(resourceInfo)) {
        if (engine.consumption.amount[fuel] > 0 && !(fuel in fuelType)) {
            return null
        }
    }

    // Correct size?
    let found = false
    for (let size of engine.size) {
        if (filterSizes.has(size)) {  // matching size found
            found = true
            break
        }
    }
    if(!found) return null

    if(engine.gimbal < minGimbal) return null

    let {refuelable, fuelTankCost} = calcFuelTankInfo(engine, fuelType)

    const solution = calcFuelTank(payloadMass, acceleration, dv, engine, resourceInfo, fuelType, pressureValue, electricalExtraMass)
    let accelerationFull = engine.thrust(resourceInfo, pressureValue) * solution.numEngines / solution._wetMass
    const isp = engine.isp(pressureValue);
    let actualDv = dvForDm(solution._wetMass, solution._dryMass, isp)

    if ((accelerationFull < acceleration * .99) ||
        (actualDv < dv * .99) || isNaN(actualDv)) {
        // out of spec
        if (!showAll) return null
    }
    if (solution.numEngines == null) {
        accelerationFull = solution.maxAcceleration
        actualDv = solution.maxAcceleration
    }

    let name: string | ReactElement = engine.name;
    if (engine.wikiUrl !== undefined) {
        name = <a href={engine.wikiUrl}>{name}</a>
    }
    const engineMass = engine.emptied(resourceInfo).mass * solution.numEngines;
    let cost = Infinity
    let fuelMass = Infinity
    let tankMass = Infinity
    let resourceMass: Record<string, {net: number, tare: number}> = {}
    if (solution.numEngines != null) {
        cost = solution.numEngines * engine.emptied(resourceInfo).cost
            + Object.values(objectMap(solution.fuelInEngines.mass(resourceInfo),
                (m, k) => m * resourceInfo[k].cost))
                .reduce((acc, c) => acc + c, 0)
            + Object.values(objectMap(solution.fuelInTanks.mass(resourceInfo),
                m => m * fuelTankCost))
                .reduce((acc, c) => acc + c, 0)

        if(electricalExtraMass.type == "battery") {
            cost += (solution.fuelTankEmptyMass.El ?? 0) * electricalExtraMass.batteryPrice
        } else if(electricalExtraMass.type == "generator") {
            cost += (solution.fuelTankEmptyMass.El ?? 0) * electricalExtraMass.generatorPrice
        }

        fuelMass = Object.values(solution.fuelInEngines.mass(resourceInfo))
                .reduce((acc, m) => acc + m, 0)
            + Object.values(solution.fuelInTanks.mass(resourceInfo))
                .reduce((acc, m) => acc + m, 0)
        tankMass = Object.values(solution.fuelTankEmptyMass)
                .reduce((acc, m) => acc + m, 0)

        resourceMass = Object.keys(solution.fuelTankEmptyMass)
            .map(res => ({
                res,
                net: solution.fuelInTanks.mass(resourceInfo)[res],
                tare: solution.fuelTankEmptyMass[res],
            }))
            .filter(e => e.net != null && e.tare != null)
            .reduce((acc, e) => {
                acc[e.res] = {net: e.net, tare: e.tare}
                return acc
            }, {})
    }

    return {
        name,
        n: solution.numEngines,
        engine,
        refuelable,
        thrustPerEngine: engine.thrust(resourceInfo, pressureValue),
        isp: isp,
        cost,
        engineMass,
        fuelMass,
        tankMass,
        resourceMass,
        totalMass: payloadMass + engineMass + fuelMass + tankMass,
        burnTime: solution.burnTime,
        dv: actualDv,
        accelerationFull: accelerationFull,
        accelerationEmpty: engine.thrust(resourceInfo, pressureValue) * solution.numEngines / solution._dryMass,
        size: [...engine.size].map(s => availableSizes[s]).join(', '),
        gimbal: engine.gimbal,
        alternator: Math.max(0, -(engine.consumption.scaled(solution.numEngines).amount.El ?? 0)),
    }
}

function App() {
    const [activeMods, setActiveMods] = useFragmentState<Set<string>>('mod',
        s => {
            const v: Array<string> = JSON.parse(s)
            return new Set(v)
        },
        o => JSON.stringify([...o]),
    )
    const availableSizes = sizesWithMods(activeMods)
    const resourceInfo = resourceInfoWithMods(activeMods)

    const [dv, setDv] = useFragmentState('dv', 1000)
    const [massComponents, setMassComponents] = useFragmentState<number | Array<[string, number]>>('m', 1.5)
    const [acceleration, setAcceleration] = useFragmentState('a', 14.715)
    const [minGimbal, setMinGimbal] = useFragmentState('g', 0)
    const [gravity, setGravity] = useState('Kerbin' as string | number)  // not stored in fragment
    const [pressure, setPressure] = useFragmentState<number|string>('p', 0)
    const [filterSizes, setFilterSizes] = useFragmentState<Set<string>>('s',
        s => {
            const v: string[] = jsonParseWithDefault(Object.keys(availableSizes))(s);
            return new Set(v);
        },
        o => JSON.stringify([...o]),
    )
    const [fuelType_, setFuelType] = useFragmentState<Record<string, {wdr?: number, cost?: number}>>('f',
        s => jsonParseWithDefault(
                objectMap(resourceInfo, () => ({}))
            )(s),
        o => JSON.stringify(o),
        )
    const [electricalExtraMass, setElectricalExtraMass] = useFragmentState<ElectricalExtraMass>('elm', {
        type: "battery",
        batteryDuration: 20,
        batteryDensity: 0.6/12000,  // B-12K battery
        // 0.05/8000 CAR-8K
        batteryPrice: 13_500 / 0.6, // B-12K
        // 4_500/0.05 CAR-8K
        generatorDensity: 2.6653/625,  // "MX-1B 'Prometheus'"
        generatorPrice: 260_280/2.6653,  // MX-1B 'Prometheus'
    })
    const [showAll, setShowAll] = useState<boolean>(false)
    const [payloadOpen, setPayloadOpen] = useState<boolean>(false)

    const system = kspSystem(activeMods)
    const {value: gravityValue, preset: gravityPreset} = fromPreset(
        gravity, objectMap(system.bodies, (b: Body) => b.surface_gravity)
    )
    const {value: pressureValue, preset: pressurePreset} = fromPreset(
        pressure, objectMap(system.bodies,
            (b: Body) => (b.atmospherePressure ?? 0) / system.bodies[system.defaultBodyName].atmospherePressure)
    )

    const fuelTanks = fuelTanksWithMods(activeMods)
    const fuelType = fillInFuelTypeInfo(fuelType_, fuelTanks, resourceInfo);

    const fuelTable = []
    for(let resource of Object.keys(resourceInfo).sort()) {
        if(resource == "El" || resource == "SC") {
            // Electricity is handled separately
            continue
        }
        fuelTable.push(<tr key={resource}><td>
            <label>
                <input type="checkbox" checked={resource in fuelType}
                       onChange={e => {
                           const newValue: Record<string, {cost?: number, mass?: number}> = Object.assign({}, fuelType)  // copy
                           if(e.target.checked) {
                               newValue[resource] = {}
                           } else {
                               delete newValue[resource]
                           }
                           setFuelType(newValue)
                       }}
                />
                {resourceInfo[resource].name}
            </label>
        </td><td>
            <FloatInput
                disabled={!(resource in fuelType)}
                value={fuelType[resource]?.wdr ?? 0} decimals={2}
                onChange={(v) => {
                    const newValue = Object.assign({}, fuelType)
                    newValue[resource].wdr = v
                    setFuelType(newValue)
                }}
            />
        </td><td>
            <FloatInput
                disabled={!(resource in fuelType)}
                value={fuelType[resource]?.cost ?? 0} decimals={0}
                onChange={(v) => {
                    const newValue = Object.assign({}, fuelType)
                    newValue[resource].cost = v
                    setFuelType(newValue)
                }}
            />
        </td></tr>)
    }

    const mass = (typeof massComponents === 'number')
        ? massComponents
        : massComponents.reduce((acc, kv) => acc + kv[1], 0)

    const columns = [
        {title: <span>Name</span>, value: (i: EngineConfig) => i.name},
        {title: <span>Number</span>, classList: 'number', value: (i: EngineConfig) => i.n},
        {title: <span>Cost<br/>[<KspFund/>]</span>,
            value: (i: EngineConfig) => i.cost.toFixed(0),
            classList: (i: EngineConfig) => (isNaN(i.cost) || i.cost == Infinity) ? ['number', 'zero'] : ['number'],
            cmp: (a: EngineConfig, b: EngineConfig) => a.cost - b.cost,
        },
        {title: <span>Mass [t]</span>, children: [
                {title: <span>Total</span>, classList: 'number',
                    value: (i: EngineConfig) => <CopyableNumber value={i.totalMass} displayDecimals={2}/>,
                    cmp: (a: EngineConfig, b: EngineConfig) => a.totalMass - b.totalMass,
                },
                {title: <span>Engine(s)</span>, classList: 'number',
                    value: (i: EngineConfig) => i.engineMass.toFixed(2),
                    cmp: (a: EngineConfig, b: EngineConfig) => a.engineMass - b.engineMass,
                },
                {title: <span>Fuel+tank</span>,
                    value: (i: EngineConfig) => {
                        const resRows = Object.keys(i.resourceMass).map(res => <tr>
                            <td>{res}</td>
                            <td>{i.resourceMass[res].net.toFixed(2)}</td>
                            <td>{i.resourceMass[res].tare.toFixed(2)}</td>
                            <td>{(i.resourceMass[res].net + i.resourceMass[res].tare).toFixed(2)}</td>
                        </tr>)
                        return <Tooltip
                            tooltip={<table>
                                <thead><tr>
                                    <th>Resource</th>
                                    <th>Net</th>
                                    <th>Tare</th>
                                    <th>Total</th>
                                </tr></thead>
                                <tbody>{resRows}</tbody>
                            </table>}
                        >
                            {(i.fuelMass + i.tankMass).toFixed(2)}
                        </Tooltip>
                    },
                    classList: (i: EngineConfig) => (i.fuelMass === 0 || isNaN(i.fuelMass)) ? ['number', 'zero'] : ['number'],
                    cmp: (a: EngineConfig, b: EngineConfig) => (a.fuelMass+a.tankMass) - (b.fuelMass+b.tankMass),
                },
            ]},
        {title: <span>Fuels</span>, value: (i: EngineConfig) => {
                const cons = i.engine.consumption.scaled(i.n)
                const consTotal = cons.scaled(i.burnTime)
                return <>{Object.keys(i.refuelable).map(
                    res => <><span
                        className={i.refuelable[res] ? "refuelable" : "nonrefuelable"}
                        title={`${cons.amount[res].toFixed(1)} /s, ` +
                            `${formatValueSi(consTotal.amount[res])} total`}
                    >{res}</span> </>
                )}</>
            }},
        //{title: <span>Size</span>, value: (i: EngineConfig) => i.size},
        {title: <span>Thrust/engine<br/>({pressureValue.toFixed(1)}atm) [kN]</span>, classList: 'number',
            value: (i: EngineConfig) => <CopyableNumber value={i.thrustPerEngine} displayDecimals={1}/>,
            cmp: (a: EngineConfig, b: EngineConfig) => a.thrustPerEngine - b.thrustPerEngine,
        },
        {title: <span>Isp<br/>({pressureValue.toFixed(1)}atm)<br/>[s]</span>, classList: 'number',
            value: (i: EngineConfig) => <CopyableNumber value={i.isp} displayDecimals={1}/>,
            cmp: (a: EngineConfig, b: EngineConfig) => a.isp - b.isp,
        },
        {title: <span>TWR<br/>({pressureValue.toFixed(1)}atm)</span>, children: [
                {title: <span>full []</span>,
                    value: (i: EngineConfig) => (i.accelerationFull / gravityValue).toFixed(2),
                    classList: (i: EngineConfig) => i.accelerationFull < acceleration*.99 ? ['number', 'outOfSpec'] : ['number'],  // .99 for rounding errors
                    cmp: (a: EngineConfig, b: EngineConfig) => a.accelerationFull - b.accelerationFull,
                },
                {title: <span>empty []</span>,
                    value: (i: EngineConfig) => (i.accelerationEmpty / gravityValue).toFixed(2),
                    classList: 'number',
                    cmp: (a: EngineConfig, b: EngineConfig) => a.accelerationEmpty - b.accelerationEmpty,
                },
            ]},
        {title: <span>Gimbal [º]</span>,
            value: (i: EngineConfig) => i.gimbal,
            classList: (i: EngineConfig) => i.gimbal === 0 ? ['number', 'zero'] : ['number'],
        },
        {title: <span>Alternator<br/>[⚡/s]</span>,
            value: (i: EngineConfig) => i.alternator,
            classList: (i: EngineConfig) => i.alternator <= 0 ? ['number', 'zero'] : ['number'],
        },
        {title: <span>∆v [m/s]</span>,
            value: (i: EngineConfig) => i.dv.toFixed(1),
            classList: (i: EngineConfig) => (i.dv < dv*.99 || isNaN(i.dv)) ? ['number', 'outOfSpec'] : ['number'],  // .99 for rounding errors
            cmp: (a: EngineConfig, b: EngineConfig) => a.dv - b.dv,
        },
        {title: <span>Burn time<br/>[s]</span>, value: (i: EngineConfig) => {
            if(i.burnTime == null) return ""
            return i.burnTime.toFixed(1)
        }},
    ];

    const kspEngines = enginePartsWithMods(activeMods)
    const engineOptions: Array<EngineConfig> = []
    for(let engine of kspEngines) {
        try {
            const out = calcEngine(engine, resourceInfo, fuelType, filterSizes, mass, acceleration, minGimbal, dv, pressureValue, electricalExtraMass, showAll, availableSizes)
            if(out != null) engineOptions.push(out)
        } catch (e) {
            console.error(`Skipping engine ${engine.name} due to error: `, e)
        }
    }

    return <div>
        <h1>Engine selection</h1>
        <KspModSelector value={activeMods}
                        onChange={setActiveMods}/>

        <table><tbody>
        <tr><td>Payload mass</td><td>
            <div style={{display: 'inline', cursor: 'pointer'}}
                 onClick={() => setPayloadOpen(!payloadOpen)}>
                {payloadOpen ? "▾" : "▸"}</div>
            <FloatInput value={mass} decimals={1}
                        onChange={setMassComponents}
            />t
            <div style={{
                display: payloadOpen ? "block" : "none",
                borderLeft: "1px solid var(--foreground-color)",
                marginLeft: "0.3em",
                paddingLeft: "0.3em",
            }}>
                <KeyValueList
                    value={typeof massComponents === 'number' ? [['', massComponents]] : massComponents}
                    onChange={setMassComponents}
                />
            </div>
        </td></tr>
        <tr><td>Target ∆v</td><td>
            <FloatInput value={dv} decimals={1}
                        onChange={setDv}
            />m/s
        </td></tr>
        <tr><td>Min acceleration</td><td>
            <FloatInput value={acceleration} decimals={2}
                        onChange={setAcceleration}/>m/s<sup>2</sup>
            {" ("}<FloatInput value={dv / acceleration} decimals={0}
                              onChange={(v) => setAcceleration(dv / v)}/>s
            {" with TWR "}<FloatInput value={acceleration / gravityValue} decimals={2}
                        onChange={(twr) => setAcceleration(twr * gravityValue)}/>
            {" @ "}<FloatInput value={gravityValue} decimals={2}
                        onChange={setGravity}
            />{"kN/t "}
            <HierarchicalBodySelect system={system}
                                    value={gravityPreset} customValue="custom"
                                    onChange={setGravity}
            />)
        </td></tr>
        <tr><td>Min gimbal</td><td>
            <FloatInput value={minGimbal} decimals={0}
                        onChange={setMinGimbal}/>º
        </td></tr>
        <tr><td>Pressure</td><td>
            <FloatInput value={pressureValue} decimals={1}
                        onChange={(v) => setPressure(v)}
            />{"atm "}
            <HierarchicalBodySelect system={system}
                                    value={pressurePreset} customValue="custom"
                                    onChange={setPressure}
            />
        </td></tr>
        <tr><td>Sizes</td><td>
            <Multiselect
                items={Object.assign({}, [...filterSizes].reduce((acc, s) => {acc[s] = s; return acc}, {}), availableSizes)}
                sortCmp={(a, b) => a.localeCompare(b)}
                value={filterSizes} onChange={setFilterSizes}/>
        </td></tr>
        <tr><td>Fuel</td><td>
            <table>
                <thead><tr>
                    <th>Type<br/>
                        <a onClick={
                            () => setFuelType(Object.assign(objectMap(resourceInfo, () => ({})), fuelType))
                           }
                        >All</a>{" "}
                        <a onClick={() => setFuelType({})}>None</a></th>
                    <th>Wet/Dry<br/>mass ratio []</th>
                    <th>Cost [<KspFund/>/t]</th>
                </tr></thead>
                <tbody>{fuelTable}</tbody>
            </table>
        </td></tr>
        <tr><td>Electricity</td><td>
            <label><input
                type="checkbox"
                checked={"El" in fuelType}
                onChange={e => {
                    const newValue: Record<string, {cost?: number, mass?: number}> = Object.assign({}, fuelType)  // copy
                    if(e.target.checked) {
                        newValue["El"] = {}
                    } else {
                        delete newValue["El"]
                    }
                    setFuelType(newValue)
                }}
            />Allow Electricity as resource</label><br/>
            <label><input
                type="radio"
                name="batOrGen"
                checked={electricalExtraMass.type == "battery"}
                onChange={v => setElectricalExtraMass(
                    Object.assign({}, electricalExtraMass, {type: "battery"}))}
            />Account for storage mass to support <KerbalYdhmsInput
                    value={electricalExtraMass.batteryDuration}
                    onChange={v => setElectricalExtraMass(
                        Object.assign({}, electricalExtraMass, {batteryDuration: v}))}
                /> burns. Storage specific mass: <FloatInput
                value={electricalExtraMass.batteryDensity}
                decimals={5}
                onChange={v => setElectricalExtraMass(
                    Object.assign({}, electricalExtraMass, {batteryDensity: v}))}
                /> t/⚡ , price: <FloatInput
                    decimals={0}
                    value={electricalExtraMass.batteryPrice}
                    onChange={v => setElectricalExtraMass(
                        Object.assign({}, electricalExtraMass, {batteryPrice: v}))}
                /> <KspFund/>/t
            </label><br/>
            <label><input
                type="radio"
                name="batOrGen"
                checked={electricalExtraMass.type == "generator"}
                onChange={v => setElectricalExtraMass(
                    Object.assign({}, electricalExtraMass, {type: "generator"}))}
            />Account for power generation mass
                (at <FloatInput
                    value={electricalExtraMass.generatorDensity}
                    decimals={5}
                    onChange={v => setElectricalExtraMass(
                        Object.assign({}, electricalExtraMass, {generatorDensity: v}))}
                /> t / (⚡/s)), price: <FloatInput
                    decimals={0}
                    value={electricalExtraMass.generatorPrice}
                    onChange={v => setElectricalExtraMass(
                        Object.assign({}, electricalExtraMass, {generatorPrice: v}))}
                /> <KspFund/>/t
            </label>
        </td></tr>
        </tbody></table>
        <h2>Engine options</h2>
        <label><input type="checkbox" checked={showAll}
                      onChange={(e) => setShowAll(e.target.checked)}
        />Also show engines not meeting ∆v or TWR requirements</label>
        <SortableTable columns={columns} data={engineOptions} initialSortColumnNr={3} initialSortDir={1}/>
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}


// TODO: somehow account for battery / capacitor weight
