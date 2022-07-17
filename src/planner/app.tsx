import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import ReactDOM from 'react-dom';
import useFragmentState from "useFragmentState";
import Orbit from "../utils/orbit";
import OrbitAround from "../utils/orbitAround";
import {bodies as kspBodies} from "../utils/kspBody";
import Vector from "../utils/vector";
import {OrbitSummary} from "./orbitSummary";
import {default as OrbitDetails} from "../orbits/orbit";
import {KerbalAbsYdhmsInput} from "../components/formattedInput";
import BurnDetails from "./burnDetails";
import {useWorker} from "react-hooks-worker";
import {Burn, calcPatchedConicsInput, calcPatchedConicsOutput, EventType} from "./worker";

import './app.css';
import {arrayInsertElement, arrayReplaceElement} from "../utils/list";


interface DetailsProps {
    time: number
    setTime: (number) => void
    burn?: Burn
    setBurn?: (Burn) => void
    orbit: OrbitAround
    setOrbit?: (OrbitAround) => void
}
function Details(props: DetailsProps) {
    let maybeBurnDetailsJsx = <></>;
    if(props.burn != null) {
        maybeBurnDetailsJsx = <BurnDetails
            value={props.burn.prn}
            onChange={v => props.setBurn(props.burn.copy({prn: v}))}
        />;
    }
    return <>
        <p>Time: <KerbalAbsYdhmsInput
            value={props.time}
            onChange={props.setTime}
        /></p>
        {maybeBurnDetailsJsx}
        <p>Orbit:</p>
        <OrbitDetails
            primaryBody={props.orbit.body}
            value={props.orbit.orbit}
            onChange={props.setOrbit != null ? o => {
                props.setOrbit(new OrbitAround(
                    props.orbit.body,
                    o,
                ))
            } : null}
        />
    </>;
}

const createWorker = () => new Worker(new URL('./worker', import.meta.url));

function App() {
    const [startTime, setStartTime] = useFragmentState<number>('t0',
            s => {
                const t = parseFloat(s);
                if(isNaN(t)) return 150322;
                return t;
            },
            t => '' + t);
    const [initialOrbit, setInitialOrbit] = useFragmentState<OrbitAround>('io',
        s => {
            try {
                return OrbitAround.Unserialize(s);
            } catch(e) {
                return new OrbitAround(
                    kspBodies['Kerbin'],
                    Orbit.FromOrbitalElements(
                        kspBodies['Kerbin'].gravity,
                        {sma: 700e3},
                        {ma0: 0},
                    )
                );
            }
        },
        o => {
            return o.serialize();
        },
    );
    const [burns, setBurns] = useFragmentState<Burn[]>('b',
        s => {
            try {
                const o = JSON.parse(s);
                return o.map(e => Burn.Unserialize(e));
            } catch(e) {
                return [
                    Burn.create({t: 154860, prn: new Vector(900, 0, 0)}),
                ];
            }
        },
        o => {
            return JSON.stringify(o.map(e => e.serialize()));
        }
    );
    const [simulateTimeout, setSimulateTimeout] = useFragmentState<number>('f', 1*426*6*60*60);
    const [activeSegment, setActiveSegment] = useState<number | null>(0);
    const [segments, setSegments] = useState<Array<calcPatchedConicsOutput>>([]);

    const patchedConicsInput = useMemo<calcPatchedConicsInput>(() => {
            setSegments([]);
            return {startTime, initialOrbit, burns, simulateTimeout}
        },
        [startTime, initialOrbit, burns, simulateTimeout])
    const {result: segment} = useWorker<calcPatchedConicsInput, calcPatchedConicsOutput>(createWorker, patchedConicsInput);
    useEffect(() => {
        console.log("Got new segment from worker: ", segment);
        if(segment != null) {
            segment.newOrbit = OrbitAround.FromObject(segment.newOrbit);
            setSegments(arrayInsertElement(segments, segment));
        }
    }, [segment]);

    const segmentsJsx = [];
    for (let segmentIdx = 0; segmentIdx < segments.length; segmentIdx++) {
        const segment = segments[segmentIdx];
        if(segment.event != EventType.Intercept) {
            segmentsJsx.push(
                <li key={segmentIdx} onClick={e => setActiveSegment(segmentIdx)}
                    className={(activeSegment === segmentIdx ? "active" : "") + " " + EventType[segment.event]}
                ><OrbitSummary t={segment.t} value={segment.newOrbit}/>
                </li>,
            )
        }
    }
    if(segments.length === 0 || segments[segments.length-1].event != EventType.End) {
        segmentsJsx.push(<li key={segments.length} className="processing">
            calculating...
        </li>);
    }

    return <><React.StrictMode>
        <h1>Mission planner</h1>
        <div id="segments">
            <h2>Segments</h2>
            <ol id="segments">{segmentsJsx}</ol>
        </div>
        <div id="details">
            {(activeSegment < segments.length) ?
                <Details
                    time={segments[activeSegment].t}
                    setTime={(() => {
                        if (activeSegment === 0) return setStartTime;
                        if (segments[activeSegment].event === EventType.Burn) {
                            const burnIdx = segments[activeSegment].burnIdx;
                            return v => setBurns(arrayReplaceElement(burns, burnIdx, burns[burnIdx].copy({t: v})));
                        }
                    })()}
                    burn={segments[activeSegment].burnIdx != null ? burns[segments[activeSegment].burnIdx] : null}
                    setBurn={(() => {
                        const burnIdx = segments[activeSegment].burnIdx;
                        if(burnIdx != null) {
                            return (b) => setBurns(arrayReplaceElement(burns, burnIdx, b));
                        }
                        return null;
                    })()}
                    orbit={segments[activeSegment].newOrbit}
                    setOrbit={activeSegment === 0 ? setInitialOrbit : null}
                />
                : null
            }
        </div>
    </React.StrictMode></>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
