import * as React from 'react'
import {useCallback, useMemo, useState} from 'react'
import ReactDOM from 'react-dom'
import useFragmentState from "useFragmentState"
import {bodies as kspBodies, planets as kspPlanets} from "../utils/kspBody"
import {orbits as kspOrbits} from "../utils/kspOrbit"
import {formatValueYdhms, formatValueYdhmsAbs, KerbalAbsYdhmsInput, KerbalYdhmsInput} from "../components/formattedInput"
import {default as OrbitComponent, fromString as OrbitFromString, toString as OrbitToString} from "../components/orbit"
import Orbit from "../utils/orbit"
import {SingleOutput, WorkerInput} from "./worker"
import Vector from "../utils/vector"
import ColorMapPlot, {PlotFuncType} from "./colorMapPlot"
import Altitude from "../components/altitude"
import {formatValueSi} from "formattedInput"
import PanZoomAreaAxes from "./panZoomAreaAxes"
import {findMinimumNelderMeadAsync} from "../utils/optimize";
import './app.css'

let REQUEST_ID = 0

enum PlotType {
    dv,
    diveBurn,
    escapeBurn,
    captureBurn,
    circularizationBurn,
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
    const [departingDoDive, setDepartingDoDive] = useFragmentState<boolean>('di', true)
    const [departingDivePeriapsis_, setDepartingDivePeriapsis] = useFragmentState<number>('da', null)
    const [targetPlanet, setTargetPlanet] = useFragmentState<string>(
        't',
        s => {
            if(kspPlanets.includes(s)) return s;
            return "Duna";
        },
        v => v,
    )
    const [arrivalParkingRadius_, setArrivalParkingRadius] = useFragmentState<number>('apo', null)
    const [earliestDeparture, setEarliestDeparture] = useFragmentState<number>('t0l', 0)
    const [latestDeparture_, setLatestDeparture] = useFragmentState<number>('t0h', null)
    const [minTravelTime_, setMinTravelTime] = useFragmentState<number>('dtl', null)
    const [maxTravelTime_, setMaxTravelTime] = useFragmentState<number>('dth', null)

    const [moonPreset, setMoonPreset] = useState<string>("")
    const [selectedTransfer, setSelectedTransfer] = useState<SingleOutput>(null)
    const [plotType, setPlotType] = useState<PlotType>(PlotType.dv)
    const [colorMapPlotProgress, setColorMapPlotProgress] = useState<number>(0)
    const [findingMinimum, setFindingMinimum] = useState<boolean>(false)

    const planetOptions = [];
    for(let planetName of kspPlanets) {
        planetOptions.push(<option key={planetName} value={planetName}>{planetName}</option>);
    }

    const departingPlanetOrbit = kspOrbits[departingPlanet]
    const primaryBody = kspBodies[departingPlanet]
    const targetPlanetOrbit = kspOrbits[targetPlanet]

    const departingDivePeriapsis = departingDivePeriapsis_ != null ? departingDivePeriapsis_ : (
        kspBodies[departingPlanet].radius
        + Math.max(kspBodies[departingPlanet].atmosphere | 0, kspBodies[departingPlanet].terrain | 0)
        + 10000
    )
    const arrivalParkingRadius = arrivalParkingRadius_ != null ? arrivalParkingRadius_ : (
        kspBodies[targetPlanet].radius
        + Math.max(kspBodies[targetPlanet].atmosphere | 0, kspBodies[targetPlanet].terrain | 0)
        + 10000
    )

    const moonOptions = [<option key="" value="">custom</option>]
    for(let moon of primaryBody.isOrbitedBy()) {
        moonOptions.push(<option key={moon.name} value={moon.name}>{moon.name}</option>)
        if(moonPreset == "" && departingOrbit == kspOrbits[moon.name]) {
            setMoonPreset(moon.name)
        }
    }

    const latestDeparture = (() => {
        if(latestDeparture_ != null) return latestDeparture_
        const minPeriod = Math.min(
            departingPlanetOrbit.period,
            targetPlanetOrbit.period,
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
                departingPlanetOrbit.semiMajorAxis,
                targetPlanetOrbit.semiMajorAxis,
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
                departingPlanetOrbit.semiMajorAxis,
                targetPlanetOrbit.semiMajorAxis,
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
                departingPlanetOrbit,
                parkingOrbitAroundDepartingPlanet: departingOrbit,
                minPeriapsis: departingDoDive ? departingDivePeriapsis : null,
                targetPlanetOrbit,
                targetPlanetGravity: kspBodies[targetPlanet].gravity,
                targetPlanetParkingOrbitRadius: arrivalParkingRadius,
                targetPlanetSoi: kspBodies[targetPlanet].soi,
                departureAndTravelTimes: t0dts,
            }
            worker.postMessage(m)
        })
    }, [departingPlanet, departingOrbit, departingDoDive, departingDivePeriapsis, targetPlanet, arrivalParkingRadius])

    const plotColorFunc: PlotFuncType<SingleOutput> = useCallback((result, state) => {
        if (state == null) state = {minDv: Infinity}
        let value
        if(plotType == PlotType.dv) {
            value = result.totalDv
        } else if(plotType == PlotType.diveBurn) {
            value = Vector.FromObject(result.diveBurnPrn).norm
        } else if(plotType == PlotType.escapeBurn) {
            value = Vector.FromObject(result.escapeBurnPrn).norm
        } else if(plotType == PlotType.captureBurn) {
            value = Vector.FromObject(result.captureBurnPrn).norm
        } else if(plotType == PlotType.circularizationBurn) {
            value = Vector.FromObject(result.circularizationBurnPrn).norm
        } else {
            throw `Unknown plot type ${plotType}`
        }
        let redraw = false
        if (value != null && value < state.minDv) {
            state.minDv = value
            redraw = true
        }
        const color = colorMap(Math.log10(value), Math.log10(state.minDv), 2 * Math.log10(state.minDv))
        return {
            color,
            state,
            redraw,
        }
    }, [plotType])

    const plotOnClick = useCallback(async (t0, dt) => {
        const result = await asyncCalc([[t0, dt]])
        const r = result[0];
        setSelectedTransfer(r)
    }, [asyncCalc])

    let plotTypesJsx = [];
    const plotTypeRadios = {
        [PlotType.dv]: "total ∆v",
        [PlotType.diveBurn]: "dive burn",
        [PlotType.escapeBurn]: "escape burn",
        [PlotType.captureBurn]: "capture burn",
        [PlotType.circularizationBurn]: "circularization burn",
    }
    for(let pt in plotTypeRadios) {
        plotTypesJsx.push(<label key={pt}>
            <input type="radio" name="plotType"
                   checked={plotType == +pt}
                   onChange={() => setPlotType(+pt)}
            />{plotTypeRadios[pt]}
        </label>)
    }

    let maybeSelectedTransfer = <></>
    if(selectedTransfer != null) {
        const findMinimum = async () => {
            setFindingMinimum(true)
            const minimum = await findMinimumNelderMeadAsync<2>(
                async (x) => {
                    const res = await asyncCalc([x])
                    setSelectedTransfer(res[0])
                    return res[0].totalDv
                },
                [selectedTransfer.departureTime, selectedTransfer.travelTime],
                {
                    absExpand: [60*60, 60*60],
                    minXDelta: [60, 60],
                    minFxDelta: 1,
                },
            )
            const res = await asyncCalc([minimum.x])
            setSelectedTransfer(res[0])
            setFindingMinimum(false)
        }

        selectedTransfer.diveBurnPrn = Vector.FromObject(selectedTransfer.diveBurnPrn)
        selectedTransfer.diveOrbit = Orbit.FromObject(selectedTransfer.diveOrbit)
        selectedTransfer.escapeBurnPrn = Vector.FromObject(selectedTransfer.escapeBurnPrn)
        selectedTransfer.escapeOrbit = Orbit.FromObject(selectedTransfer.escapeOrbit)
        selectedTransfer.transferOrbit = Orbit.FromObject(selectedTransfer.transferOrbit)
        selectedTransfer.captureBurnPrn = Vector.FromObject(selectedTransfer.captureBurnPrn)
        selectedTransfer.circularizationBurnPrn = Vector.FromObject(selectedTransfer.circularizationBurnPrn)

        maybeSelectedTransfer = <div style={{margin: "1em", minWidth: '30em'}}>
            <h3>Selected transfer details</h3>
            <table><tbody>
            <tr><td>Departure</td><td>{formatValueYdhmsAbs(selectedTransfer.departureTime)}</td></tr>
            <tr><td>Total travel time</td><td>{formatValueYdhms(selectedTransfer.travelTime)}</td></tr>
            {selectedTransfer.diveBurnPrn != null ?
                <>
                    <tr><td>Dive burn</td><td>{selectedTransfer.diveBurnPrn.norm.toFixed(1)}m/s
                        ({selectedTransfer.diveBurnPrn.x.toFixed(1)}m/s prograde,{" "}
                        {selectedTransfer.diveBurnPrn.y.toFixed(1)}m/s radial-in,{" "}
                        {selectedTransfer.diveBurnPrn.z.toFixed(1)}m/s normal)</td></tr>
                    <tr><td>Dive orbit</td><td>{formatValueSi(selectedTransfer.diveOrbit.distanceAtApoapsis)}m
                        {" × "}{formatValueSi(selectedTransfer.diveOrbit.distanceAtPeriapsis)}m
                        {", "}{formatValueSi(selectedTransfer.diveOrbit.distanceAtApoapsis - primaryBody.radius)}mAGL
                        {" × "}{formatValueSi(selectedTransfer.diveOrbit.distanceAtPeriapsis - primaryBody.radius)}mAGL</td></tr>
                    <tr><td>Escape Burn time</td><td>{formatValueYdhmsAbs(selectedTransfer.escapeBurnT)}</td></tr>
                </>
                : <></>}
            <tr><td>Escape Burn</td><td>{selectedTransfer.escapeBurnPrn.norm.toFixed(1)}m/s
                ({selectedTransfer.escapeBurnPrn.x.toFixed(1)}m/s prograde,{" "}
                {selectedTransfer.escapeBurnPrn.y.toFixed(1)}m/s radial-in,{" "}
                {selectedTransfer.escapeBurnPrn.z.toFixed(1)}m/s normal)<br/>
                to boost speed from {selectedTransfer.diveOrbit.speedAtTa(0).toFixed(1)}m/s
                to {selectedTransfer.escapeOrbit.speedAtTa(0).toFixed(1)}m/s
            </td></tr>
            <tr><td>Interplanetary orbit</td>
                <td>{formatValueSi(selectedTransfer.transferOrbit.distanceAtApoapsis)}m
                    {" × "}{formatValueSi(selectedTransfer.transferOrbit.distanceAtPeriapsis)}m
                    for {(selectedTransfer.transferAngle / Math.PI * 180).toFixed(0)}°</td></tr>
            <tr><td>Arrival Time</td>
                <td>{formatValueYdhmsAbs(selectedTransfer.departureTime + selectedTransfer.travelTime)}</td></tr>
            <tr><td>Capture Burn</td><td>{(-selectedTransfer.captureBurnPrn.x).toFixed(1)}m/s retrograde<br/>
                to reduce speed from {selectedTransfer.flybyArrivalSpeed.toFixed(1)}m/s
                to {selectedTransfer.captureSpeed.toFixed(1)}m/s
            </td></tr>
            <tr><td>Circularization Burn</td><td>{(-selectedTransfer.circularizationBurnPrn.x).toFixed(1)}m/s retrograde<br/>
                to reduce speed from {selectedTransfer.captureSpeed.toFixed(1)}m/s
                to {selectedTransfer.parkingOrbitSpeed.toFixed(1)}m/s
            </td></tr>
            <tr><td>total ∆v</td><td>{selectedTransfer.totalDv.toFixed(1)}m/s</td></tr>
            </tbody></table>
            <button
                onClick={() => findMinimum().then(() => {})}
                disabled={findingMinimum}
            >
                {findingMinimum ? "Finding minimum..." : "Find local minimum"}
            </button>
        </div>
    }

    return <>
        <h2>Interplanetary departure from a Moon</h2>
        <p>This planner is heavily inspired on the <a href="https://alexmoon.github.io/ksp/">KSP Launch Window Planner by alexmoon</a>.
        Writing this planner was an exercise for me to learn Orbital mechanics, TypeScript, Service Workers & Canvas.</p>
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
            >{planetOptions}</select> (
            {formatValueSi(departingPlanetOrbit.distanceAtApoapsis)}m
            {" × "}{formatValueSi(departingPlanetOrbit.distanceAtPeriapsis)}m around Kerbol)
        </td></tr>
        <tr><td>Departing orbit<br/>around {departingPlanet}</td><td>
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
        <tr><td>Dive periapsis</td><td>
            <label><input
                type="checkbox"
                checked={departingDoDive}
                onChange={e => setDepartingDoDive(e.target.checked)}
            />Dive down to</label>{" "}
            <Altitude
                value={departingDivePeriapsis}
                onChange={v => setDepartingDivePeriapsis(v)}
                primaryBody={kspBodies[departingPlanet]}
            /></td></tr>
        <tr><td>Target planet</td><td>
            <select
                value={targetPlanet}
                onChange={e => setTargetPlanet(e.target.value)}
            >{planetOptions}</select> (
            {formatValueSi(targetPlanetOrbit.distanceAtApoapsis)}m
            {" × "}{formatValueSi(targetPlanetOrbit.distanceAtPeriapsis)}m around Kerbol)
        </td></tr>
        <tr><td>Capture Orbit Radius</td><td>
            <Altitude
                value={arrivalParkingRadius}
                onChange={v => setArrivalParkingRadius(v)}
                primaryBody={kspBodies[targetPlanet]}
            />
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
        <div style={{display: "flex", flexWrap: 'wrap'}}>
            <div style={{}}>
                <div>{plotTypesJsx}</div>
                <div>Calculating... {(colorMapPlotProgress * 100).toFixed(1)}%</div>
                <PanZoomAreaAxes
                    xRange={[earliestDeparture, latestDeparture]}
                    yRange={[maxTravelTime, minTravelTime]}  // swap Y axis: bottom (higher Y) is lower travel time
                    onMoved={(xRange, yRange) => {
                        setEarliestDeparture(xRange[0])
                        setLatestDeparture(xRange[1])
                        setMinTravelTime(yRange[1])  // swap Y axis
                        setMaxTravelTime(yRange[0])
                    }}
                    onClick={xy => plotOnClick(xy.x, xy.y)}
                    cursor={selectedTransfer ? {x: selectedTransfer.departureTime, y: selectedTransfer.travelTime} : null}
                    formatXValue={formatValueYdhmsAbs}
                    formatX0={v => <>Departure<br/><KerbalAbsYdhmsInput
                        value={v}
                        onChange={v => setEarliestDeparture(v)}
                    /></>}
                    formatX1={v => <KerbalAbsYdhmsInput
                        value={v}
                        onChange={v => setLatestDeparture(v)}
                    />}
                    formatYValue={formatValueYdhms}
                    formatY0={v => <>Travel time<br/><KerbalYdhmsInput
                        value={v}
                        onChange={v => {
                            if(v == 0) setMinTravelTime(null)
                            else setMinTravelTime(v)
                        }}
                    /></>}
                    formatY1={v => <KerbalYdhmsInput
                        value={v}
                        onChange={v => {
                            if(v == 0) setMaxTravelTime(null)
                            else setMaxTravelTime(v)
                        }}
                    />}
                >
                    <ColorMapPlot
                        width={640} height={480}
                        asyncCalcFunc={asyncCalc}
                        colorMapFunc={plotColorFunc}
                        xRange={departureTimeRange}
                        yRange={travelTimeRange}
                        onProgress={setColorMapPlotProgress}
                    />
                </PanZoomAreaAxes>
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
    if(xRel < 0) {
        console.log(`out of bounds for color map: ${x} not in [${xMin};${xMax}]`)
        return points[0].rgb
    }

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

async function asyncFindMinimumNd(
    funcGrad: (x: number[]) => Promise<{fx: number, grad: number[]}>,
    x0: number[],
    stepSize: number = 1,
    tolerance: number = 1e-6,
    maxSteps: number = 1000,
): Promise<{x: number[], fx: number, result: object}> {
    let x = [...x0]
    let N = x.length
    let fxGrad = await funcGrad(x)
    let steps = 0
    //console.log(`GD: f(${x}) => `, fxGrad)
    while(true) {
        if(++steps > maxSteps) break

        const newX = []
        for(let d=0; d<N; d++) {
            newX[d] = x[d] - stepSize * Math.sign(fxGrad.grad[d])
        }
        const newFxGrad = await funcGrad(newX)
        //console.log(`GD: f(${newX}) => `, newFxGrad)
        if(newFxGrad.fx >= fxGrad.fx - tolerance) break  // increase or not decreasing enough
        fxGrad = newFxGrad
        x = newX
    }
    return {
        x,
        fx: fxGrad.fx,
        result: fxGrad,
    }
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
