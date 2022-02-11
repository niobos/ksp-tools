import React from "react";
import ReactDOM from "react-dom";
import {KerbalDateInput, KerbalYdhmsInput} from '../components/formatedInput';
import useFragmentState from "../utils/useFragmentState";
import {orbits} from "../utils/kspOrbit";
import Orbit from "../utils/orbit";
import {bodies} from "../utils/kspBody";
import {launchSites} from "../utils/kspLaunchSites";

import './app.css';

function App() {
    const [time, setTime] = useFragmentState('t', 0);

    const minmusInclination = orbits.Minmus.inclination;
    const minmusLAN = orbits.Minmus.longitudeAscendingNode;

    const lko = Orbit.FromOrbitalElements(bodies.Kerbin.gravity,
        {sma: bodies.Kerbin.radius + 100_000, e: 0},
    );
    const vLko = lko.speedAtTa(0);
    const dv100kPlaneChange = Math.sqrt(
        Math.pow(Math.sin(minmusInclination), 2)
        + Math.pow(1-Math.cos(minmusInclination), 2)
    ) * vLko;

    const kerbinPosition = orbits.Kerbin.positionAtT(time);
    const midnightDirection = Math.atan2(kerbinPosition.y, kerbinPosition.x);
    const directionAtKsc0h = midnightDirection + Math.PI - (5 / 6 + 44 / 6 / 60);
    // ^^ based on experiments: it's noon around 5:44 every day of the year at KSC.
    const timeForNodeDirection = ((orbits.Minmus.longitudeAscendingNode - directionAtKsc0h)/(2*Math.PI) + 1) % 1 * 6*60*60;
    const timeFirstOpportunity = time - time % (6*60*60) + timeForNodeDirection;
    const siderealDay = 6*60*60 * (1 - (6*60*60 / orbits.Kerbin.period));

    const launchDirAn = Math.asin(Math.cos(minmusInclination)/Math.cos(launchSites["Kerbal Space Center"].lat));  // from [OMES 6.24]
    const launchDirDn = Math.PI - launchDirAn;

    const launchOpportunitiesJsx = [];
    for(let i=0; i<5; i++) {
        const timeAN = KerbalDateInput.formateDate(timeFirstOpportunity + i * siderealDay);
        launchOpportunitiesJsx.push(<li>{timeAN} launch azimuth {(launchDirAn/Math.PI*180).toFixed(0)}º (ENE)</li>);
        const timeDN = KerbalDateInput.formateDate(timeFirstOpportunity + i * siderealDay + siderealDay/2);
        launchOpportunitiesJsx.push(<li>{timeDN} launch azimuth {(launchDirDn/Math.PI*180).toFixed(0)}º (ESE)</li>);
    }

    return <div>
        <h1>Kerbin departures to Minmus</h1>
        <p>Minmus has an inclination of {(minmusInclination/Math.PI*180).toFixed(1)}º
        with a Longitude of Ascending Node of {(minmusLAN/Math.PI*180).toFixed(1)}º</p>
        <p>To change the inclination of a 100kmAGL circular orbit from 0º to the inclination of Minmus,
            requires {dv100kPlaneChange.toFixed(1)}m/s</p>
        <p>But twice a day, any launch site that has a latitude of less than {(minmusInclination/Math.PI*180).toFixed(0)}º
        passes through the orbital plane of Minmus. If we launch then, we can immediately be in the correct plane.</p>
        <p>Launch opportunities from Kerbal Space Center after <KerbalDateInput value={time} onChange={setTime}/>:</p>
        <ul>
            {launchOpportunitiesJsx}
        </ul>
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
    };
}
