import * as React from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import useFragmentState from "useFragmentState";
import {bodies as kspBodies, planets as kspPlanets} from "../utils/kspBody";
import {orbits as kspOrbits} from "../utils/kspOrbit";
import {
    formatValueYdhms,
    formatValueYdhmsAbs,
    KerbalAbsYdhmsInput,
    KerbalYdhmsInput
} from "../components/formattedInput";
import {default as OrbitComponent, fromString as OrbitFromString, toString as OrbitToString} from "../components/orbit";
import Orbit from "../utils/orbit";
import {SingleOutput, WorkerInput} from "./worker";
import Vector from "../utils/vector";
import ColorMapPlot, {PlotFuncType} from "./colorMapPlot";
import './app.css';

let REQUEST_ID = 0;

enum PlotType {
    dv,
    escapeBurn,
}

export default function App() {
    const [departingPlanet, setDepartingPlanet] = useFragmentState<string>(
        'f',
        s => {
            if(kspPlanets.includes(s)) return s;
            return "Kerbin";
        },
        v => v,
        )
    const [departingOrbit, setDepartingOrbit] = useFragmentState<Orbit>(
        'o',
        s => OrbitFromString(s, kspOrbits.Minmus, kspBodies[departingPlanet].gravity),
        OrbitToString,
    )
    const [targetPlanet, setTargetPlanet] = useFragmentState<string>(
        't',
        s => {
            if(kspPlanets.includes(s)) return s;
            return "Duna";
        },
        v => v,
    )
    const [earliestDeparture, setEarliestDeparture] = useFragmentState<number>('t0l', 0)
    const [latestDeparture_, setLatestDeparture] = useFragmentState<number>('t0h', null)
    const [minTravelTime_, setMinTravelTime] = useFragmentState<number>('dtl', null)
    const [maxTravelTime_, setMaxTravelTime] = useFragmentState<number>('dth', null)

    const [moonPreset, setMoonPreset] = useState<string>("")
    const [selectedTransfer, setSelectedTransfer] = useState<SingleOutput>(null)
    const [plotType, setPlotType] = useState<PlotType>(PlotType.dv)

    const planetOptions = [];
    for(let planetName of kspPlanets) {
        planetOptions.push(<option key={planetName} value={planetName}>{planetName}</option>);
    }

    const primaryBody = kspBodies[departingPlanet];

    const moonOptions = [<option key="" value="">custom</option>]
    for(let moon of primaryBody.isOrbitedBy()) {
        moonOptions.push(<option key={moon.name} value={moon.name}>{moon.name}</option>)
    }

    const latestDeparture = (() => {
        if(latestDeparture_ != null) return latestDeparture_
        const minPeriod = Math.min(
            kspOrbits[departingPlanet].period,
            kspOrbits[targetPlanet].period,
        )
        return earliestDeparture + 2*minPeriod
    })()
    const departureTimeRange: [number, number] = useMemo(() => {
        // Memo-ize to prevent pork-chop-plot re-renders
        return [earliestDeparture, latestDeparture]
    }, [
        earliestDeparture,
        latestDeparture,
    ])

    const minTravelTime = (() => {
        if(minTravelTime_ != null) return minTravelTime_
        const roughTransferOrbit = Orbit.FromOrbitalElements(
            kspOrbits[departingPlanet].gravity,
            Orbit.smaEFromApsides(
                kspOrbits[departingPlanet].semiMajorAxis,
                kspOrbits[targetPlanet].semiMajorAxis,
            ),
        )
        const p = roughTransferOrbit.period
        return p/6
    })()
    const maxTravelTime = (() => {
        if(maxTravelTime_ != null) return maxTravelTime_
        const roughTransferOrbit = Orbit.FromOrbitalElements(
            kspOrbits[departingPlanet].gravity,
            Orbit.smaEFromApsides(
                kspOrbits[departingPlanet].semiMajorAxis,
                kspOrbits[targetPlanet].semiMajorAxis,
            ),
        )
        return roughTransferOrbit.period
    })()
    const travelTimeRange: [number, number] = useMemo(() => {
        // Memo-ize to prevent redraw
        return [minTravelTime, maxTravelTime]
    }, [minTravelTime, maxTravelTime])

    const worker = useMemo(() => new Worker(new URL('./worker', import.meta.url)), [])
    const asyncCalc = useCallback((t0dts: Array<[number, number]>) => {
        return new Promise<Array<SingleOutput>>((resolve, _) => {
            const requestId = REQUEST_ID++;
            const handler = (m: MessageEvent) => {
                if(m.data.requestId != requestId) return
                worker.removeEventListener("message", handler)
                const out = m.data.result
                resolve(out)
            }
            worker.addEventListener("message", handler)
            const m: WorkerInput = {
                requestId,
                departingPlanetOrbit: kspOrbits[departingPlanet],
                parkingOrbitAroundDepartingPlanet: departingOrbit,
                minPeriapsis: kspBodies[departingPlanet].radius
                    + Math.max(kspBodies[departingPlanet].atmosphere | 0, kspBodies[departingPlanet].terrain | 0)
                    + 10000,
                targetPlanetOrbit: kspOrbits[targetPlanet],
                targetPlanetGravity: kspBodies[targetPlanet].gravity,
                targetPlanetParkingOrbitRadius: kspBodies[targetPlanet].radius
                    + Math.max(kspBodies[targetPlanet].atmosphere | 0, kspBodies[targetPlanet].terrain | 0)
                    + 10000,
                departureAndTravelTimes: t0dts,
            }
            worker.postMessage(m)
        })
    }, [departingPlanet, departingOrbit, targetPlanet])

    const plotColorFunc: PlotFuncType<SingleOutput> = useCallback((value, state) => {
        if(plotType == PlotType.dv) {
            if (state == null) state = {minDv: Infinity}
            let redraw = false
            if (value.totalDv != null && value.totalDv < state.minDv) {
                state.minDv = value.totalDv
                redraw = true
            }
            const color = colorMap(value.totalDv, state.minDv, 5 * state.minDv)
            return {
                color,
                state,
                redraw,
            }
        }
        if(plotType == PlotType.escapeBurn) {
            const r = Math.max(0, Math.min(255, Math.abs(value.escapeBurnPrn.x) / 5000 * 255))
            const g = Math.max(0, Math.min(255, Math.abs(value.escapeBurnPrn.y) / 5000 * 255))
            const b = Math.max(0, Math.min(255, Math.abs(value.escapeBurnPrn.z) / 5000 * 255))
            return {color: [r, g, b]}
        }
        throw "Unknown plot type: " + plotType
    }, [plotType])

    const plotOnClick = useCallback(async (t0, dt) => {
        const result = await asyncCalc([[t0, dt]])
        const r = result[0];
        r.escapeBurnPrn = Vector.FromObject(r.escapeBurnPrn)
        setSelectedTransfer(r)
    }, [asyncCalc])

    let plotTypesJsx = [];
    const plotTypeRadios = {
        [PlotType.dv]: "total ∆v",
        [PlotType.escapeBurn]: "escape burn",
    }
    for(let pt in plotTypeRadios) {
        plotTypesJsx.push(<label key={pt}>
            <input type="radio" name="plotType"
                   checked={plotType == +pt}
                   onChange={e => setPlotType(+pt)}
            />{PlotType[pt]}
        </label>)
    }

    let maybeSelectedTransfer = <></>
    if(selectedTransfer != null) {
        maybeSelectedTransfer = <div style={{margin: "1em"}}>
            <h3>Selected transfer details</h3>
            <table><tbody>
            <tr><td>Departure</td><td>{formatValueYdhmsAbs(selectedTransfer.departureTime)}</td></tr>
            <tr><td>Transfer Time</td><td>{formatValueYdhms(selectedTransfer.travelTime)}</td></tr>
            <tr><td>Arrival Time</td>
                <td>{formatValueYdhmsAbs(selectedTransfer.departureTime + selectedTransfer.travelTime)}</td></tr>
            <tr><td>Escape burn</td><td>{selectedTransfer.escapeBurnPrn.norm.toFixed(1)}m/s
                ({selectedTransfer.escapeBurnPrn.x.toFixed(1)}m/s prograde,{" "}
                {selectedTransfer.escapeBurnPrn.y.toFixed(1)}m/s radial-in,{" "}
                {selectedTransfer.escapeBurnPrn.z.toFixed(1)}m/s normal
                )</td></tr>
            <tr><td>Capture burn</td><td>{selectedTransfer.captureBurn.toFixed(1)}m/s</td></tr>
            <tr><td>total ∆v</td><td>{selectedTransfer.totalDv.toFixed(1)}m/s</td></tr>
            </tbody></table>
        </div>
    }

    return <>
        <h2>Interplanetary departure from a Moon</h2>
        <p>This planner is heavily inspired on the <a href="https://alexmoon.github.io/ksp/">KSP Launch Window Planner by alexmoon</a>.
        Writing this planner was an exercise for me to learn TypeScript, Service Workers & Canvas.</p>
        <p>Contrary to alexmoon's planner, this planner will depart from a specified orbit around the planet
            (e.g. a moon such as Minmus). It will calculate the optimal dive into the planet's gravity well,
            and do a powered slingshot around it to launch on an interplanetary trajectory.</p>

        <table><tbody>
        <tr><td>Departing planet</td><td>
            <select
                value={departingPlanet}
                onChange={e => {
                    setDepartingPlanet(e.target.value)
                    setDepartingOrbit(Orbit.FromOrbitWithUpdatedOrbitalElements(
                        departingOrbit,
                        {gravity: kspBodies[e.target.value].gravity}
                    ))
                }}
            >{planetOptions}</select>
        </td></tr>
        <tr><td>Departing orbit</td><td>
            <select value={moonPreset} onChange={e => {
                setMoonPreset(e.target.value)
                setDepartingOrbit(kspOrbits[e.target.value])
            }}>
                {moonOptions}
            </select>
            <OrbitComponent
                value={departingOrbit}
                onChange={v => {setDepartingOrbit(v); setMoonPreset("")}}
                primaryBody={primaryBody}
            />
        </td></tr>
        <tr><td>Target planet</td><td>
            <select
                value={targetPlanet}
                onChange={e => setTargetPlanet(e.target.value)}
            >{planetOptions}</select>
        </td></tr>
        <tr><td>Departure</td><td><KerbalAbsYdhmsInput
            value={earliestDeparture}
            onChange={v => setEarliestDeparture(v)}
        /> until <KerbalAbsYdhmsInput
            value={latestDeparture}
            onChange={v => {
                if(v == 0) setLatestDeparture(null)  // return to automatic
                else setLatestDeparture(v)
            }}
        /></td></tr>
        <tr><td>Transfer time</td><td>between <KerbalYdhmsInput
            value={minTravelTime}
            onChange={v => {
                if(v == 0) setMinTravelTime(null)
                else setMinTravelTime(v)
            }}
        /> and <KerbalYdhmsInput
            value={maxTravelTime}
            onChange={v => {
                if(v == 0) setMaxTravelTime(null)
                else setMaxTravelTime(v)
            }}
        />
        </td></tr>
        </tbody></table>
        <h2>Plot</h2>
        <div style={{display: "flex"}}>
            <div style={{}}>
                <div>{plotTypesJsx}</div>
                <ColorMapPlot
                    width={800} height={600}
                    asyncCalcFunc={asyncCalc}
                    colorMapFunc={plotColorFunc}
                    xRange={departureTimeRange}
                    yRange={travelTimeRange}
                    onClick={plotOnClick}
                    onPan={(dx, dy) => {
                        setEarliestDeparture(earliestDeparture - dx)
                        setLatestDeparture(latestDeparture - dx)
                        setMinTravelTime(minTravelTime - dy)
                        setMaxTravelTime(maxTravelTime - dy)
                    }}
                    onZoom={(centerDeparture, centerTravel, dir) => {
                        const zoom = dir === "in" ? .7 : 1./.7
                        setEarliestDeparture(centerDeparture - (centerDeparture - earliestDeparture) * zoom)
                        setLatestDeparture(centerDeparture + (latestDeparture - centerDeparture) * zoom)
                        setMinTravelTime(centerTravel - (centerTravel - minTravelTime) * zoom)
                        setMaxTravelTime(centerTravel + (maxTravelTime - centerTravel) * zoom)
                    }}
                />
            </div>
            {maybeSelectedTransfer}
        </div>
    </>;
}

function colorMap(x: number, xMin: number, xMax: number): [number, number, number] {
    if(isNaN(x) || x == null) return [255, 0, 255]

    const points: Array<{x: number, rgb: [number, number, number]}> = [
        {x: 0, rgb: [0,0,131]},
        {x: 0.025, rgb: [0,60,170]},
        {x: 0.050, rgb: [5,255,255]},
        {x: 0.100, rgb: [255,255,0]},
        {x: 0.500, rgb: [250,0,0]},
        {x: 1, rgb: [128,0,0]}
    ]

    const xRel = Math.max(Math.min((x - xMin) / (xMax - xMin), 1), 0)
    let prev
    for(let point of points) {
        if(xRel == point.x) return point.rgb;
        if(xRel < point.x) {
            const xRelSegment = (xRel - prev.x) / (point.x - prev.x)
            return [
                prev.rgb[0] * (1-xRelSegment) + point.rgb[0] * xRelSegment,
                prev.rgb[1] * (1-xRelSegment) + point.rgb[1] * xRelSegment,
                prev.rgb[2] * (1-xRelSegment) + point.rgb[2] * xRelSegment,
            ]
        }
        prev = point
    }
    console.log(`out of bounds for color map: ${x} not in [${xMin};${xMax}]`)
    return prev.rgb
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
