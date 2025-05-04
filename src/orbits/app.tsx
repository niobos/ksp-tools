import * as React from "react";
import ReactDOM from "react-dom";
import {useEffect, useMemo, useState} from "react"
import {default as BodyComp} from "./body"
import Orbit from "../utils/orbit"
import {default as OrbitComp, fromString as OrbitFromString, toString as OrbitToString} from "../components/orbit"
import Solution from "./solution"
import {CalculatedTrajectory} from "./solver"
import Vector from "../utils/vector"
import useFragmentState from "useFragmentState"
import kspSystems, {Body, GRAVITATIONAL_CONSTANT} from "../utils/kspSystems"
import "./app.css"
import {SystemSelect} from "../components/kspSystemSelect";

let REQUEST_ID = 0;

function App() {
    const [systemName, setSystemName] = useFragmentState<string>('sys', "Stock")
    const system = kspSystems[systemName]
    const [primaryBody, setPrimaryBody] = useFragmentState<Body>('p',
        s => {
            try {
                const j = JSON.parse(s)
                if(j == null) return system.bodies[system.defaultBodyName]
                if(typeof j === "string") return system.bodies[j]
                return Body.Deserialize(j)
            } catch(e) {
                return system.bodies[system.defaultBodyName]
            }
        },
        b => {
            if(b.name != null) return JSON.stringify(b.name)
            return JSON.stringify(b.serialize())
        }
    )
    const [orbitStart, setOrbitStart] = useFragmentState<Orbit>('f',
        s => OrbitFromString(
            system,
            s,
            Orbit.FromOrbitalElements(primaryBody.gravity, Orbit.smaEFromApsides(700e3, 750e3)),
            primaryBody.gravity),
        OrbitToString,
        )
    const [orbitEnd, setOrbitEnd] = useFragmentState<Orbit>('t',
        s => OrbitFromString(
            system,
            s, Orbit.FromOrbitalElements(primaryBody.gravity,
                {...Orbit.smaEFromApsides(15e6, 15.5e6), inc: 5*Math.PI/180}),
            primaryBody.gravity),
        OrbitToString,
    )

    const [solutions, setSolutions] = useState<Array<CalculatedTrajectory>>([])
    const worker = useMemo(() => new Worker(new URL('./solver', import.meta.url)), [])
    useEffect(() => {
        const handler = (m) => {
            if(m.data.requestId != REQUEST_ID) return
            const trajectories = m.data.result
            const newSolutions = trajectories.map(t => {
                t.legs = t.legs.map(l => {
                    l.nextOrbit = Orbit.FromObject(l.nextOrbit)
                    l.burn.dvPrn = Vector.FromObject(l.burn.dvPrn)
                    return l
                })
                return t
            })
            setSolutions((prevSolutions) =>
                [...prevSolutions, ...newSolutions].sort((a, b) => a.dv - b.dv))
        }
        worker.addEventListener("message", handler)
        //return () => { worker.removeEventListener("message", handler) }
        // if worker changes, no need to clean up previous worker
    }, [worker])
    useEffect(() => {
        setSolutions([])
        const requestId = ++REQUEST_ID;
        worker.postMessage({
            requestId,
            sourceOrbit: orbitStart,
            destOrbit: orbitEnd,
        })
    }, [orbitStart, orbitEnd])

    return <>
        <h1>Changing orbits</h1>
        <p>
            This tool will try various strategies to transfer from one orbit to another.
            There is no guarantee that the optimal solution is found.
        </p>
        System: <SystemSelect value={systemName} onChange={setSystemName}/><br/>
        <BodyComp
            system={system}
            value={primaryBody}
            onChange={(b) => {
                setPrimaryBody(b)
                setOrbitStart(Orbit.FromOrbitWithUpdatedOrbitalElements(orbitStart, {gravity: b.gravity}))
                setOrbitEnd(Orbit.FromOrbitWithUpdatedOrbitalElements(orbitEnd, {gravity: b.gravity}))
            }}
        />
        <h2>Start orbit</h2>
        <OrbitComp
            system={system}
            key={"orbitStart"}
            primaryBody={primaryBody}
            value={orbitStart}
            phasing={false}
            onChange={(o) => setOrbitStart(o)}
        />
        <p><input type="button" value="Swap orbits" onClick={() => {
            setOrbitStart(orbitEnd)
            setOrbitEnd(orbitStart)
        }}/></p>
        <h2>Target orbit</h2>
        <OrbitComp
            system={system}
            key={"orbitTarget"}
            primaryBody={primaryBody}
            value={orbitEnd}
            phasing={false}
            onChange={(o) => setOrbitEnd(o)}
        />
        <h2>Transfer</h2>
        <ol className="solutions">
            {solutions.map((s, i) => <li className="solution" key={i}>
                <Solution trajectory={s}/>
            </li>)}
        </ol>
    </>
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
