import ReactDOM from "react-dom";
import * as React from "react";
import useFragmentState from "useFragmentState";
import {Mining, ValueType as MiningValueType, fromString as miningFromString,
    toString as miningToString, calc as miningCalc} from "./mining";
import {Converting, ValueType as ConvertingValueType,
    fromString as convertingFromString, toString as convertingToString,
    calc as convertingCalc} from "./converting";

function App() {
    const [engineerStars, setEngineerStars] = useFragmentState<number>('eng', 5)
    const [mining, setMining] = useFragmentState<MiningValueType>('m', miningFromString, miningToString)
    const [converting, setConverting] = useFragmentState<ConvertingValueType>('c', convertingFromString, convertingToString)
    const [fuelCell, setFuelCell] = useFragmentState<boolean>('fc', false)

    const drill = miningCalc(engineerStars, mining)
    const convert = convertingCalc(engineerStars, drill.totalOreProduction, converting)

    const elec = drill.electricalPower - convert.resources.el
    let fuel = convert.resources.lf
    let ox = convert.resources.ox

    if(fuelCell) {
        fuel -= elec * 0.00125  // 0.0016875 -> 1.5 (0.001125); 0.02025 -> 18 (0.001125)
        ox -= elec * 0.001375  // 0.0020625 -> 1.5 (0.001375); 0.02475 -> 18 (0.001375)
    }

    const engineerRadios = []
    engineerRadios.push(<label key="-1">
        <input type="radio" name="engineer_stars" value="-1"
               defaultChecked={engineerStars === -1}
               onChange={(e) => setEngineerStars(parseInt(e.target.value))}
        />No
    </label>)
    for(let s = 0; s <= 5; s++) {
        engineerRadios.push(<label key={s}>
            <input type="radio" name="engineer_stars" value={'' + s}
                   defaultChecked={engineerStars === s}
                   onChange={(e) => setEngineerStars(parseInt(e.target.value))}
            />{s}{" "}
        </label>)
    }

    return <div>
        <h1>In-Situ Resource Harvesting</h1>
        Engineer on board: {engineerRadios}
        <h2>Mining</h2>
        <Mining engineerStars={engineerStars}
                value={mining}
                onChange={setMining}
        />
        <h2>Converting</h2>
        <Converting engineerStars={engineerStars}
                    drillOreRate={drill.totalOreProduction}
                    value={converting}
                    onChange={v => setConverting(v)}
        />

        <h2>Total</h2>
        <table><tbody>
        <tr><td>Electricity:</td><td>
            {elec.toFixed(1)} ⚡/s
            {" "}<label><input type="checkbox" checked={fuelCell}
                               onChange={(e) => setFuelCell(e.target.checked)}
        />Provided by Fuel Cells</label>
        </td></tr>
        <tr><td>Fuel production:</td><td>
            {fuel.toFixed(3)} Lf/s = {(fuel*3600*6).toFixed(0)} Lf/d<br/>
            {ox.toFixed(3)} Ox/s = {(ox*3600*6).toFixed(0)} Ox/d<br/>
            {convert.resources.mono.toFixed(3)} Mono/s = {(convert.resources.mono*3600*6).toFixed(0)} Mono/d<br/>
        </td></tr>
        </tbody></table>
    </div>
}

if(typeof window === 'object') {   // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'))
    }
}
