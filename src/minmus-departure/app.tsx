import React from 'react';
import ReactDOM from 'react-dom';

import './app.css';
import Orbit from "../utils/orbit";
import {bodies as kspBodies} from "../utils/kspBody";
import {orbits as kspOrbits} from "../utils/kspOrbit";
import {FloatInput, KerbalDateInput, KerbalYdhmsInput} from "../components/formatedInput";
import Apside from "../orbits/apside";
import useFragmentState from "../utils/useFragmentState";

function roundedTo(value, multiple) {
    return Math.round(value / multiple) * multiple;
}

export default function App() {
    const [parkingSma, setParkingSma] = useFragmentState('p', 700000);
    const [departureTimeUT, setDepartureTimeUT] = useFragmentState('t', 236*6*60*60 + 4*60*60 + 19*60 + 12);
    const [ejectionAngle, setEjectionAngle] = useFragmentState('e', 162/180*Math.PI);
    const [ejectionBurn, setEjectionBurn] = useFragmentState('b', 1047);

    const parkingSpeed = 2 * Math.PI * parkingSma /
        Orbit.periodFromSma(kspBodies.Kerbin.gravity, parkingSma);

    const kerbinTaAtDeparture = kspOrbits.Kerbin.taAtT(departureTimeUT);
    const kerbinAngleAtDeparture =
        kerbinTaAtDeparture + kspOrbits.Kerbin.argumentOfPeriapsis + kspOrbits.Kerbin.longitudeAscendingNode;
    const kerbinProgradeAngleAtDeparture =
        kerbinAngleAtDeparture + Math.PI/2
        - kspOrbits.Kerbin.flightAngleAtTa(kerbinTaAtDeparture);
    const kerbinDepartureBurnAngle = kerbinProgradeAngleAtDeparture - ejectionAngle;

    const {sma: minmusKerbinOrbitSma, e: minmusKerbinOrbitE} = Orbit.smaEFromApsides(
        kspOrbits.Minmus.semiMajorAxis,  // assumes ksp.orbits.Minmus.e === 0 (which is correct)
        parkingSma,
    );
    const minmusKerbinOrbit = Orbit.FromOrbitalElements(
        kspBodies.Kerbin.gravity,
        {sma: minmusKerbinOrbitSma, e: minmusKerbinOrbitE},
    );
    const minmusKerbinTransferTime = minmusKerbinOrbit.period / 2;

    const minmusDepartureAngle = kerbinDepartureBurnAngle - Math.PI;
    const minmusTa = minmusDepartureAngle
        - kspOrbits.Minmus.argumentOfPeriapsis - kspOrbits.Minmus.longitudeAscendingNode;
    let minmusT = kspOrbits.Minmus.tAtTa(minmusTa);
    while(minmusT < departureTimeUT - minmusKerbinTransferTime) minmusT += kspOrbits.Minmus.period;
    while(minmusT >= departureTimeUT - minmusKerbinTransferTime) minmusT -= kspOrbits.Minmus.period;

    const options = [];
    for(let i = 0; i<10; i++) {
        let arrival = minmusT + minmusKerbinTransferTime;
        let to = 0;
        while(arrival <= departureTimeUT - minmusKerbinOrbit.period) {
            arrival += minmusKerbinOrbit.period;
            to += 1;
        }
        if(departureTimeUT - arrival > minmusKerbinOrbit.period/2) {
            // Round up
            arrival += minmusKerbinOrbit.period;
            to += 1;
        }
        const actualPeriapsisTime = minmusT + to * minmusKerbinOrbit.period + minmusKerbinTransferTime;
        let diff = actualPeriapsisTime - departureTimeUT;
        const diffDir = diff < 0 ? "early" : "late";
        diff = diff < 0 ? -diff : diff;
        options.push(<div key={i}>{KerbalDateInput.formateDate(roundedTo(minmusT, 6*3600))}
            {" + "}{to} * {KerbalYdhmsInput.formatValueSingleUnit(roundedTo(minmusKerbinOrbit.period, 3600))}
            {" + "}{KerbalYdhmsInput.formatValueSingleUnit(minmusKerbinTransferTime)}
            {" = "}{KerbalDateInput.formateDate(actualPeriapsisTime)}
            {" "}({KerbalYdhmsInput.formatValueSingleUnit(diff)} {diffDir})
        </div>);

        minmusT -= kspOrbits.Minmus.period;
        if(minmusT < 0) break;
    }

    return <div>
        <h2>Interplanetary departure from Minmus</h2>
        <table><tbody>
        <tr><td>Parking orbit:</td><td>
            <Apside value={parkingSma}
                    onChange={v => setParkingSma(v)}
                    primaryBody={kspBodies.Kerbin}
            />, {parkingSpeed.toFixed(1)} m/s
        </td></tr>
        <tr><td>Departure date:</td><td>
            <KerbalDateInput value={departureTimeUT}
                              onChange={v => setDepartureTimeUT(v)}
            />
        </td></tr>
        <tr><td>Ejection angle:</td><td>
            <FloatInput value={ejectionAngle/Math.PI*180} decimals={1}
                        onChange={v => setEjectionAngle(v/180*Math.PI)}
            />º before periapsis</td></tr>
        <tr><td>Ejection burn:</td><td>
            <FloatInput value={ejectionBurn} decimals={1}
                        onChange={v => setEjectionBurn(v)}
            /> m/s
        </td></tr>
        </tbody></table>
        <h2>Maneuvers</h2>
        At departure, Kerbin has a TA={kerbinTaAtDeparture}rad.<br/>
        At departure, Kerbin is at {kerbinAngleAtDeparture}rad from the reference direction.<br/>
        Kerbin prograde is at {kerbinProgradeAngleAtDeparture}rad from ref.<br/>
        Departure burn at {kerbinDepartureBurnAngle}rad.<br/>
        Travel time from Minmus: {KerbalYdhmsInput.formatValueSingleUnit(minmusKerbinTransferTime)}.<br/>
        Apoapsis of elliptical Minmus-70k orbit at {minmusDepartureAngle}rad.<br/>
        Minmus TA there {minmusTa}rad.<br/>
        {options}
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
    };
}
