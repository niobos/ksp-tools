import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import ReactDOM from 'react-dom';
import useFragmentState from "useFragmentState";
import Orbit from "../utils/orbit";
import OrbitAround from "../utils/orbitAround";
import {bodies as kspBodies} from "../utils/kspBody";
import Vector from "../utils/vector";
import {OrbitSummary} from "./orbitSummary";
import {default as OrbitDetails} from "../components/orbit";
import {formatValueYdhmsAbs, KerbalAbsYdhmsInput, KerbalYdhmsInput} from "../components/formattedInput";
import BurnDetails from "./burnDetails";
import {Burn, ConicSegment, SegmentReason} from "./worker";
import {arrayInsertElement, arrayRemoveElement, arrayReplaceElement} from "../utils/list";

import './app.css';


interface DetailsProps {
    time: number
    setTime: (number) => void
    missionStartTime?: number
    burn?: Burn
    setBurn?: (Burn) => void
    orbit: OrbitAround
    setOrbit?: (OrbitAround) => void
}
function Details(props: DetailsProps) {
    let maybeBurnDetailsJsx = <></>;
    if(props.burn != null) {
        maybeBurnDetailsJsx = <><BurnDetails
            value={props.burn.prn}
            onChange={v => props.setBurn(props.burn.copy({prn: v}))}
        /><input type="button" value="Remove burn"
                 onClick={e => {
                     props.setBurn(null)
                 }}
        /></>;
    }
    return <>
        <p>Time: <KerbalAbsYdhmsInput
            value={props.time}
            onChange={props.setTime}
            readOnly={props.setTime == null}
        />UT<span style={{visibility: props.missionStartTime != null ? 'visible' : 'hidden'}}>, <KerbalYdhmsInput
            value={props.time - props.missionStartTime}
            onChange={v => props.setTime(v + props.missionStartTime)}
            readOnly={props.setTime == null}
        />MET</span></p>
        {maybeBurnDetailsJsx}
        <h3>(new) orbit:</h3>
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

interface SegmentListProps {
    segments: Array<ConicSegment>
    activeSegment: number
    setActiveSegment: (segment: number) => void
    burns: Array<Burn>
    simulationEnd: number
    setSimulationEnd: (t: number) => void
}
function SegmentList(props: SegmentListProps) {
    const segmentsJsx = [];
    for (let segmentIdx = 0; segmentIdx < props.segments.length; segmentIdx++) {
        const segment = props.segments[segmentIdx];
        if(segment.reason == SegmentReason.CurrentSimulationTime) continue;
        segmentsJsx.push(
            <li key={segmentIdx} onClick={e => props.setActiveSegment(segmentIdx)}
                className={(props.activeSegment === segmentIdx ? "active" : "") + " " + SegmentReason[segment.reason]}
            >t={formatValueYdhmsAbs(segment.startT)}{" "}<OrbitSummary value={segment.orbit}/>
            </li>,
        )
    }
    const currentSimulationProgress = props.segments[props.segments.length-1]?.startT;
    if(!(currentSimulationProgress >= props.simulationEnd)) {  // !(>=) to work with undefined
        segmentsJsx.push(<li key={props.segments.length} className="processing">
            calculating ({formatValueYdhmsAbs(currentSimulationProgress)})...
        </li>);
    }
    for(let burnIdx=0; burnIdx < props.burns.length; burnIdx ++) {
        const burn = props.burns[burnIdx]
        if(burn.t <= currentSimulationProgress) continue
        segmentsJsx.push(
            <li key={"b"+burnIdx}
                //onClick={e => props.setActiveSegment(segmentIdx)}
                // className={(props.activeSegment === segmentIdx ? "active" : "") + " " + SegmentReason.Burn}
                className={"Burn"}
            >t={formatValueYdhmsAbs(burn.t)}
            </li>,
        )
    }
    segmentsJsx.push(<li key="end" className="end">
        <KerbalAbsYdhmsInput value={props.simulationEnd} onChange={props.setSimulationEnd}/> end simulation
    </li>);

    return <ol id="segments">{segmentsJsx}</ol>
}

function App() {
    const [startTime, setStartTime] = useFragmentState<number>('t0',
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
    );
    const [simulationEnd, setSimulationEnd] = useFragmentState<number>('te', 10*426*6*60*60)

    const [activeSegment, setActiveSegment] = useState<number | null>(0)
    const [segments, setSegments] = useState<Array<ConicSegment>>([])

    const worker = useMemo(() => new Worker(new URL('./worker', import.meta.url)), []);
    // ^^ BUG: useMemo is *not* *guaranteed* to remember previous values. This may leak workers.
    worker.onmessage = (e) => {
        if(e.data?.type != 'segments') return
        setSegments(e.data.value.map(s => {
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
    }, [initialOrbit]);
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
            value: simulationEnd,
        });
    }, [simulationEnd]);

    return <><React.StrictMode>
        <h1>Mission planner</h1>
        <div id="segments">
            <h2>Segments</h2>
            <SegmentList
                burns={burns}
                segments={segments}
                activeSegment={activeSegment}
                setActiveSegment={setActiveSegment}
                simulationEnd={simulationEnd}
                setSimulationEnd={setSimulationEnd}
            />
        </div>
        <div id="details">
            {(activeSegment < segments.length) ?
                <><Details
                    missionStartTime={startTime}
                    time={segments[activeSegment].startT}
                    setTime={(() => {
                        if (activeSegment === 0) return setStartTime
                        if (segments[activeSegment].reason === SegmentReason.Burn) {
                            const burnIdx = segments[activeSegment].burnIdx
                            return v => setBurns(arrayReplaceElement(burns, burnIdx, burns[burnIdx].copy({t: v})))
                        }
                        return null
                    })()}
                    burn={segments[activeSegment].burnIdx != null ? burns[segments[activeSegment].burnIdx] : null}
                    setBurn={(() => {
                        const burnIdx = segments[activeSegment].burnIdx;
                        if(burnIdx != null) {
                            return (b) => {
                                if(b != null) setBurns(arrayReplaceElement(burns, burnIdx, b))
                                else setBurns(arrayRemoveElement(burns, burnIdx))
                            }
                        }
                        return null;
                    })()}
                    orbit={segments[activeSegment].orbit}
                    setOrbit={activeSegment === 0 ? setInitialOrbit : null}
                />
                <input
                    type="button" value="Add burn in this segment"
                    onClick={e => {
                        let newBurnTime = segments[activeSegment].startT
                        if(segments[activeSegment + 1]?.startT != null) {
                            newBurnTime = (newBurnTime + segments[activeSegment + 1]?.startT) / 2
                        }
                        setBurns(
                            arrayInsertElement(
                                burns,
                                Burn.create({t: newBurnTime, prn: new Vector(0, 0, 0)})
                            ).sort((a, b) => a.t - b.t)
                        )
                        setActiveSegment(activeSegment + 1)
                    }}
                />
                </>
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
