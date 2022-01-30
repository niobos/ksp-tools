import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import useFragmentState, {jsonParseWithDefault} from "./useFragmentState.js";
import {Size, fuelTanks, engines as kspEngines} from "./kspParts.ts";
import {bodies as kspBodies} from "./kspBody.js";
import {FloatInput} from "./components/formatedInput.jsx";
import KspHierBody from "./components/kspHierBody.jsx";
import PresetDropDown from "./components/presetDropDown.jsx";
import Multiselect from "./components/multiselect.jsx";
import {KspFund} from "./components/kspIcon.jsx";
import SortableTable from "./components/sortableTable.jsx";

import './engines.css';

function objectMap(object, mapFn) {
    /* returns a new object with the values at each key mapped using mapFn(value)
     */
    return Object.keys(object).reduce(function(result, key) {
        result[key] = mapFn(object[key])
        return result
    }, {})
}

function fromPreset(valueOrPreset, presets) {
    let value, preset;
    if(typeof valueOrPreset === 'string') {  // preset
        preset = valueOrPreset;
        value = presets[preset];
    } else {  // value
        value = valueOrPreset;
        preset = "";
    }
    return {value, preset};
}


function FuelTank(props) {
    return <div>
        Full:Empty ratio: <FloatInput
            value={props.value.fullEmptyRatio} decimals={2}
            onChange={(v) => props.onChange({fullEmptyRatio: v, cost: props.value.cost})}
        /><br/>
        Cost: <FloatInput value={props.value.cost} decimals={0}
                          onChange={(v) => props.onChange({fullEmptyRatio: props.value.fullEmptyRatio, cost: v})}
        /><KspFund/>/t
    </div>;
}


function calcFuelTankMass(dv, isp, payloadMass, tankWetDryRatio, payloadMassDry) {
    /* Calculate the mass of fuel tanks needed to get the desired ∆v
     * Returns either the mass of tanks (with the given wet:dry ratio) required.
     * or NaN, if no amount of fuel would achieve the requested ∆v
     */
    if(payloadMassDry === undefined) payloadMassDry = payloadMass;

    // ∆v = Isp * 9.81 * ln(m_wet / m_dry);
    const wetDryRatio = Math.exp(dv / 9.81 / isp);
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


export default function App() {
    const [dv, setDv] = useFragmentState('dv', 1000);
    const [mass, setMass] = useFragmentState('m', 1.5);
    const [acceleration, setAcceleration] = useFragmentState('a', 14.715);
    const [gravity, setGravity] = useState('Kerbin');  // not stored in fragment
    const [pressure, setPressure] = useFragmentState('p', 'vac');
    const [sizes, setSizes] = useFragmentState('s',
        s => {
            const v = jsonParseWithDefault(Object.keys(Size))(s);
            return new Set(v);
        },
        o => JSON.stringify([...o]),
    );
    const fuelTypes = ['lf', 'ox', 'air', 'sf', 'xe', 'mono'];
    const [fuelType, setFuelType] = useFragmentState('f',
        s => {
            const v = jsonParseWithDefault([...fuelTypes])(s);
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
        gravity, objectMap(kspBodies, (b) => b.surface_gravity)
    )
    const {value: tankValue, preset: tankPreset} = fromPreset(
        tank, objectMap(fuelTanks, (ft) => {return {fullEmptyRatio: ft.mass / ft.emptied().mass, cost: ft.cost}})
    );

    const columns = [
        {title: 'Name', value: i => i.name},
        {title: 'Number', classList: 'number', value: i => i.n},
        {title: <span>Cost [<KspFund/>]</span>, classList: 'number', value: i => i.cost.toFixed(0),
            cmp: (a, b) => a.cost - b.cost,
        },
        {title: 'Total Mass [t]', classList: 'number', value: i => i.totalMass.toFixed(2),
            cmp: (a, b) => a.totalMass - b.totalMass,
        },
        {title: 'Engines Mass [t]', classList: 'number', value: i => i.engineMass.toFixed(2),
            cmp: (a, b) => a.engineMass - b.engineMass,
        },
        {title: 'Fuel+tank Mass [t]', value: i => i.fuelTankMass.toFixed(2),
            classList: i => i.fuelTankMass === 0 ? ['number', 'zero'] : ['number'],
            cmp: (a, b) => a.fuelTankMass - b.fuelTankMass,
        },
        {title: 'Size', value: i => i.size},
        {title: `Thrust/engine (${pressure}) [kN]`, classList: 'number', value: i => i.thrustPerEngine.toFixed(1),
            cmp: (a, b) => a.thrustPerEngine - b.thrustPerEngine,
        },
        {title: `Isp (${pressure}) [s]`, classList: 'number', value: i => i.isp},
        {title: `TWR (${pressure}) full []`, value: i => (i.accelerationFull / gravityValue).toFixed(2),
            classList: i => i.accelerationFull < acceleration*.99 ? ['number', 'outOfSpec'] : ['number'],  // .99 for rounding errors
            cmp: (a, b) => a.accelerationFull - b.accelerationFull,
        },
        {title: `TWR (${pressure}) empty []`, value: i => (i.accelerationEmpty / gravityValue).toFixed(2),
            classList: 'number',
            cmp: (a, b) => a.accelerationEmpty - b.accelerationEmpty,
        },
        {title: 'Gimbal [º]', value: i => i.gimbal,
            classList: i => i.gimbal === 0 ? ['number', 'zero'] : ['number'],
        },
        {title: 'Alternator [⚡/s]', value: i => i.alternator,
            classList: i => i.alternator <= 0 ? ['number', 'zero'] : ['number'],
        },
        {title: '∆v [m/s]', value: i => i.dv.toFixed(1),
            classList: i => (i.dv < dv*.99 || isNaN(i.dv)) ? ['number', 'outOfSpec'] : ['number'],  // .99 for rounding errors
            cmp: (a, b) => a.dv - b.dv,
        },
    ];
    const engineOptions = [];
    for(let engineName in kspEngines) {
        const engine = kspEngines[engineName];

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
        if (skip) continue;

        const pressureIndex = pressure === 'atm' ? 0 : 1;


        let numEngines;
        let fuelTankMass, totalMass, emptyMass, actualDv;
        if(engine.consumption.sf > 0) { // SRB
            /* a = n * F / m = n * F / (m_payload + n*m_egine)
             * => a * m_payload + a * n * m_engine = n * F
             * => (F - a * m_engine) * n = a * m_payload
             * => n = a * m_payload / (F - a*m_engine)
             */
            numEngines = Math.ceil(mass * acceleration / (engine.thrust[pressureIndex] - acceleration * engine.mass));
            fuelTankMass = 0;
            totalMass = mass + engine.mass * numEngines;
            emptyMass = mass + engine.emptied().mass * numEngines;
            actualDv = engine.isp[pressureIndex] * 9.81 * Math.log(totalMass / emptyMass);

        } else {  // Normal rocket engine or jet engine
            numEngines = Math.ceil(mass * acceleration / engine.thrust[pressureIndex]);  // initial guess
            while (true) {
                fuelTankMass = calcFuelTankMass(
                    dv, engine.isp[pressureIndex],
                    mass + numEngines * engine.mass,
                    tank.fullEmptyRatio,
                    mass + numEngines * engine.emptied().mass,
                )
                fuelTankMass = Math.max(0, fuelTankMass);  // cap to >=0 for engines with fuel

                if (!isNaN(fuelTankMass)) {
                    totalMass = mass + engine.mass * numEngines + fuelTankMass;
                    emptyMass = mass + engine.emptied().mass * numEngines + fuelTankMass / tank.fullEmptyRatio;
                    actualDv = engine.isp[pressureIndex] * 9.81 * Math.log(totalMass / emptyMass);
                } else {
                    // max attainable ∆v with infinite fueltanks
                    totalMass = mass + engine.mass * numEngines;
                    emptyMass = mass + engine.emptied().mass * numEngines;
                    actualDv = engine.isp[pressureIndex] * 9.81 * Math.log(tank.fullEmptyRatio);
                }

                const newNumEngines = Math.ceil(totalMass * acceleration / engine.thrust[pressureIndex]);  // iterate
                if (newNumEngines === numEngines || newNumEngines > 50) break;
                // else: recalc with new number of engines
                numEngines = newNumEngines;
            }
        }
        const accelerationFull = engine.thrust[pressureIndex] * numEngines / totalMass;

        if( (accelerationFull < acceleration * .99) ||
            (actualDv < dv * .99) || isNaN(actualDv)) {
            // out of spec
            if(!showAll) continue;
        }
        let name = engineName;
        if(engine.wikiUrl !== undefined) {
            name = <a href={engine.wikiUrl}>{name}</a>;
        }
        engineOptions.push({
            name,
            n: numEngines,
            thrustPerEngine: engine.thrust[pressureIndex],
            isp: engine.isp[pressureIndex],
            cost: engine.cost * numEngines + fuelTankMass * tank.cost,
            engineMass: engine.mass * numEngines,
            fuelTankMass,
            totalMass: totalMass,
            dv: actualDv,
            accelerationFull: accelerationFull,
            accelerationEmpty: engine.thrust[pressureIndex] * numEngines / emptyMass,
            size: [...engine.size].map(s => s.shortDescription).join(', '),
            gimbal: engine.gimbal,
            alternator: Math.max(0, -engine.consumption.scaled(numEngines).el),
        });
    }

    return <div>
        <h1>Engine selection</h1>
        <table><tbody>
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
                        onChange={setAcceleration}/>m/s^2
            {" ("}<FloatInput value={dv / acceleration} decimals={0}
                              onChange={(v) => setAcceleration(dv / v)}/>s
            {" with TWR "}<FloatInput value={acceleration / gravityValue} decimals={2}
                        onChange={(twr) => setAcceleration(twr * gravityValue)}/>
            {" @ "}<FloatInput value={gravityValue} decimals={2}
                        onChange={setGravity}
            />{"kN/t "}
            <KspHierBody value={gravityPreset} customValue="custom"
                         onChange={setGravity}
            />)
        </td></tr>
        <tr><td>Pressure</td><td>
            <label><input type="radio" name="pressure" value="atm"
                          checked={pressure === 'atm'}
                          onChange={(e) => setPressure(e.target.value)}
            />atm</label>
            <label><input type="radio" name="pressure" value="vac"
                          checked={pressure === 'vac'}
                          onChange={(e) => setPressure(e.target.value)}
            />vac</label>
        </td></tr>
        <tr><td>Sizes</td><td>
            <Multiselect items={objectMap(Size, v => v.longDescription)} value={sizes} onChange={setSizes}/>
        </td></tr>
        <tr><td>Fuel types</td><td>
            <Multiselect items={fuelTypes} value={fuelType} onChange={setFuelType}/>
        </td></tr>
        <tr><td>Fuel tank</td><td>
            <PresetDropDown items={Object.keys(fuelTanks)}
                            value={tankPreset} onChange={setTank}
            /><br/>
            <FuelTank value={tankValue} onChange={setTank}/>
        </td></tr>
        </tbody></table>
        <h2>Engine options</h2>
        <label><input type="checkbox" checked={showAll}
                      onChange={(e) => setShowAll(e.target.checked)}
        />Show all engines</label>
        <SortableTable columns={columns} data={engineOptions}/>
    </div>;
}

ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
