import React from "react";
import ReactDOM from "react-dom";
import {KerbalDateInput} from '../components/formatedInput';
import useFragmentState from "../utils/useFragmentState";
import {orbits} from "../utils/kspOrbit";

function App() {
    const [time, setTime] = useFragmentState('t', 0);

    const minmusInclination = orbits.Minmus.inc;
    const minmusLAN = orbits.Minmus.lon_an;
    const currentLongitude = orbits.Kerbin
    const orbitCrossingT = "TODO";

    return <div>
        <h1>Kerbin departures to Minmus</h1>
        <p>Current date: <KerbalDateInput
            value={time}
            onChange={setTime}
        /></p>
        <p>Minmus has an inclination of {(minmusInclination/Math.PI*180).toFixed(1)}º
        with a Longitude of Ascending Node of {(minmusLAN/Math.PI*180).toFixed(1)}º</p>
        <p>KSC passes through the plane of the orbit of Minmus at {orbitCrossingT}</p>
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
    };
}
