import * as React from 'react'
import {ReactElement, useState} from 'react'
import ReactDOM from 'react-dom'
import useFragmentState from 'useFragmentState'
import {resourceInfoWithMods, sizesWithMods} from "../utils/kspParts"
import {FloatInput} from "formattedInput"
import Multiselect from "../components/multiselect"
import {KspFund} from "../components/kspIcon"
import SortableTable from "sortableTable"
import {FuelTank, fuelTanksWithMods} from "../utils/kspParts-fuelTanks"
import {Engine, enginePartsWithMods} from "../utils/kspParts-engine"
import {fromPreset, objectFilter, objectMap} from "../utils/utils"
import {dvForDm, massBeforeDv} from "../utils/rocket"
import  {Body, kspSystem} from "../utils/kspSystems"
import {HierarchicalBodySelect} from "../components/kspSystemSelect"
import './app.css'
import KeyValueList from "./keyValueList";
import CopyableNumber from "../components/copyableNumber";
import KspModSelector from "../components/kspModSelector";

function calcFuelTankMass(
    dv: number,
    isp: number,
    payloadMass: number,
    tankWetDryRatio: number,
    payloadMassDry: number,
): number {
    /* Calculate the mass of fuel tanks needed to get the desired ∆v
     * Returns either the mass of tanks (with the given wet:dry ratio) required.
     * or NaN, if no amount of fuel would achieve the requested ∆v
     */
    if(payloadMassDry === undefined) payloadMassDry = payloadMass

    const wetDryRatio = massBeforeDv(1, dv, isp)  // needed wet-to-dry ratio
    if(wetDryRatio >= tankWetDryRatio) return NaN;

    /* m_wet     m_payload_w + m_empty_tanks + m_fuel
     * -----  =  ------------------------------------
     * m_dry     m_payload_d + m_empty_tanks
     *
     * m_tanks = m_empty_tanks + m_fuel
     * m_tanks / m_empty_tanks = tankWetDryRatio
     *
     *                  m_payload_w + m_tanks
     * => wetDryRatio = ---------------------------------------
     *                  m_payload_d + m_tanks / tankWetDryRatio
     *
     * => wetDryRatio * (m_payload_d + m_tanks / tankWetDryRatio) = m_payload_w + m_tanks
     * => wetDryRatio * m_payload_d + wetDryRatio / tankWetDryRatio * m_tanks = m_payload_w + m_tanks
     * => wetDryRatio / tankWetDryRatio * m_tanks - m_tanks = m_payload_w - wetDryRatio * m_payload_d
     * => (wetDryRatio / tankWetDryRatio - 1) * m_tanks = m_payload_w - wetDryRatio * m_payload_d
     * => m_tanks = (m_payload_w - wetDryRatio * m_payload_d) / (wetDryRatio / tankWetDryRatio - 1)
     */
    return (payloadMass - wetDryRatio * payloadMassDry) / (wetDryRatio / tankWetDryRatio - 1);
}

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
    thrustPerEngine: number,
    isp: number,
    refuelable: boolean | "partial",
    cost: number,
    engineMass: number
    fuelTankMass: number,
    totalMass: number,
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
    let refuelable: boolean | "partial"
    let fuelTankWdr: number = 0
    let fuelTankCost: number = 0
    {
        let n = 0
        let atLeastOneRefuelable = false
        let atLeastOneNotRefuelable = false
        for (let resource in engine.consumption.amount) {
            const cons = engine.consumption.amount[resource]
            if (cons <= 0) continue
            n = n + cons
            const cost = fuelType[resource].cost;
            if (cost == null || isNaN(cost) || cost == Infinity) {
                atLeastOneNotRefuelable = true
            } else {
                fuelTankWdr += fuelType[resource].wdr * cons
                fuelTankCost += cost * cons
                atLeastOneRefuelable = true
            }
        }
        if (atLeastOneRefuelable && !atLeastOneNotRefuelable) refuelable = true
        else if (atLeastOneNotRefuelable && !atLeastOneRefuelable) refuelable = false
        else if (atLeastOneRefuelable && atLeastOneNotRefuelable) refuelable = "partial"
        else console.log("Engine without any fuel? ", engine)
        fuelTankWdr = fuelTankWdr / n
        fuelTankCost = fuelTankCost / n
    }
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
            const cost = fuelTanksHoldingResource.map(ft => ft.cost / ft.content.total_mass(resourceInfo))
            fuelType[resource].wdr ??= wdr.reduce((acc, i) => acc + i, 0) / wdr.length
            fuelType[resource].cost ??= cost.reduce((acc, i) => acc + i, 0) / cost.length
        }
    }
    return fuelType as Record<string, {wdr: number, cost: number}>
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

    const [dv, setDv] = useFragmentState('dv', 1000);
    const [massComponents, setMassComponents] = useFragmentState<number | Array<[string, number]>>('m', 1.5);
    const [acceleration, setAcceleration] = useFragmentState('a', 14.715);
    const [gravity, setGravity] = useState('Kerbin' as string | number);  // not stored in fragment
    const [pressure, setPressure] = useFragmentState<number|string>('p', 0);
    const [filterSizes, setFilterSizes] = useFragmentState<Set<string>>('s',
        s => {
            const v: string[] = jsonParseWithDefault(Object.keys(availableSizes))(s);
            return new Set(v);
        },
        o => JSON.stringify([...o]),
    );
    const [techLevel, setTechLevel] = useFragmentState<number>('tl',
        s => {
            if(s == null || s === '') return 9;  // default
            return parseInt(s);
        },
        i => '' + i,
    );
    const [fuelType_, setFuelType] = useFragmentState<Record<string, {wdr?: number, cost?: number}>>('f',
        s => jsonParseWithDefault(
                objectMap(resourceInfo, () => ({}))
            )(s),
        o => JSON.stringify(o),
        );
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
        fuelTable.push(<tr><td>
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
            classList: (i: EngineConfig) => isNaN(i.cost) ? ['number', 'zero'] : ['number'],
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
                    value: (i: EngineConfig) => <CopyableNumber value={i.fuelTankMass} displayDecimals={2}/>,
                    classList: (i: EngineConfig) => (i.fuelTankMass === 0 || isNaN(i.fuelTankMass)) ? ['number', 'zero'] : ['number'],
                    cmp: (a: EngineConfig, b: EngineConfig) => a.fuelTankMass - b.fuelTankMass,
                },
            ]},
        {title: <span>Refuelable</span>, value: (i: EngineConfig) => {switch(i.refuelable) {
                case true:
                    return "✅"
                case false:
                    return "❌"
                case "partial":
                    return <span title="partial">✅❌</span>
            }}},
        {title: <span>Size</span>, value: (i: EngineConfig) => i.size},
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
    ];

    const kspEngines = enginePartsWithMods(activeMods)
    const engineOptions: Array<EngineConfig> = []
    for(let engine of kspEngines) {
        // Correct tech level?
        if((engine.techTreeNode?.level ?? 0) > techLevel) continue;

        // Correct fuel type?
        let skip = false;
        for (let fuel of Object.keys(resourceInfo)) {
            if (engine.consumption.amount[fuel] > 0 && !(fuel in fuelType)) {
                skip = true;
                break;
            }
        }
        if (skip) continue;

        // Correct size?
        skip = true;
        for (let size of engine.size) {
            if (filterSizes.has(size)) {  // matching size found
                skip = false;
                break;
            }
        }
        if (skip) continue

        let {refuelable, fuelTankWdr, fuelTankCost} = calcFuelTankInfo(engine, fuelType)

        let numEngines: number
        let fuelTankMass: number, totalMass: number, emptyMass: number, actualDv: number
        if(engine.consumption.amount.SF > 0) {
            // TODO: integrate this below, don't special case SF since other fuels are also not refuelable
            // SRBs: we can't add fuel, fuel is always integrated with the engine
            /* a = n * F / m = n * F / (m_payload + n*m_engine)
             * => a * m_payload + a * n * m_engine = n * F
             * => (F - a * m_engine) * n = a * m_payload
             * => n = a * m_payload / (F - a*m_engine)
             */
            numEngines = Math.max(1, Math.ceil(mass * acceleration / (engine.thrust(resourceInfo, pressureValue) - acceleration * engine.mass)));
            fuelTankMass = 0;
            totalMass = mass + engine.mass * numEngines;
            emptyMass = mass + engine.emptied(resourceInfo).mass * numEngines;
            actualDv = dvForDm(totalMass, emptyMass, engine.isp(pressureValue))

        } else {  // Normal rocket engine or jet engine
            function calcNumEngines() {
                let n = Math.ceil(totalMass * acceleration / engine.thrust(resourceInfo, pressureValue));
                if(n === Infinity || isNaN(n) || n === 0) n = 1;
                return n;
            }
            totalMass = mass; // initial guess
            numEngines = calcNumEngines();

            while(true) {
                fuelTankMass = calcFuelTankMass(
                    dv, engine.isp(pressureValue),
                    mass + numEngines * engine.mass,
                    fuelTankWdr,
                    mass + numEngines * engine.emptied(resourceInfo).mass,
                )
                fuelTankMass = Math.max(0, fuelTankMass);  // cap to >=0 for engines with fuel

                if (!isNaN(fuelTankMass)) {
                    totalMass = mass + engine.mass * numEngines + fuelTankMass;
                    emptyMass = mass + engine.emptied(resourceInfo).mass * numEngines + fuelTankMass / fuelTankWdr;
                    actualDv = dvForDm(totalMass, emptyMass, engine.isp(pressureValue));
                } else {
                    // max attainable ∆v with infinite fuel tanks
                    totalMass = mass + engine.mass * numEngines;
                    emptyMass = mass + engine.emptied(resourceInfo).mass * numEngines;
                    actualDv = dvForDm(fuelTankWdr, 1, engine.isp(pressureValue));
                }

                const newNumEngines = calcNumEngines();  // iterate
                if(newNumEngines <= numEngines) break;  // prevent infinite loop
                if(newNumEngines > 50) break;
                // else: recalc with new number of engines
                numEngines = newNumEngines;
            }
        }
        const accelerationFull = engine.thrust(resourceInfo, pressureValue) * numEngines / totalMass;

        if( (accelerationFull < acceleration * .99) ||
            (actualDv < dv * .99) || isNaN(actualDv)) {
            // out of spec
            if(!showAll) continue;
        }
        let name: string | ReactElement = engine.name;
        if(engine.wikiUrl !== undefined) {
            name = <a href={engine.wikiUrl}>{name}</a>
        }
        engineOptions.push({
            name,
            n: numEngines,
            refuelable,
            thrustPerEngine: engine.thrust(resourceInfo, pressureValue),
            isp: engine.isp(pressureValue),
            cost: engine.cost * numEngines
                + (fuelTankMass == 0 ? 0 : fuelTankMass * fuelTankCost),  // catch 0 * NaN to be 0
            engineMass: engine.mass * numEngines,
            fuelTankMass,
            totalMass: totalMass,
            dv: actualDv,
            accelerationFull: accelerationFull,
            accelerationEmpty: engine.thrust(resourceInfo, pressureValue) * numEngines / emptyMass,
            size: [...engine.size].map(s => availableSizes[s]).join(', '),
            gimbal: engine.gimbal,
            alternator: Math.max(0, -(engine.consumption.scaled(numEngines).amount.El ?? 0)),
        });
    }

    const techLevelJsx = [];
    for(let tl = 1; tl <= 9; tl++) {
        techLevelJsx.push(<label key={tl}>
            <input type="radio"
                   checked={techLevel === tl}
                   onChange={() => setTechLevel(tl)}
            />{tl}
        </label>);
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
        <tr><td>Pressure</td><td>
            <FloatInput value={pressureValue} decimals={1}
                        onChange={(v) => setPressure(v)}
            />{"atm "}
            <HierarchicalBodySelect system={system}
                                    value={pressurePreset} customValue="custom"
                                    onChange={setPressure}
            />
        </td></tr>
        <tr><td>Tech level</td><td>{techLevelJsx}</td></tr>
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
