import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import useFragmentState, {jsonParseWithDefault} from "../utils/useFragmentState";
import {Size} from "../utils/kspParts";
import {bodies as kspBodies} from "../utils/kspBody";
import {FloatInput} from "../components/formatedInput";
import KspHierBody from "../components/kspHierBody";
import Multiselect from "../components/multiselect";
import {KspFund} from "../components/kspIcon";
import SortableTable from "../components/sortableTable";
import Preset from "../components/preset";
import FuelTank from "../components/fuelTank";
import {fuelTanks} from "../utils/kspParts-fuelTanks";
import {engines as kspEngines} from "../utils/kspParts-engine";
import {fromPreset, objectMap} from "../utils/utils";

import './app.css';

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
        tank, objectMap(fuelTanks, (ft) => {return {fullEmptyRatio: ft.mass / ft.emptied().mass, cost: ft.cost/ft.mass}})
    );

    const columns = [
        {title: <span>Name</span>, value: i => i.name},
        {title: <span>Number</span>, classList: 'number', value: i => i.n},
        {title: <span>Cost<br/>[<KspFund/>]</span>, value: i => i.cost.toFixed(0),
            classList: i => isNaN(i.cost) ? ['number', 'zero'] : ['number'],
            cmp: (a, b) => a.cost - b.cost,
        },
        {title: <span>Total<br/>Mass<br/>[t]</span>, classList: 'number', value: i => i.totalMass.toFixed(2),
            cmp: (a, b) => a.totalMass - b.totalMass,
        },
        {title: <span>Engine(s)<br/>Mass<br/>[t]</span>, classList: 'number', value: i => i.engineMass.toFixed(2),
            cmp: (a, b) => a.engineMass - b.engineMass,
        },
        {title: <span>Fuel+tank<br/>Mass<br/>[t]</span>, value: i => i.fuelTankMass.toFixed(2),
            classList: i => (i.fuelTankMass === 0 || isNaN(i.fuelTankMass)) ? ['number', 'zero'] : ['number'],
            cmp: (a, b) => a.fuelTankMass - b.fuelTankMass,
        },
        {title: <span>Size</span>, value: i => i.size},
        {title: <span>Thrust/engine<br/>({pressure}) [kN]</span>, classList: 'number', value: i => i.thrustPerEngine.toFixed(1),
            cmp: (a, b) => a.thrustPerEngine - b.thrustPerEngine,
        },
        {title: <span>Isp<br/>({pressure})<br/>[s]</span>, classList: 'number', value: i => i.isp},
        {title: <span>TWR ({pressure})<br/>full []</span>, value: i => (i.accelerationFull / gravityValue).toFixed(2),
            classList: i => i.accelerationFull < acceleration*.99 ? ['number', 'outOfSpec'] : ['number'],  // .99 for rounding errors
            cmp: (a, b) => a.accelerationFull - b.accelerationFull,
        },
        {title: <span>TWR ({pressure})<br/>empty []</span>, value: i => (i.accelerationEmpty / gravityValue).toFixed(2),
            classList: 'number',
            cmp: (a, b) => a.accelerationEmpty - b.accelerationEmpty,
        },
        {title: <span>Gimbal [º]</span>, value: i => i.gimbal,
            classList: i => i.gimbal === 0 ? ['number', 'zero'] : ['number'],
        },
        {title: <span>Alternator<br/>[⚡/s]</span>, value: i => i.alternator,
            classList: i => i.alternator <= 0 ? ['number', 'zero'] : ['number'],
        },
        {title: <span>∆v [m/s]</span>, value: i => i.dv.toFixed(1),
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
            numEngines = Math.max(1, Math.ceil(mass * acceleration / (engine.thrust[pressureIndex] - acceleration * engine.mass)));
            fuelTankMass = 0;
            totalMass = mass + engine.mass * numEngines;
            emptyMass = mass + engine.emptied().mass * numEngines;
            actualDv = engine.isp[pressureIndex] * 9.81 * Math.log(totalMass / emptyMass);

        } else {  // Normal rocket engine or jet engine
            function calcNumEngines() {
                let n = Math.ceil(totalMass * acceleration / engine.thrust[pressureIndex]);  // initial guess
                if(n === Infinity || isNaN(n) || n === 0) n = 1;
                return n;
            }
            totalMass = mass; // initial guess
            numEngines = calcNumEngines();

            while(true) {
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

                const newNumEngines = calcNumEngines();  // iterate
                if(newNumEngines <= numEngines) break;  // prevent infinite loop
                if(newNumEngines > 50) break;
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
                        onChange={setAcceleration}/>m/s<sup>2</sup>
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
            <Preset options={Object.keys(fuelTanks).reduce((acc, el) => {acc[el] = el; return acc}, {})}
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

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
    };
}
