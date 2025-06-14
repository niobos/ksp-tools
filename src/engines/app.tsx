import * as React from 'react'
import {ReactElement, useState} from 'react'
import ReactDOM from 'react-dom'
import useFragmentState, {updatedHashValue} from 'useFragmentState'
import {Size} from "../utils/kspParts"
import {FloatInput} from "formattedInput"
import Multiselect from "../components/multiselect"
import {KspFund} from "../components/kspIcon"
import SortableTable from "sortableTable"
import Preset from "../components/preset"
import FuelTank from "../components/fuelTank"
import {fuelTanks} from "../utils/kspParts-fuelTanks"
import {engines as kspEngines} from "../utils/kspParts-engine"
import {fromPreset, objectMap} from "../utils/utils"
import {dvForDm, massBeforeDv} from "../utils/rocket"
import kspSystems, {Body} from "../utils/kspSystems"
import {HierarchicalBodySelect, SystemSelect} from "../components/kspSystemSelect"
import './app.css'

const fuelTypes = ['lf', 'ox', 'air', 'sf', 'xe', 'mono']

function calcFuelTankMass(dv, isp, payloadMass, tankWetDryRatio, payloadMassDry) {
    /* Calculate the mass of fuel tanks needed to get the desired ∆v
     * Returns either the mass of tanks (with the given wet:dry ratio) required.
     * or NaN, if no amount of fuel would achieve the requested ∆v
     */
    if(payloadMassDry === undefined) payloadMassDry = payloadMass;

    const wetDryRatio = massBeforeDv(1, dv, isp)
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

export default function App() {
    const [systemName, setSystemName] = useFragmentState<string>('sys', "Stock")
    const system = kspSystems[systemName]
    const [dv, setDv] = useFragmentState('dv', 1000);
    const [mass, setMass] = useFragmentState('m', 1.5);
    const [acceleration, setAcceleration] = useFragmentState('a', 14.715);
    const [gravity, setGravity] = useState('Kerbin' as string | number);  // not stored in fragment
    const [pressure, setPressure] = useFragmentState<number|string>('p', 0);
    const [sizes, setSizes] = useFragmentState<Set<string>>('s',
        s => {
            const v: string[] = jsonParseWithDefault(Object.keys(Size))(s);
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
    const [fuelType, setFuelType] = useFragmentState<Set<string>>('f',
        s => {
            const v: string[] = jsonParseWithDefault([...fuelTypes])(s);
            return new Set(v);
        },
        o => JSON.stringify([...o]),
        );
    const [tank, setTank] = useFragmentState('T',
        s => {
            const v = jsonParseWithDefault({})(s);
            if(typeof v === 'string') return v;
            return {fullEmptyRatio: v.r || 8.05, cost: v.c || 235};
        },
        o => {
            if(typeof o === 'string') return JSON.stringify(o)
            return JSON.stringify({r: o.fullEmptyRatio, c: o.cost})
        }
    );
    const [showAll, setShowAll] = useState(false);

    const {value: gravityValue, preset: gravityPreset} = fromPreset(
        gravity, objectMap(system.bodies, (b: Body) => b.surface_gravity)
    )
    const {value: pressureValue, preset: pressurePreset} = fromPreset(
        pressure, objectMap(system.bodies,
            (b: Body) => (b.atmospherePressure ?? 0) / system.bodies[system.defaultBodyName].atmospherePressure)
    )
    const {value: tankValue, preset: tankPreset} = fromPreset(
        tank, objectMap(fuelTanks, (ft) => {return {fullEmptyRatio: ft.mass / ft.emptied().mass, cost: ft.cost/ft.mass}})
    );

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
                    value: (i: EngineConfig) => <a
                            href={"#" + updatedHashValue('m', `${i.totalMass}`)}
                            target="_new"
                            title="Use as payload for next stage"
                        >{i.totalMass.toFixed(2)}</a>,
                    cmp: (a: EngineConfig, b: EngineConfig) => a.totalMass - b.totalMass,
                },
                {title: <span>Engine(s)</span>, classList: 'number',
                    value: (i: EngineConfig) => i.engineMass.toFixed(2),
                    cmp: (a: EngineConfig, b: EngineConfig) => a.engineMass - b.engineMass,
                },
                {title: <span>Fuel+tank</span>,
                    value: (i: EngineConfig) => i.fuelTankMass.toFixed(2),
                    classList: (i: EngineConfig) => (i.fuelTankMass === 0 || isNaN(i.fuelTankMass)) ? ['number', 'zero'] : ['number'],
                    cmp: (a: EngineConfig, b: EngineConfig) => a.fuelTankMass - b.fuelTankMass,
                },
            ]},
        {title: <span>Size</span>, value: (i: EngineConfig) => i.size},
        {title: <span>Thrust/engine<br/>({pressureValue.toFixed(1)}atm) [kN]</span>, classList: 'number',
            value: (i: EngineConfig) => i.thrustPerEngine.toFixed(1),
            cmp: (a: EngineConfig, b: EngineConfig) => a.thrustPerEngine - b.thrustPerEngine,
        },
        {title: <span>Isp<br/>({pressureValue.toFixed(1)}atm)<br/>[s]</span>, classList: 'number',
            value: (i: EngineConfig) => i.isp.toFixed(1),
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
    const engineOptions: Array<EngineConfig> = [];
    for(let engineName in kspEngines) {
        const engine = kspEngines[engineName];

        // Correct tech level?
        if(engine.techTreeNode.level > techLevel) continue;

        // Correct fuel type?
        let skip = false;
        for (let fuel of fuelTypes) {
            if (engine.consumption[fuel] > 0 && !fuelType.has(fuel)) {
                skip = true;
                break;
            }
        }
        if (skip) continue;

        // Correct size?
        skip = true;
        for (let size of engine.size) {
            if (sizes.has(size.key)) {  // matching size found
                skip = false;
                break;
            }
        }
        if (skip) continue

        let numEngines: number
        let fuelTankMass: number, totalMass: number, emptyMass: number, actualDv: number
        if(engine.consumption.sf > 0) { // SRB
            /* a = n * F / m = n * F / (m_payload + n*m_engine)
             * => a * m_payload + a * n * m_engine = n * F
             * => (F - a * m_engine) * n = a * m_payload
             * => n = a * m_payload / (F - a*m_engine)
             */
            numEngines = Math.max(1, Math.ceil(mass * acceleration / (engine.thrust(pressureValue) - acceleration * engine.mass)));
            fuelTankMass = 0;
            totalMass = mass + engine.mass * numEngines;
            emptyMass = mass + engine.emptied().mass * numEngines;
            actualDv = dvForDm(totalMass, emptyMass, engine.isp(pressureValue))

        } else {  // Normal rocket engine or jet engine
            function calcNumEngines() {
                let n = Math.ceil(totalMass * acceleration / engine.thrust(pressureValue));
                if(n === Infinity || isNaN(n) || n === 0) n = 1;
                return n;
            }
            totalMass = mass; // initial guess
            numEngines = calcNumEngines();

            while(true) {
                fuelTankMass = calcFuelTankMass(
                    dv, engine.isp(pressureValue),
                    mass + numEngines * engine.mass,
                    tankValue.fullEmptyRatio,
                    mass + numEngines * engine.emptied().mass,
                )
                fuelTankMass = Math.max(0, fuelTankMass);  // cap to >=0 for engines with fuel

                if (!isNaN(fuelTankMass)) {
                    totalMass = mass + engine.mass * numEngines + fuelTankMass;
                    emptyMass = mass + engine.emptied().mass * numEngines + fuelTankMass / tankValue.fullEmptyRatio;
                    actualDv = dvForDm(totalMass, emptyMass, engine.isp(pressureValue));
                } else {
                    // max attainable ∆v with infinite fueltanks
                    totalMass = mass + engine.mass * numEngines;
                    emptyMass = mass + engine.emptied().mass * numEngines;
                    actualDv = dvForDm(tankValue.fullEmptyRatio, 1, engine.isp(pressureValue));
                }

                const newNumEngines = calcNumEngines();  // iterate
                if(newNumEngines <= numEngines) break;  // prevent infinite loop
                if(newNumEngines > 50) break;
                // else: recalc with new number of engines
                numEngines = newNumEngines;
            }
        }
        const accelerationFull = engine.thrust(pressureValue) * numEngines / totalMass;

        if( (accelerationFull < acceleration * .99) ||
            (actualDv < dv * .99) || isNaN(actualDv)) {
            // out of spec
            if(!showAll) continue;
        }
        let name: string | ReactElement = engineName;
        if(engine.wikiUrl !== undefined) {
            name = <a href={engine.wikiUrl}>{name}</a>
        }
        engineOptions.push({
            name,
            n: numEngines,
            thrustPerEngine: engine.thrust(pressureValue),
            isp: engine.isp(pressureValue),
            cost: engine.cost * numEngines + fuelTankMass * tankValue.cost,
            engineMass: engine.mass * numEngines,
            fuelTankMass,
            totalMass: totalMass,
            dv: actualDv,
            accelerationFull: accelerationFull,
            accelerationEmpty: engine.thrust(pressureValue) * numEngines / emptyMass,
            size: [...engine.size].map(s => s.shortDescription).join(', '),
            gimbal: engine.gimbal,
            alternator: Math.max(0, -engine.consumption.scaled(numEngines).el),
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
        <table><tbody>
        <tr><td>Planet system</td><td>
            <SystemSelect value={systemName} onChange={setSystemName}/>
        </td></tr>
        <tr><td>Payload mass</td><td>
            <FloatInput value={mass} decimals={1}
                        onChange={setMass}
            />t
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
            <Multiselect items={objectMap(Size, v => v.longDescription)} value={sizes} onChange={setSizes}/>
        </td></tr>
        <tr><td>Fuel types</td><td>
            <Multiselect items={fuelTypes} value={fuelType} onChange={setFuelType}/>
        </td></tr>
        <tr><td>Fuel tank</td><td>
            <Preset options={Object.keys(fuelTanks).reduce((acc, el) => {acc[el] = el; return acc}, {})}
                    value={tankPreset} onChange={setTank}
            /><br/>
            <FuelTank value={tankValue} onChange={setTank}/>
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
