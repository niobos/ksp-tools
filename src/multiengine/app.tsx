import './app.css'
import * as React from "react";
import ReactDOM from 'react-dom';
import useFragmentState from "useFragmentState";
import {FloatInput} from "formattedInput";
import {enginePartsWithMods} from "../utils/kspParts-engine";
import {Resources, resourceInfoWithMods} from "../utils/kspParts";
import {KerbalYdhmsInput} from "../components/formattedInput";
import {arrayInsertElement, arrayMoveElement, arrayRemoveElement, arrayReplaceElement} from "../utils/list";
import {dtForDv, dvForDm, dvForDt, massAfterDv, massBeforeDv} from "../utils/rocket";

const kspEngines = enginePartsWithMods()
const resourceInfo = resourceInfoWithMods()

const FUEL_TYPES = ['LF', 'Ox', 'Mono', 'Xe']
// Don't list air, electricity, solid fuel or ore
const DEFAULT_ENGINE_NAME = kspEngines[0].name

type EngineParams = {
    name?: string
    isp: number
    consumption: Resources
    thrust: number
}

function resolveEngine(engineType: string | EngineParams): EngineParams {
    if(typeof engineType === "string") {
        const engineSpec = kspEngines.filter(e => e.name == engineType)[0]
        engineType = {
            name: engineType,
            isp: engineSpec.isp(0),  // vacuum ISP
            consumption: engineSpec.consumption,
            thrust: engineSpec.thrust(resourceInfo, 0),  // vacuum thrust
        }
    }
    return engineType
}

interface SelectEngineProps {
    value: string
    onChange: (string) => void
}
function SelectEngine(props: SelectEngineProps): JSX.Element {
    const optionsJsx = []
    for(let engine of kspEngines) {
        if(!engine.throttleControl) continue
        optionsJsx.push(<option
            key={engine.name}
            value={engine.name}
            selected={props.value == engine.name}
        >{engine.name}</option>)
    }
    return <select
        onChange={e => props.onChange(e.target.value)}
    >
        {optionsJsx}
    </select>
}

interface EngineSpecs {
    number: number
    type: string | EngineParams
}
interface EngineProps extends EngineSpecs {
    onChange: (EngineSpecs) => void
}
function Engine(props: EngineProps): JSX.Element {
    const engineSpec = resolveEngine(props.type)

    return <li>
        <input
            className="Integer"
            type="number"
            value={props.number}
            onChange={e => props.onChange({number: e.target.value, type: props.type})}
        /> × <SelectEngine
            value={engineSpec.name}
            onChange={v => props.onChange({number: props.number, type: v})}
        /> (ISP: {engineSpec.isp}s, thrust: {engineSpec.thrust}kN)
        <input type="button" value="Remove"
               onClick={() => props.onChange(null)}
        />
    </li>
}

interface BurnSpec {
    dv: number
    engines: Array<EngineSpecs>
}
interface BurnProps extends BurnSpec {
    onChange: (BurnSpec) => void
    onMove: (number) => void
    combinedIsp: number
    combinedThrust: number
    startMass: number
    endMass: number
    fuelRemaining: Resources
    maxDv: number
}
function Burn(props: BurnProps): JSX.Element {
    const duration = dtForDv(props.dv, props.startMass, props.combinedThrust, props.combinedIsp)

    return <li>
        <input type="button" value="remove"
               onClick={() => props.onChange(null)}
        /><input type="button" value="move up"
               onClick={() => props.onMove(-1)}
        /><input type="button" value="move down"
                 onClick={() => props.onMove(1)}
        /><br/>
        <FloatInput
            decimals={1}
            value={props.dv}
            onChange={dv => props.onChange({dv, engines: props.engines})}
        />m/s (max: <a
            href="javascript:return false"
            onClick={() => props.onChange({dv: props.maxDv, engines: props.engines})}
        >{props.maxDv.toFixed(1)}m/s</a>) burn
        {" = "}<KerbalYdhmsInput
            value={duration}
            onChange={dt => props.onChange({
                dv: dvForDt(dt, props.startMass, props.combinedThrust, props.combinedIsp),
                engines: props.engines
            })}
        /> with:
        <ul>{props.engines.map((engine, idx) => <Engine
            key={idx}
            number={engine.number}
            type={engine.type}
            onChange={engine => props.onChange({
                dv: props.dv,
                engines: engine == null
                    ? arrayRemoveElement(props.engines, idx)
                    : arrayReplaceElement(props.engines, idx, engine),
            })}
        />)}
            <li><input type="button" value="Add engine"
                       onClick={() => props.onChange({
                           dv: props.dv,
                           engines: arrayInsertElement(props.engines, {number: 1, type: DEFAULT_ENGINE_NAME}),
                       })}
            /></li>
        </ul>
        Combined ISP: {props.combinedIsp.toFixed(1)}s<br/>
        Combined thrust: {props.combinedThrust.toFixed(1)}kN{", "}
            {(props.combinedThrust / props.startMass).toFixed(1)}–
            {(props.combinedThrust / props.endMass).toFixed(1)}m/s²<br/>
        Start mass: {props.startMass.toFixed(3)}t<br/>
        Fuel remaining:
        <ul>{FUEL_TYPES.map((fuelType, idx) => <li
            key={idx}
            className={
                Math.abs(props.fuelRemaining.amount[fuelType]) < 0.1
                    ? "zero"
                    : props.fuelRemaining.amount[fuelType] < 0 ? "error" : ""
            }
        >
            {(props.fuelRemaining.amount[fuelType]??0).toFixed(1)} units{" = "}
            {(props.fuelRemaining.mass(resourceInfo)[fuelType]??0).toFixed(3)}t {fuelType}
        </li>)}</ul>
        End mass: {props.endMass.toFixed(3)}t<br/>
    </li>
}

function combineEngines(engines: Array<EngineSpecs>) {
    let totalThrust = 0
    let totalThrustPerIsp = 0
    let fuelRatio = new Resources()
    for(let engine of engines) {
        const engineSpec = resolveEngine(engine.type)
        totalThrust += engine.number * engineSpec.thrust
        totalThrustPerIsp += engine.number * engineSpec.thrust / engineSpec.isp
        fuelRatio = fuelRatio.add(engineSpec.consumption.scaled(engine.number))
    }
    return {
        thrust: totalThrust,
        isp: totalThrust / totalThrustPerIsp,
        fuelRatio,
    }
}
function calcBurn(
    burn: BurnSpec, dryMass: number, fuelRemaining: Resources
): Omit<BurnProps, "onChange" | "onMove"> {
    const {thrust, isp, fuelRatio} = combineEngines(burn.engines)

    let totalFuelMass = fuelRemaining.totalMass(resourceInfo)
    const startMass = dryMass + totalFuelMass
    const endMass = massAfterDv(startMass, burn.dv, isp)
    const consumedFuelMass = startMass - endMass
    fuelRemaining = fuelRemaining.sub(fuelRatio.scaled(consumedFuelMass / fuelRatio.totalMass(resourceInfo)))

    const minFuelRemaining = fuelRemaining.sub(fuelRatio.scaled(
        fuelRemaining.consumedAtRatio(fuelRatio)
    ))
    const maxDv = dvForDm(startMass, dryMass + minFuelRemaining.totalMass(resourceInfo), isp)

    return {
        dv: burn.dv,
        engines: burn.engines,
        combinedThrust: thrust,
        combinedIsp: isp,
        startMass,
        endMass,
        fuelRemaining,
        maxDv,
    }
}
function calcFuelRequired(
    burn: BurnSpec, endMass: number
): Resources {
    const {isp, fuelRatio} = combineEngines(burn.engines)

    const startMass = massBeforeDv(endMass, burn.dv, isp)
    const fuelMass = startMass - endMass
    return fuelRatio.scaled(fuelMass / fuelRatio.totalMass(resourceInfo))
}

function App(): JSX.Element {
    const [dryMass, setDryMass] = useFragmentState<number>(
        'm0',
        s => {
            const n = parseFloat(s)
            if(isNaN(n)) return 10
            return n
        },
        n => '' + n,
    )
    const [fuel, setFuel] = useFragmentState<Resources>(
        'f',
        s => {
            if(s == null) return new Resources({LF: 19/.005, Ox: 11/.005})
            return new Resources(JSON.parse(s))
        },
        d => JSON.stringify(d),
    )
    const [burns, setBurns] = useFragmentState<Array<BurnSpec>>(
        'b',
        s => {
            if(s == null) return [
                {engines: [{number: 1, type: 'LV-N "Nerv"'}], dv: 100},
                {engines: [{number: 2, type: '48-7S "Spark"'}], dv: 200},
            ]
            return JSON.parse(s)
        },
        l => JSON.stringify(l),
    )

    let fuelRemaining = fuel
    let totalDv = 0
    const burnsJsx = []
    for(let idx=0; idx < burns.length; idx++) {
        const burn = calcBurn(burns[idx], dryMass, fuelRemaining)
        burnsJsx.push(<Burn
            key={idx}
            {...burn}
            onChange={burn => setBurns(burn == null
                ? arrayRemoveElement(burns, idx)
                : arrayReplaceElement(burns, idx, burn))}
            onMove={offset => setBurns(arrayMoveElement(burns, idx, offset))}
        />)
        fuelRemaining = burn.fuelRemaining
        totalDv += burn.dv
    }

    let fuelFromZero = new Resources()
    let mass = dryMass
    for(let idx=burns.length-1; idx >= 0; idx--) {
        // Iterate last to first
        const extraFuel = calcFuelRequired(burns[idx], mass)
        fuelFromZero = fuelFromZero.add(extraFuel)
        mass += extraFuel.totalMass(resourceInfo)
    }

    return <>
        <h1>Multi-engine planner</h1>
        <p>When designing SSTOs, you usually have different types of engines on board.
            This planner helps to calculate the required amount of fuel for a set of burns with the different engines
        </p>
        <table><tbody>
        <tr><td>Dry (empty) mass</td><td>
            <FloatInput value={dryMass} decimals={3}
                        onChange={setDryMass}
            />t</td></tr>
        <tr><td>Fuel capacity</td><td>
            <ul>{FUEL_TYPES.map((fuelType, idx) => <li key={idx}>
                <FloatInput
                    decimals={1}
                    value={fuel.amount[fuelType] ?? 0}
                    onChange={v => setFuel(fuel.copy({ [fuelType]: v}))}
                /> units = <FloatInput
                    decimals={3}
                    value={fuel.mass(resourceInfo)[fuelType] ?? 0}
                    onChange={v => setFuel(fuel.copy({ [fuelType]: v / resourceInfo[fuelType].mass}))}
                />t {fuelType}
            </li>)}</ul>
            <input type="button" value="Calculate to end up emtpy"
                   onClick={() => setFuel(fuelFromZero)}
            />
        </td></tr>
        </tbody></table>
        <h2>Burns</h2>
        <ol>{burnsJsx}</ol>
        <input type="button" value="Add burn"
               onClick={() => setBurns(arrayInsertElement(burns, {dv: 100, engines: [{number: 1, type: DEFAULT_ENGINE_NAME}]}))}
        />
        <p>Total ∆v: {totalDv.toFixed(1)}m/s</p>
        </>
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
