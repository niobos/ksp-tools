import * as React from "react";
import ReactDOM from "react-dom";
import KspHierBody from "../components/kspHierBody";
import useFragmentState from "../utils/useFragmentState";
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
import {bodiesHier, bodiesHierFind, planets} from "../utils/kspBody";

import "./app.css";

function App() {
    const [primaryBody, setPrimaryBody] = useFragmentState('p', primaryBodyFromString, primaryBodyToString);
    const [orbit, setOrbit] = useFragmentState('o', orbitFromString, orbitToString)

    let orbitsAroundPrimaryBody = {};
    if(typeof primaryBody === 'string') {
        const primaryBodyLoc = bodiesHierFind(primaryBody);
        if(primaryBodyLoc.length === 1) {  // Kerbol
            for(let planet of planets) {
                orbitsAroundPrimaryBody[planet] = planet;
            }
        } else if(primaryBodyLoc.length === 2) {  // a planet, list its moons
            const system = bodiesHier[`${primaryBody} system`];
            for(let i = 1; i < system.length; i++) {
                orbitsAroundPrimaryBody[system[i]] = system[i];
            }
        } // else: No orbit presets around a moon
    } else {  // list them all
        for(let system in bodiesHier) {
            if(bodiesHier[system] instanceof Array) {
                orbitsAroundPrimaryBody[system] = {}
                for(let body of bodiesHier[system]) {
                    orbitsAroundPrimaryBody[system][body] = body;
                }
            } else {
                orbitsAroundPrimaryBody[bodiesHier[system]] = bodiesHier[system];
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
        <Orbit value={orbit}
               onChange={setOrbit}
               primaryBody={primaryBodyResolve(primaryBody)}
        />
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
    };
}
