import * as React from "react";
import ReactDOM from "react-dom";
import KspHierBody from "../components/kspHierBody";
import useFragmentState from 'useFragmentState';
import PrimaryBody, {
    fromString as primaryBodyFromString,
    toString as primaryBodyToString,
    resolve as primaryBodyResolve,
} from "./primaryBody";
import Orbit, {
    fromString as orbitFromString,
    toString as orbitToString
} from "./orbit";
import Preset from "../components/preset";
import {bodies} from "../utils/kspBody";

import "./app.css";

function App() {
    const [primaryBody, setPrimaryBody] = useFragmentState('p', primaryBodyFromString, primaryBodyToString);
    const [orbit, setOrbit] = useFragmentState('o', orbitFromString, orbitToString)

    let orbitsAroundPrimaryBody = {};
    if(typeof primaryBody === 'string') {
        for(let secondary of bodies[primaryBody].isOrbitedBy()) {
            orbitsAroundPrimaryBody[secondary.name] = secondary.name;
        }
    } else {  // list them all
        for(let planet of bodies['Kerbol'].isOrbitedBy()) {
            const moons = planet.isOrbitedBy();
            if(moons.length > 0) {
                orbitsAroundPrimaryBody[planet.name] = {}
                for(let moon of planet.isOrbitedBy()) {
                    orbitsAroundPrimaryBody[planet.name][moon.name] = moon.name;
                }
            } else {
                orbitsAroundPrimaryBody[planet.name] = planet.name;
            }
        }
    }

    return <div>
        <h1>Changing orbits</h1>
        <h2>Primary body</h2>
        <KspHierBody customValue="Custom"
                     value={typeof primaryBody === 'string' ? primaryBody : ""}
                     onChange={setPrimaryBody}
        />
        <PrimaryBody value={primaryBody}
                     onChange={setPrimaryBody}
        />
        <h2>Orbit</h2>
        <Preset options={orbitsAroundPrimaryBody}
                value={typeof orbit === 'string' ? orbit : ""}
                onChange={(v, o) => setOrbit(v)}
        />
        <Orbit value={orbit as any}  // TODO: fix 'as any'
               onChange={setOrbit}
               primaryBody={primaryBodyResolve(primaryBody)}
        />
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
