import * as React from 'react';  // JSX
import {useState} from "react";
import {FloatInput} from 'formattedInput';
import {DegreesInput} from "./formattedInput";
import Apside from "./apside";
import Body from "../utils/kspBody";
import {orbits as kspOrbits} from "../utils/kspOrbit";
import {default as kspOrbit} from "../utils/orbit";
import Vector from "../utils/vector";
import Sma from "./sma";

interface OrbitProps {
    value: kspOrbit
    onChange?: (value: kspOrbit) => void
    primaryBody?: Body
}

export function fromString(s: string, defaultOrbit?: kspOrbit, gravity: number = 1): kspOrbit {
    if(s === "" || s == null) {
        if(defaultOrbit == null) {
            defaultOrbit = kspOrbit.FromOrbitalElements(gravity,
                {sma: 800_000, e: 0.125},
            );
        }
        return defaultOrbit;
    }
    const o = JSON.parse(s);
    if(typeof o === 'string') return kspOrbits[o];
    return kspOrbit.FromOrbitalElements(gravity,
        {sma: o.sma, e: o.e, argp: o.argp, inc: o.inc, lon_an: o.lon_an},
        {ma0: o.ma0}
    );
}

export function toString(o: kspOrbit | string): string {
    if(typeof o === "string") return JSON.stringify(o);
    return JSON.stringify({
        sma: o.semiMajorAxis,
        e: o.eccentricity,
        argp: o.argumentOfPeriapsis,
        inc: o.inclination,
        lon_an: o.longitudeAscendingNode,
        ma0: o.meanAnomalyAtEpoch,
    });
}

type editingApsideType = null | [{altitude: number, speed: number}, {altitude: number, speed: number}];

function updateFromApsides(oldOrbit: kspOrbit, apside1: number, apside2: number): {
    orbit: kspOrbit,
    edit: editingApsideType,
} {
    const {sma, e} = kspOrbit.smaEFromApsides(apside1, apside2);
    const newOrbit = kspOrbit.FromOrbitWithUpdatedOrbitalElements(oldOrbit, {sma, e});
    const speedPeriapsis = newOrbit.speedAtTa(0);
    const speedApoapsis = newOrbit.speedAtTa(Math.PI);
    return {
        orbit: newOrbit,
        edit: [
            {altitude: apside1, speed: apside1 < apside2 ? speedPeriapsis : speedApoapsis},
            {altitude: apside2, speed: apside2 < apside2 ? speedPeriapsis : speedApoapsis},
        ],
    };
}

function updateFromApsideSpeed(oldOrbit: kspOrbit, apsideNum: 1 | 2, altitude: number, speed: number): {
    orbit: kspOrbit,
    edit: editingApsideType,
} {
    let newOrbit, ta;

    if(altitude === Infinity) {  // Parabolic
        throw "Parabolic not implemented yet"

    } else if(altitude > 0) {  // Elliptic
        const tempOrbit = kspOrbit.FromStateVector(
            oldOrbit.gravity,
            new Vector(altitude, 0, 0),
            new Vector(0, speed, 0),
        );
        newOrbit = kspOrbit.FromOrbitWithUpdatedOrbitalElements(
            oldOrbit,
            {sma: tempOrbit.semiMajorAxis, e: tempOrbit.eccentricity},
        );
        ta = tempOrbit.taAtT(0);

    } else {  // Hyperbolic
        const {sma, e} = kspOrbit.semiMajorAxisEFromPeriapsisHyperbolicExcessVelocity(
            oldOrbit.gravity,
            oldOrbit.distanceAtPeriapsis,
            speed,
        );
        newOrbit = kspOrbit.FromOrbitWithUpdatedOrbitalElements(
            oldOrbit,
            {sma, e},
        );
        ta = Math.PI;  // anything non-zero. should probably be the ejection angle

    }

    let otherAltitude, otherSpeed;
    if (Math.abs(ta) < 0.01) {  // === 0 with rounding
        // altitude & speed are periapsis
        otherAltitude = newOrbit.distanceAtApoapsis;
        otherSpeed = otherAltitude > 0 ? newOrbit.speedAtTa(Math.PI) : newOrbit.hyperbolicExcessVelocity;
    } else {
        // altitude & speed are apoapsis
        otherAltitude = newOrbit.distanceAtPeriapsis;
        otherSpeed = newOrbit.speedAtTa(0);
    }

    let edit: editingApsideType;
    if(apsideNum === 1) {
        edit = [
            {altitude, speed},
            {altitude: otherAltitude, speed: otherSpeed},
        ];
    } else { // apsideNum === 2
        edit = [
            {altitude: otherAltitude, speed: otherSpeed},
            {altitude, speed},
        ];
    }

    return {
        orbit: newOrbit,
        edit,
    }
}

export default function Orbit(props: OrbitProps) {
    const [editingApside, setEditingApside]: [editingApsideType, (editingApsideType) => void] = useState(null);

    let value = props.value;
    if(typeof value === 'string') {
        value = kspOrbits[value];
    }
    value = kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {
        gravity: props.primaryBody !== undefined ? props.primaryBody.gravity : null,
    });

    let apsis1altitude = value.distanceAtPeriapsis;
    let apsis1speed = value.speedAtTa(0);
    let apsis2altitude = value.distanceAtApoapsis;
    let apsis2speed = apsis2altitude > 0 ? value.speedAtTa(Math.PI) : value.hyperbolicExcessVelocity;
    if(editingApside !== null) {
        apsis1altitude = editingApside[0].altitude;
        apsis1speed = editingApside[0].speed;
        apsis2altitude = editingApside[1].altitude;
        apsis2speed = editingApside[1].speed;
    }

    return <table><tbody>
    <tr><td>Semi-major axis</td><td>
        <Sma value={value.semiMajorAxis}
             onChange={props.onChange != null ? sma => props.onChange(kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {sma})) : null}
             gravity={value.gravity}
             readOnly={props.onChange == null}
        />
    </td></tr>
    <tr><td>Eccentricity</td><td>
        <FloatInput value={value.eccentricity}
                    onChange={props.onChange != null ? e => props.onChange(kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {e})) : null}
                    readOnly={props.onChange == null}
        />
    </td></tr>
    <tr><td>Periapsis</td><td>
        <Apside
            altitude={apsis1altitude}
            primaryBody={props.primaryBody}
            speed={apsis1speed}
            onFocus={() => setEditingApside([
                {altitude: apsis1altitude, speed: apsis1speed},
                {altitude: apsis2altitude, speed: apsis2speed},
            ])}
            onBlur={() => setEditingApside(null)}
            onAltitudeChange={r => {
                const {orbit, edit} = updateFromApsides(value, r, apsis2altitude);
                if(props.onChange != null) props.onChange(orbit);
                setEditingApside(edit);
            }}
            onSpeedChange={v => {
                const {orbit, edit} = updateFromApsideSpeed(value, 1, apsis1altitude, v);
                if(props.onChange != null) props.onChange(orbit);
                setEditingApside(edit);
            }}
            readOnly={props.onChange == null}
        />
    </td></tr>
    <tr><td>Apoapsis</td><td>
        <Apside
            altitude={apsis2altitude}
            primaryBody={props.primaryBody}
            speed={apsis2speed}
            onFocus={() => setEditingApside([
                {altitude: apsis1altitude, speed: apsis1speed},
                {altitude: apsis2altitude, speed: apsis2speed},
            ])}
            onBlur={() => setEditingApside(null)}
            onAltitudeChange={r => {
                const {orbit, edit} = updateFromApsides(value, apsis1altitude, r);
                if(props.onChange != null) props.onChange(orbit);
                setEditingApside(edit);
            }}
            onSpeedChange={v => {
                const {orbit, edit} = updateFromApsideSpeed(value, 2, apsis2altitude, v);
                if(props.onChange != null) props.onChange(orbit);
                setEditingApside(edit);
            }}
            readOnly={props.onChange == null}
        />
    </td></tr>
    <tr><td>Argument of Periapsis</td><td>
        <DegreesInput value={value.argumentOfPeriapsis}
                      onChange={props.onChange != null ? argp => props.onChange(kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {argp})) : null}
                      readOnly={props.onChange == null}
        />º
    </td></tr>
    <tr><td>Inclination</td><td>
        <DegreesInput
            value={value.inclination}
            onChange={props.onChange != null ? inc => props.onChange(kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {inc})) : null}
            onBlur={() => {
                if(value.inclination > Math.PI) {
                    // Correct inclination to be <=180º by swapping ascending & descending node
                    // Note: since argp is measured from the AN, we need to correct that as well
                    props.onChange(kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {
                        inc: 2*Math.PI - value.inclination,
                        lon_an: value.longitudeAscendingNode < Math.PI ? value.longitudeAscendingNode + Math.PI : value.longitudeAscendingNode - Math.PI,
                        argp: value.argumentOfPeriapsis < Math.PI ? value.argumentOfPeriapsis + Math.PI : value.argumentOfPeriapsis - Math.PI,
                    }))
                }
            }}
            readOnly={props.onChange == null}
        />º
    </td></tr>
    <tr><td>Longitude of Ascending Node</td><td>
        <DegreesInput value={value.longitudeAscendingNode}
                      onChange={props.onChange != null ? lon_an => props.onChange(kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {lon_an})) : null}
                      readOnly={props.onChange == null}
        />º
    </td></tr>
    <tr><td>Mean anomaly at epoch</td><td>
        <DegreesInput value={value.meanAnomalyAtEpoch}
                      placeholder={"any"} emptyValue={null}
                      onChange={props.onChange != null ? ma0 => props.onChange(kspOrbit.FromOrbitWithUpdatedOrbitalElements(value, {ma0})) : null}
                      readOnly={props.onChange == null}
        />º
    </td></tr>
    </tbody></table>;
}