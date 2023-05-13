import './app.css';
import * as React from "react";
import {ReactNode, useEffect, useMemo, useState} from "react";
import ReactDOM from 'react-dom';
import useFragmentState from "useFragmentState";
import Orbit from "../utils/orbit";
import OrbitAround from "../utils/orbitAround";
import {bodies as kspBodies} from "../utils/kspBody";
import Vector from "../utils/vector";
import {Burn, ConicSegment, SegmentReason} from "./simWorker";
import OrbitDetails from "../components/orbit";
import {formatValueYdhmsAbs, KerbalAbsYdhmsInput} from "../components/formattedInput";
import KspHierBody from "../components/kspHierBody";
import {OrbitSummary} from "./orbitSummary";
import {formatValueSi} from "formattedInput";
import BurnDetails from "./burnDetails";
import {arrayReplaceElement} from "../utils/list";

type Seconds = number

interface ExpanderProps {
    state: boolean
    onClick?: (newState: boolean) => void
    children?: ReactNode
}
function Expander(props: ExpanderProps): JSX.Element {
    return <div style={{display: 'inline', cursor: 'pointer'}}
                onClick={e => {
                    if(props.onClick != null) props.onClick(!props.state)
                }}>
        {props.state ? "▾" : "▸"}
        {props.children}
    </div>
}

interface InitialOrbitProps {
    startTime: Seconds
    setStartTime: (Seconds) => void
    initialOrbit: OrbitAround
    setInitialOrbit: (OrbitAround) => void
}
function InitialOrbit(props: InitialOrbitProps): JSX.Element {
    const [detailsOpen, setDetailsOpen] = useState(false)

    let maybeRest = null
    if(detailsOpen) {
        maybeRest = <>
            <p>Simulation start time: <KerbalAbsYdhmsInput
                value={props.startTime}
                onChange={props.setStartTime}
            /></p>
            <p>Around <KspHierBody
                value={props.initialOrbit.body.name}
                onChange={bodyName => {
                    const body = kspBodies[bodyName];
                    const orbit = Orbit.FromOrbitWithUpdatedOrbitalElements(
                        props.initialOrbit.orbit,
                        {gravity: body.gravity}
                    )
                    props.setInitialOrbit(new OrbitAround(
                        body,
                        orbit
                    ))
                }}
            /></p>
            <OrbitDetails
                value={props.initialOrbit.orbit}
                primaryBody={props.initialOrbit.body}
                onChange={newOrbit => {
                    props.setInitialOrbit(new OrbitAround(
                        props.initialOrbit.body,
                        newOrbit,
                    ))
                }}
            />
        </>
    }

    return <li className="Initial">
        <Expander state={detailsOpen} onClick={setDetailsOpen}>{" "}
            {formatValueYdhmsAbs(props.startTime)}
            {" "}
            Initial <OrbitSummary value={props.initialOrbit}/></Expander><br/>
        {maybeRest}
    </li>
}

interface BurnEventProps {
    burn: Burn
    onChange: (Burn) => void
    orbit?: OrbitAround
}
function BurnEvent(props: BurnEventProps): JSX.Element {
    const [detailsOpen, setDetailsOpen] = useState(false)

    let maybeOrbit = null
    if(props.orbit) {
        maybeOrbit = <> to <OrbitSummary value={props.orbit}/></>;
    }

    let maybeDetails = null
    if(detailsOpen) {
        maybeDetails = <>
            <p>Simulation start time: <KerbalAbsYdhmsInput
                value={props.burn.t}
                onChange={t => props.onChange(Burn.create({t: t, prn: props.burn.prn}))}
            /></p>

            <BurnDetails
                value={props.burn.prn}
                onChange={b => props.onChange(Burn.create({t: props.burn.t, prn: b}))}
            />

            {props.orbit ? <>New orbit:<br/>
                <OrbitDetails
                    value={props.orbit.orbit}
                    primaryBody={props.orbit.body}
                />
            </> : <></>}
        </>
    }

    return <li className="Burn">
        <Expander state={detailsOpen} onClick={setDetailsOpen}>{" "}
            {formatValueYdhmsAbs(props.burn.t)}
            {" "}
            {formatValueSi(props.burn.prn.norm)}m/s burn{maybeOrbit}</Expander><br/>
        {maybeDetails}
    </li>
}

interface SoiChangeProps {
    t: Seconds
    orbit: OrbitAround
}
function SoiChange(props: SoiChangeProps): JSX.Element {
    return <li className="SoIChange">
        {formatValueYdhmsAbs(props.t)}
        {" "}
        SoI change to <OrbitSummary value={props.orbit}/>
    </li>
}

interface CollideProps {

}
function Collide(props: CollideProps): JSX.Element {
    return <li className="CollideOrAtmosphere">Collide</li>
}

interface CalculatingProps {
    t?: Seconds
}
function Calculating(props: CalculatingProps): JSX.Element {
    const maybeTime = props.t != null ? ` ${formatValueYdhmsAbs(props.t)}` : "";
    return <li className="processing">Calculating{maybeTime}...</li>
}

interface EndOfSimulationProps {
    t: Seconds
}
function EndOfSimulation(props: EndOfSimulationProps): JSX.Element {
    return <li className="end">{formatValueYdhmsAbs(props.t)} End of simulation</li>
}

function App() {
    const [simulationStart, setSimulationStart] = useFragmentState<number>('t0',
        s => {
            const t = parseFloat(s);
            if(isNaN(t)) return 150322;
            return t;
        },
        t => '' + t
    )
    const [initialOrbit, setInitialOrbit] = useFragmentState<OrbitAround>('io',
        s => {
            try {
                return OrbitAround.Unserialize(s)
            } catch(e) {
                return new OrbitAround(
                    kspBodies['Kerbin'],
                    Orbit.FromOrbitalElements(
                        kspBodies['Kerbin'].gravity,
                        {sma: 700e3},
                        {ma0: 0},
                    )
                )
            }
        },
        o => {
            return o.serialize()
        },
    );
    const [burns, setBurns] = useFragmentState<Burn[]>('b',
        s => {
            try {
                const o = JSON.parse(s)
                return o.map(e => Burn.FromObject(e))
            } catch(e) {
                return [
                    Burn.create({t: 154860, prn: new Vector(900, 0, 0)}),
                ]
            }
        },
        o => {
            return JSON.stringify(o.map(e => e.toObject()))
        }
    )
    const [simulationEnd, setSimulationEnd] = useFragmentState<number>('te', 10*426*6*60*60)

    const [activeSegment, setActiveSegment] = useState<number | null>(0)
    const [segments, setSegments] = useState<Array<ConicSegment>>([])

    const simWorker = useMemo(() => new Worker(new URL('./simWorker', import.meta.url)), []);
    // ^^ BUG: useMemo is *not* *guaranteed* to remember previous values. This may leak workers.
    simWorker.onmessage = (e) => {
        if(e.data?.type != 'segments') return
        setSegments(e.data.value.map(s => {
            // Message is plain JSON objects; upgrade these to instances of classes
            s.orbit = OrbitAround.FromObject(s.orbit);
            return s;
        }));
    };
    useEffect(() => {
        simWorker.postMessage({
            type: 'setStartTime',
            value: simulationStart,
        })
    }, [simulationStart])
    useEffect(() => {
        simWorker.postMessage({
            type: 'setInitialOrbit',
            value: initialOrbit,
        })
    }, [initialOrbit])
    useEffect(() => {
        simWorker.postMessage({
            type: 'setBurns',
            value: burns,
        })
    }, [burns])
    useEffect(() => {
        simWorker.postMessage({
            type: 'calculateUntil',
            value: simulationEnd,
        })
    }, [simulationEnd])

    const events: Array<{t: Seconds, jsx: JSX.Element}> = [
        {t: simulationStart, jsx: <InitialOrbit
            key="initial"
            startTime={simulationStart}
            setStartTime={setSimulationStart}
            initialOrbit={initialOrbit}
            setInitialOrbit={setInitialOrbit}
        />},
    ]
    const burnsAlreadyAdded = []
    for(let segmentIdx in segments) {
        const segment = segments[segmentIdx]
        switch (segment.reason) {
            case SegmentReason.Initial:
                // ignore
                break
            case SegmentReason.Burn:
                burnsAlreadyAdded.push(segment.burnIdx)
                events.push({t: segment.startT, jsx: <BurnEvent
                    key={`s${segmentIdx}`}
                    orbit={segment.orbit}
                    burn={burns[segment.burnIdx]}
                    onChange={b => {setBurns(arrayReplaceElement(burns, segment.burnIdx, b))}}
                />})
                break
            case SegmentReason.SoIChange:
                events.push({t: segment.startT,
                    jsx: <SoiChange key={`s${segmentIdx}`} t={segment.startT} orbit={segment.orbit}/>})
                break
            case SegmentReason.CollideOrAtmosphere:
                events.push({t: segment.startT, jsx: <Collide key={`s${segmentIdx}`}/>})
                break
            case SegmentReason.CurrentSimulationTime:
                // ignore
                break
        }
    }
    if(segments.length == 0) {
        events.push({t: simulationStart, jsx: <Calculating key="calc" t={simulationStart}/>})
    } else if(segments[segments.length-1].startT < simulationEnd) {
        const calcT = segments[segments.length-1].startT
        events.push({t: calcT, jsx: <Calculating key="calc" t={calcT}/>})
    }
    events.push({t: simulationEnd, jsx: <EndOfSimulation key="end" t={simulationEnd}/>})
    for(let burnIdx = 0; burnIdx < burns.length; burnIdx++) {
        if(burnsAlreadyAdded.includes(burnIdx)) continue
        events.push({t: burns[burnIdx].t, jsx: <BurnEvent
                key={`b${burnIdx}`}
                burn={burns[burnIdx]}
                onChange={b => setBurns(arrayReplaceElement(burns, burnIdx, b))}
            />})
    }
    events.sort((a, b) => a.t - b.t)
    const eventsJsx = events.map(e => e.jsx)

    return <><React.StrictMode>
        <h1>Mission planner</h1>
        <h2>Segments</h2>
        <ol id="segments">{eventsJsx}</ol>
    </React.StrictMode></>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
