import * as React from 'react';
import ReactDOM from 'react-dom';
import Orbit from "../utils/orbit";
import {bodies as kspBodies} from "../utils/kspBody";
import {orbits as kspOrbits} from "../utils/kspOrbit";
import {FloatInput, KerbalDateInput, KerbalYdhmsInput} from "../components/formatedInput";
import Altitude from "../orbits/altitude";
import useFragmentState from 'useFragmentState';

import './app.css';
import KspHierBody from "../components/kspHierBody";

function roundedTo(value, multiple) {
    return Math.round(value / multiple) * multiple;
}

export default function App() {
    const [moonName, setMoonName] = useFragmentState<string>('m', 'Minmus')
    const [parkingSma, setParkingSma] = useFragmentState('p', 700000);
    const [departureTimeUT, setDepartureTimeUT] = useFragmentState('t', 236*6*60*60 + 4*60*60 + 19*60 + 12);
    const [ejectionAngle, setEjectionAngle] = useFragmentState('e', 162/180*Math.PI);
    const [ejectionAngleReference, setEjectionAngleReference] = useFragmentState<number>('er',
        s => s === 'r' ? Math.PI : 0,
        v => v === Math.PI ? 'r' : 'p',
        );
    const [ejectionBurn, setEjectionBurn] = useFragmentState('b', 1047);

    const moon = kspBodies[moonName];
    const planet = moon.orbitsAround;
    const moonOrbit = kspOrbits[moonName];
    const planetOrbit = kspOrbits[planet.name];

    const parkingSpeed = 2 * Math.PI * parkingSma /
        Orbit.periodFromSma(planet.gravity, parkingSma);

    const planetTaAtDeparture = planetOrbit.taAtT(departureTimeUT);
    const planetAngleAtDeparture =
        planetTaAtDeparture + planetOrbit.argumentOfPeriapsis + planetOrbit.longitudeAscendingNode;
    const planetProgradeAngleAtDeparture =
        planetAngleAtDeparture + Math.PI/2
        - planetOrbit.flightAngleAtTa(planetTaAtDeparture);
    const planetDepartureBurnAngle = planetProgradeAngleAtDeparture - ejectionAngle;

    const {sma: moonPlanetOrbitSma, e: moonPlanetOrbitE} = Orbit.smaEFromApsides(
        moonOrbit.semiMajorAxis,  // TODO: assumes moon eccentricity === 0
        parkingSma,
    );
    const moonPlanetOrbit = Orbit.FromOrbitalElements(
        planet.gravity,
        {sma: moonPlanetOrbitSma, e: moonPlanetOrbitE},
    );
    const moonPlanetTransferTime = moonPlanetOrbit.period / 2;

    const moonDepartureAngle = planetDepartureBurnAngle - Math.PI;
    const moonTa = moonDepartureAngle
        - moonOrbit.argumentOfPeriapsis - moonOrbit.longitudeAscendingNode;
    let moonT = moonOrbit.tAtTa(moonTa);
    while(moonT < departureTimeUT - moonPlanetTransferTime) moonT += moonOrbit.period;
    while(moonT >= departureTimeUT - moonPlanetTransferTime) moonT -= moonOrbit.period;

    const options = [];
    for(let i = 0; i<10; i++) {
        let arrival = moonT + moonPlanetTransferTime;
        let to = 0;
        while(arrival <= departureTimeUT - moonPlanetOrbit.period) {
            arrival += moonPlanetOrbit.period;
            to += 1;
        }
        if(departureTimeUT - arrival > moonPlanetOrbit.period/2) {
            // Round up
            arrival += moonPlanetOrbit.period;
            to += 1;
        }
        const actualPeriapsisTime = moonT + to * moonPlanetOrbit.period + moonPlanetTransferTime;
        let diff = actualPeriapsisTime - departureTimeUT;
        const diffDir = diff < 0 ? "early" : "late";
        diff = diff < 0 ? -diff : diff;
        options.push(<div key={i}>{KerbalDateInput.formateDate(roundedTo(moonT, 6*3600))}
            {" + "}{to} * {KerbalYdhmsInput.formatValueSingleUnit(roundedTo(moonPlanetOrbit.period, 3600))}
            {" + "}{KerbalYdhmsInput.formatValueSingleUnit(moonPlanetTransferTime)}
            {" = "}{KerbalDateInput.formateDate(actualPeriapsisTime)}
            {" "}({KerbalYdhmsInput.formatValueSingleUnit(diff)} {diffDir})
        </div>);

        moonT -= moonOrbit.period;
        if(moonT < 0) break;
    }

    return <div>
        <h2>Interplanetary departure from a Moon</h2>
        <p>This planner is heavily inspired on the <a href="https://alexmoon.github.io/ksp/">KSP Launch Window Planner by alexmoon</a>.
        Writing this planner was an exercise for me to learn TypeScript, Service Workers & Canvas.</p>
        <p>Contrary to alexmoon's planner, this planner will depart from a moon of a planet (e.g. Minmus),
        and do a powered gravity assist around the Planet (e.g. Kerbin) to launch on an interplanetary trajectory.</p>
        <table><tbody>
        <tr><td>Moon:</td><td>
            <KspHierBody value={moonName} onChange={v => {
                if(kspBodies[v].orbitsAround.name === "Kerbol") {
                    // Selected a planet, not a moon, ignore
                } else {
                    setMoonName(v);
                }
            }}/>, departing out of {planet.name} system
        </td></tr>
        <tr><td>Parking orbit from Launch Window Planner:</td><td>
            <Altitude value={parkingSma}
                      onChange={v => setParkingSma(v)}
                      primaryBody={planet}
            />, {parkingSpeed.toFixed(1)} m/s
        </td></tr>
        <tr><td>Departure date:</td><td>
            <KerbalDateInput value={departureTimeUT}
                              onChange={v => setDepartureTimeUT(v)}
            />
        </td></tr>
        <tr><td>Ejection angle from Launch Planner:</td><td>
            <FloatInput value={(ejectionAngle + ejectionAngleReference)/Math.PI*180} decimals={1}
                        onChange={v => setEjectionAngle(v/180*Math.PI - ejectionAngleReference)}
            />º before
            <select value={ejectionAngleReference === Math.PI ? 'r' : 'p'}
                    onChange={e => setEjectionAngleReference(e.target.value == 'p' ? 0 : Math.PI)}>
              <option value="p">prograde</option>
              <option value="r">retrograde</option>
            </select></td></tr>
        <tr><td>Ejection burn from Launch Planner:</td><td>
            <FloatInput value={ejectionBurn} decimals={1}
                        onChange={v => setEjectionBurn(v)}
            /> m/s
        </td></tr>
        </tbody></table>
        <h2>Maneuvers</h2>
        At departure, planet has a TA={planetTaAtDeparture}rad.<br/>
        At departure, planet is at {planetAngleAtDeparture}rad from the reference direction.<br/>
        Planet prograde is at {planetProgradeAngleAtDeparture}rad from ref.<br/>
        Departure burn at {planetDepartureBurnAngle}rad.<br/>
        Travel time from Moon: {KerbalYdhmsInput.formatValueSingleUnit(moonPlanetTransferTime)}.<br/>
        Departure burn from Moon orbit: {moonOrbit.speedAtTa(0) - moonPlanetOrbit.speedAtTa(Math.PI)}<br/>
        Apoapsis of elliptical Moon-Planet orbit at {moonDepartureAngle}rad.<br/>
        Moon TA there {moonTa}rad.<br/>
        Speed at periapsis of elliptical Moon-Planet orbit: {moonPlanetOrbit.speedAtTa(0)}<br/>
        Burn at periapsis of elliptical Moon-Planet orbit: {parkingSpeed + ejectionBurn - moonPlanetOrbit.speedAtTa((0))}<br/>
        {options}
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
