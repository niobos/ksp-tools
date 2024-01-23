import * as React from "react";
import ReactDOM from "react-dom";
import {useCallback, useEffect, useMemo, useState} from "react";
import {default as Body, bodies as kspBodies, GRAVITATIONAL_CONSTANT} from "../utils/kspBody"
import {default as BodyComp} from "./body"
import Orbit from "../utils/orbit"
import {default as OrbitComp, fromString as OrbitFromString, toString as OrbitToString} from "../components/orbit"
import Solution from "./solution"
import "./app.css"
import {CalculatedTrajectory, SolverInput, Trajectory} from "./solver";
import Vector from "../utils/vector";
import useFragmentState from "useFragmentState";

let REQUEST_ID = 0;

function App() {
    const [primaryBody, setPrimaryBody] = useFragmentState<Body>('p',
        s => {
            try {
                const j = JSON.parse(s)
                if(j == null) return kspBodies["Kerbin"]
                if(typeof j === "string") return kspBodies[j]
                return Body.create(j)
            } catch(e) {
                return kspBodies["Kerbin"]
            }
        },
        b => {
            if(b.name != null) return JSON.stringify(b.name)
            return JSON.stringify({
                mass: b.gravity / GRAVITATIONAL_CONSTANT,
                radius: b.radius,
                atmosphere: b.atmosphere,
                soi: b.soi,
            })
        }
    )
    const [orbitStart, setOrbitStart] = useFragmentState<Orbit>('f',
        s => OrbitFromString(
            s,
            Orbit.FromOrbitalElements(primaryBody.gravity, Orbit.smaEFromApsides(700e3, 700e3)),
            primaryBody.gravity),
        OrbitToString,
        )
    const [orbitEnd, setOrbitEnd] = useFragmentState<Orbit>('t',
        s => OrbitFromString(
            s, Orbit.FromOrbitalElements(primaryBody.gravity, Orbit.smaEFromApsides(15e6, 15e6)),
            primaryBody.gravity),
        OrbitToString,
    )

    const solver = useMemo(() => new Worker(new URL('./solver', import.meta.url)), [])
    const asyncCalc = useCallback((candidates: Trajectory[] = null, iterations: number) => {
        return new Promise<Array<CalculatedTrajectory>>((resolve, _) => {
            const requestId = REQUEST_ID++;
            const handler = (m: MessageEvent) => {
                if(m.data.requestId != requestId) return
                solver.removeEventListener("message", handler)
                const out = m.data.sortedResult
                resolve(out)
            }
            solver.addEventListener("message", handler)
            const m: SolverInput = {
                requestId,
                sourceOrbit: orbitStart,
                destOrbit: orbitEnd,
                candidates,
                iterations,
            }
            solver.postMessage(m)
        })
    }, [orbitStart, orbitEnd])

    const [solutions, setSolutions] = useState<Array<CalculatedTrajectory>>([])
    const [generations, setGenerations] = useState<number>(0)
    const doCalc = async () => {
        let bestDv = Infinity
        let lastChanged = 0
        let candidates: CalculatedTrajectory[] = null
        let batchSize = 1
        //console.log("Restarting calculations")
        let iterations = 0
        while(true) {
            const batchStart = +(new Date())
            candidates = await asyncCalc(candidates, batchSize)
            iterations += batchSize
            //console.log("Got results in main thread: ", candidates)
            const bestCandidates = candidates.slice(0, 5)  // extract top-5 for display
            setSolutions(bestCandidates.map(t => {
                t.legs = t.legs.map(l => {
                    l.nextOrbit = Orbit.FromObject(l.nextOrbit)
                    l.burn.dvPrn = Vector.FromObject(l.burn.dvPrn)
                    return l
                })
                return t
            }))
            setGenerations(iterations)

            if(bestCandidates[0].dv < bestDv) {
                bestDv = bestCandidates[0].dv
                lastChanged = 0
            } else if(lastChanged++ > 10) break

            const batchDuration = +(new Date()) - batchStart
            if(batchDuration < 200) {
                batchSize = batchSize * 2
            } else if(batchDuration > 500) {
                batchSize = Math.max(Math.floor(batchSize / 2), 1)
            } else {
                //console.log(`Batch size of ${batchSize} took ${batchDuration}ms => ${batchDuration / batchSize} per request`)
            }
        }
        //console.log("Best found: ", candidates[0])
    }
    useEffect(() => {
        doCalc().then(() => {})
    }, [orbitStart, orbitEnd])

    return <>
        <h1>Changing orbits</h1>
        <p>
            This tool will try to find a 2-burn transfer between the given orbits around the given body.
            It will do so by starting out with a random set of transfers, and running a Genetic Algorithm on
            the transfers to select for lowest ∆v.
        </p>
        <BodyComp
            value={primaryBody}
            onChange={(b) => {
                setPrimaryBody(b)
                setOrbitStart(Orbit.FromOrbitWithUpdatedOrbitalElements(orbitStart, {gravity: b.gravity}))
                setOrbitEnd(Orbit.FromOrbitWithUpdatedOrbitalElements(orbitEnd, {gravity: b.gravity}))
            }}
        />
        <h2>Start orbit</h2>
        <OrbitComp
            key={"orbitStart"}
            primaryBody={primaryBody}
            value={orbitStart}
            phasing={false}
            onChange={(o) => setOrbitStart(o)}
        />
        <h2>Transfer</h2>
        <p>Top 5 solutions after {generations} generations:</p>
        <ol className="solutions">
            {solutions.map((s, i) => <li className="solution" key={i}>
                <Solution trajectory={s}/>
            </li>)}
        </ol>
        <h2>Target orbit</h2>
        <OrbitComp
            key={"orbitTarget"}
            primaryBody={primaryBody}
            value={orbitEnd}
            phasing={false}
            onChange={(o) => setOrbitEnd(o)}
        />
    </>
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
