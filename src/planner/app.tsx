import './app.css';
import * as React from "react";
import {ReactChild, ReactNode, useEffect, useMemo, useState} from "react";
import ReactDOM from 'react-dom';
import useFragmentState from "useFragmentState";
import Orbit from "../utils/orbit";
import OrbitAround from "../utils/orbitAround";
import {bodies as kspBodies} from "../utils/kspBody";
import Vector from "../utils/vector";
import {Burn, ConicSegment, SegmentReason} from "./simWorker";
import OrbitDetails from "../components/orbit";
import {formatValueYdhmsAbs, KerbalAbsYdhmsInput, KerbalYdhmsInput} from "../components/formattedInput";
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
                onClick={() => {
                    if(props.onClick != null) props.onClick(!props.state)
                }}>
        {props.state ? "▾" : "▸"}
        {props.children}
    </div>
}


interface EventProps {
    t: Seconds
    summary: ReactChild
    className?: string
    children?: ReactNode
}
function Event(props: EventProps): JSX.Element {
    const [detailsOpen, setDetailsOpen] = useState(false)

    return <li className={props.className}>
        <Expander state={detailsOpen} onClick={setDetailsOpen}>{" "}
            {formatValueYdhmsAbs(props.t)}
            {" "}
            {props.summary}</Expander><br/>
        {detailsOpen ? props.children : null}
    </li>
}

interface InitialOrbitDetailsProps {
    startTime: Seconds
    setStartTime: (Seconds) => void
    initialOrbit: OrbitAround
    setInitialOrbit: (OrbitAround) => void
}
function InitialOrbitDetails(props: InitialOrbitDetailsProps): JSX.Element {
    return <>
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

interface BurnEventDetailsProps {
    burn: Burn
    onChange: (Burn) => void
    orbit?: OrbitAround
}
function BurnEventDetails(props: BurnEventDetailsProps): JSX.Element {
    return <>
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

interface SoiChangeDetailsProps {
    orbit: OrbitAround
}
function SoiChangeDetails(props: SoiChangeDetailsProps): JSX.Element {
    return <>
        <p>Orbit around {props.orbit.body.name}</p>
        <OrbitDetails
            value={props.orbit.orbit}
            primaryBody={props.orbit.body}
        />
    </>
}

interface CollideDetailsProps {
}
function CollideDetails(props: CollideDetailsProps): JSX.Element {
    return <></>
}

interface EndOfSimulationDetailsProps {
    simulationEndTime: Seconds
    setSimulationEndTime: (Seconds) => void
    simulationStartTime: Seconds
}
function EndOfSimulationDetails(props: EndOfSimulationDetailsProps): JSX.Element {
    return <>
        End simulation at <KerbalAbsYdhmsInput
            value={props.simulationEndTime}
            onChange={props.setSimulationEndTime}
        />, <KerbalYdhmsInput
            value={props.simulationEndTime - props.simulationStartTime}
            onChange={dt => props.setSimulationEndTime(props.simulationStartTime + dt)}
        /> after start
    </>
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

    const events: Array<JSX.Element> = [
        <Event
            key="initial"
            className="initial"
            t={simulationStart}
            summary={<>Initial <OrbitSummary value={initialOrbit}/></>}
        >
            <InitialOrbitDetails
                initialOrbit={initialOrbit}
                setInitialOrbit={setInitialOrbit}
                startTime={simulationStart}
                setStartTime={setSimulationStart}
            />
        </Event>,
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
                const burn = burns[segment.burnIdx]
                events.push(<Event
                        key={`s${segmentIdx}`}
                        t={segment.startT}
                        className="burn"
                        summary={<>{formatValueSi(burn.prn.norm)}m/s burn to <OrbitSummary value={segment.orbit}/></>}
                    ><BurnEventDetails
                        burn={burn}
                        onChange={b => {setBurns(arrayReplaceElement(burns, segment.burnIdx, b))}}
                        orbit={segment.orbit}
                    /></Event>)
                break
            case SegmentReason.SoIChange:
                events.push(<Event
                        key={`s${segmentIdx}`}
                        t={segment.startT}
                        className="SoIChange"
                        summary={<>SoI change to <OrbitSummary value={segment.orbit}/></>}
                    ><SoiChangeDetails
                        orbit={segment.orbit}
                    /></Event>)
                break
            case SegmentReason.CollideOrAtmosphere:
                events.push(<Event
                        key={`s${segmentIdx}`}
                        t={segment.startT}
                        className="collideOrAtmosphere"
                        summary={<>Collision</>}
                    ><CollideDetails/>
                </Event>)
                break
            case SegmentReason.CurrentSimulationTime:
                // ignore
                break
        }
    }
    if(segments.length == 0) {
        events.push(<Event
            key="calc"
            t={simulationStart}
            className="processing"
            summary={<>Calculating... {formatValueYdhmsAbs(simulationStart)}</>}
        />)
    } else if(segments[segments.length-1].startT < simulationEnd) {
        const calcT = segments[segments.length-1].startT
        events.push(<Event
            key="calc"
            t={calcT}
            className="processing"
            summary={<>Calculating...</>}
        />)
    }
    events.push(<Event
            key="end"
            t={simulationEnd}
            className="end"
            summary={<>End of simulation</>}
        ><EndOfSimulationDetails
            key="end"
            simulationStartTime={simulationStart}
            simulationEndTime={simulationEnd}
            setSimulationEndTime={setSimulationEnd}
        /></Event>)
    for(let burnIdx = 0; burnIdx < burns.length; burnIdx++) {
        if(burnsAlreadyAdded.includes(burnIdx)) continue
        const burn = burns[burnIdx]
        events.push(<Event
                key={`b${burnIdx}`}
                t={burn.t}
                className="burn"
                summary={<>{formatValueSi(burn.prn.norm)}m/s burn</>}
            ><BurnEventDetails
                burn={burns[burnIdx]}
                onChange={b => {setBurns(arrayReplaceElement(burns, burnIdx, b))}}
            /></Event>)
    }
    events.sort((a, b) => (a as any).t - (b as any).t)
    const eventsJsx = events.map(e => e)

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
