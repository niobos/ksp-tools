import * as React from "react";
import ReactDOM from "react-dom";
import {useState} from "react";
import {default as Body, bodies as kspBodies} from "../utils/kspBody"
import {default as BodyComp} from "./body"
import Orbit from "../utils/orbit"
import {default as OrbitComp} from "../components/orbit"
import Solution, {SolutionProps} from "./solution"
import "./app.css"
import solve, {Leg} from "./solver";

function App() {
    const [primaryBody, setPrimaryBody] = useState<Body>(kspBodies["Kerbin"])
    const [orbitStart, setOrbitStart] = useState<Orbit>(
        Orbit.FromOrbitalElements(
            primaryBody.gravity,
            Orbit.smaEFromApsides(700e3, 900e3)
        ))
    const [orbitEnd, setOrbitEnd] = useState<Orbit>(
        Orbit.FromOrbitalElements(
            primaryBody.gravity,
            Orbit.smaEFromApsides(1e6, 1.4e6)
        ))

    const solutions = solve(orbitStart, orbitEnd)

    return <>
        <h1>Changing orbits</h1>
        <BodyComp
            value={primaryBody}
            onChange={(b) => setPrimaryBody(b)}
        />
        <h2>Start orbit</h2>
        <OrbitComp
            key={"orbitStart"}
            primaryBody={primaryBody}
            value={orbitStart}
            onChange={(o) => setOrbitStart(o)}
        />
        <h2>Transfer</h2>
        <ol className="solutions">
            {solutions.map((s, i) => <li className="solution" key={i}>
                <Solution
                    name={s.name}
                    legs={s.legs}
                /></li>)}
        </ol>
        <h2>Target orbit</h2>
        <OrbitComp
            key={"orbitTarget"}
            primaryBody={primaryBody}
            value={orbitEnd}
            onChange={(o) => setOrbitEnd(o)}
        />
    </>
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
