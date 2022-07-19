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
import {Burn, ConicSegment, SegmentReason} from "./worker";
import {arrayReplaceElement} from "../utils/list";

import './app.css';


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
                return o.map(e => Burn.FromObject(e));
            } catch(e) {
                return [
                    Burn.create({t: 154860, prn: new Vector(900, 0, 0)}),
                ];
            }
        },
        o => {
            return JSON.stringify(o.map(e => e.toObject()));
        }
    );
    const [endSimulation, setEndSimulation] = useFragmentState<number>('eos', 10*426*6*60*60);
    const [activeSegment, setActiveSegment] = useState<number | null>(0);
    const [segments, setSegments] = useState<Array<ConicSegment>>([]);

    const worker = useMemo(() => new Worker(new URL('./worker', import.meta.url)), []);
    // ^^ BUG: useMemo is *not* *guaranteed* to remember previous values. This may leak workers.
    worker.onmessage = (e) => {
        setSegments(e.data.map(s => {
            // Message is plain JSON objects; upgrade these to instances of classes
            s.orbit = OrbitAround.FromObject(s.orbit);
            return s;
        }));
    };
    useEffect(() => {
        worker.postMessage({
            type: 'setStartTime',
            value: startTime,
        });
    }, [startTime]);
    useEffect(() => {
        worker.postMessage({
            type: 'setInitialOrbit',
            value: initialOrbit,
        });
    }, [initialOrbit]);
    useEffect(() => {
        worker.postMessage({
            type: 'setBurns',
            value: burns,
        });
    }, [burns]);
    useEffect(() => {
        worker.postMessage({
            type: 'calculateUntil',
            value: endSimulation,
        });
    }, [endSimulation]);

    // const patchedConicsInput = useMemo<calcPatchedConicsInput>(() => {
    //         setSegments([]);
    //         return {startTime, initialOrbit, burns, simulateTimeout}
    //     },
    //     [startTime, initialOrbit, burns, simulateTimeout])
    //const {result: segment} = useWorker<calcPatchedConicsInput, calcPatchedConicsOutput>(createWorker, patchedConicsInput);
    // useEffect(() => {
    //     console.log("Got new segment from worker: ", segment);
    //     if(segment != null) {
    //         segment.newOrbit = OrbitAround.FromObject(segment.newOrbit);
    //         setSegments(arrayInsertElement(segments, segment));
    //     }
    // }, [segment]);

    const segmentsJsx = [];
    for (let segmentIdx = 0; segmentIdx < segments.length; segmentIdx++) {
        const segment = segments[segmentIdx];
        if(segment.reason == SegmentReason.EndOfSimulation) continue;
        segmentsJsx.push(
            <li key={segmentIdx} onClick={e => setActiveSegment(segmentIdx)}
                className={(activeSegment === segmentIdx ? "active" : "") + " " + SegmentReason[segment.reason]}
            ><OrbitSummary t={segment.startT} value={segment.orbit}/>
            </li>,
        )
    }
    if(!(segments[segments.length-1]?.startT >= endSimulation)) {  // !(>=) to work with undefined
        segmentsJsx.push(<li key={segments.length} className="processing">
            calculating...
        </li>);
    }
    segmentsJsx.push(<li key="end" className="end">
        <KerbalAbsYdhmsInput value={endSimulation} onChange={setEndSimulation}/> end simulation
    </li>);

    return <><React.StrictMode>
        <h1>Mission planner</h1>
        <div id="segments">
            <h2>Segments</h2>
            <ol id="segments">{segmentsJsx}</ol>
        </div>
        <div id="details">
            {(activeSegment < segments.length) ?
                <Details
                    time={segments[activeSegment].startT}
                    setTime={(() => {
                        if (activeSegment === 0) return setStartTime;
                        if (segments[activeSegment].reason === SegmentReason.Burn) {
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
                    orbit={segments[activeSegment].orbit}
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
