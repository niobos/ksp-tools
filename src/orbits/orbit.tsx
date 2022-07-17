import * as React from 'react';  // JSX
import {useState} from "react";
import {FloatInput} from 'formattedInput';
import {DegreesInput} from "../components/formattedInput";
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

export function fromString(s: string): kspOrbit {
    if(s === "" || s === undefined) return kspOrbit.FromOrbitalElements(1,
        {sma: 800_000, e: 0.125},
    );
    const o = JSON.parse(s);
    if(typeof o === 'string') return kspOrbits[o];
    return kspOrbit.FromOrbitalElements(1,
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

function changeOrbitKepler(o: kspOrbit, changes: object) {
    let gravity = o.gravity;
    if('gravity' in changes) gravity = changes['gravity'];
    const elements = {
        sma: o.semiMajorAxis,
        e: o.eccentricity,
        argp: o.argumentOfPeriapsis,
        inc: o.inclination,
        lon_an: o.longitudeAscendingNode,
    };
    const phase = {
        ma0: o.meanAnomalyAtEpoch,
    }
    return kspOrbit.FromOrbitalElements(gravity,
        Object.assign({}, elements, changes),
        Object.assign({}, phase, changes),
    );
}

type editingApsideType = null | [{distance: number, speed?: number}, {distance: number, speed?: number}];

function fromApsideSpeed(
    apsideNr: number,
    distance: number,
    speed: number,
    orbit: kspOrbit,
    onChange: (orbit: kspOrbit) => void,
    editingApside: editingApsideType,
    setEditingApside: (editingApsideType) => void,
): void {
    const newOrbit = kspOrbit.FromStateVector(
        orbit.gravity,
        new Vector(distance, 0, 0),
        new Vector(0, speed, 0),
    );
    const ta = newOrbit.taAtT(0);
    const newApsideNr = (Math.abs(ta) < 0.01) ? 1 : 2;  // == 0 with rounding error
    const periapsis = newOrbit.distanceAtPeriapsis;
    const apoapsis = newOrbit.distanceAtApoapsis;
    const periapsisSpeed = newOrbit.speedAtTa(0);
    const apoapsisSpeed = newOrbit.speedAtTa(Math.PI);

    onChange(changeOrbitKepler(orbit, kspOrbit.smaEFromApsides(periapsis, apoapsis)));
    if(editingApside != null) {
        if (apsideNr == 1 && newApsideNr == 1) {
            setEditingApside([
                {distance: periapsis, speed: speed},
                {distance: apoapsis, speed: apoapsisSpeed},
            ])
        } else if (apsideNr == 1 && newApsideNr == 2) {
            setEditingApside([
                {distance: apoapsis, speed: speed},
                {distance: periapsis, speed: periapsisSpeed},
            ])
        } else if (apsideNr == 2 && newApsideNr == 1) {
            setEditingApside([
                {distance: apoapsis, speed: apoapsisSpeed},
                {distance: periapsis, speed: speed},
            ])
        } else if (apsideNr == 2 && newApsideNr == 2) {
            setEditingApside([
                {distance: periapsis, speed: periapsisSpeed},
                {distance: apoapsis, speed: speed},
            ])
        }
    }
}

export default function Orbit(props: OrbitProps) {
    const [editingApside, setEditingApside]: [editingApsideType, (editingApsideType) => void] = useState(null);

    let value = props.value;
    if(typeof value === 'string') {
        value = kspOrbits[value];
    }
    value = changeOrbitKepler(value, {
        gravity: props.primaryBody !== undefined ? props.primaryBody.gravity : null,
    });

    let apsis1 = value.distanceAtPeriapsis;
    let apsis2 = value.distanceAtApoapsis;
    let apsis1Speed = value.speedAtTa(0);
    let apsis2Speed = value.speedAtTa(Math.PI);
    if(editingApside !== null) {
        apsis1 = editingApside[0].distance;
        apsis2 = editingApside[1].distance;
        if(editingApside[0].speed != null) apsis1Speed = editingApside[0].speed;
        if(editingApside[1].speed != null) apsis2Speed = editingApside[1].speed;
    }

    let speedStyle: object = {visibility: 'hidden'};
    if(value.gravity != null) {
        speedStyle = {};
    }

    return <table><tbody>
    <tr><td>Semi-major axis</td><td>
        <Sma value={value.semiMajorAxis}
             onChange={props.onChange != null ? sma => props.onChange(changeOrbitKepler(value, {sma})) : null}
             gravity={value.gravity}
        />
    </td></tr>
    <tr><td>Eccentricity</td><td>
        <FloatInput value={value.eccentricity}
                    onChange={props.onChange != null ? e => props.onChange(changeOrbitKepler(value, {e})) : null}
        />
    </td></tr>
    <tr><td>Periapsis</td><td>
        <Apside value={apsis1}
                onFocus={() => setEditingApside([
                    {distance: apsis1},
                    {distance: apsis2},
                ])}
                onChange={props.onChange != null ? r => {
                    props.onChange(changeOrbitKepler(value,
                        kspOrbit.smaEFromApsides(r, apsis2),
                    ));
                    if(editingApside != null) editingApside[0].distance = r;
                } : null}
                onBlur={() => setEditingApside(null)}
                primaryBody={props.primaryBody}
        /><span style={speedStyle}>, speed <FloatInput
            decimals={1}
            value={apsis1Speed}
            onFocus={() => setEditingApside([
                {distance: apsis1, speed: apsis1Speed},
                {distance: apsis2, speed: apsis2Speed},
            ])}
            onChange={props.onChange != null ? s => fromApsideSpeed(1, apsis1, s, value, props.onChange, editingApside, setEditingApside) : null}
            onBlur={() => setEditingApside(null)}
        />m/s</span>
    </td></tr>
    <tr><td>Apoapsis</td><td>
        <Apside value={apsis2}
                onFocus={() => setEditingApside([
                    {distance: apsis1},
                    {distance: apsis2},
                ])}
                onChange={props.onChange != null ? r => {
                    props.onChange(changeOrbitKepler(value,
                        kspOrbit.smaEFromApsides(apsis1, r),
                    ));
                    if(editingApside != null) editingApside[1].distance = r;
                } : null}
                onBlur={() => setEditingApside(null)}
                primaryBody={props.primaryBody}
        /><span style={speedStyle}>, speed <FloatInput
            decimals={1}
            value={apsis2Speed}
            onFocus={() => setEditingApside([
                {distance: apsis1, speed: apsis1Speed},
                {distance: apsis2, speed: apsis2Speed},
            ])}
            onChange={props.onChange != null ? s => fromApsideSpeed(2, apsis2, s, value, props.onChange, editingApside, setEditingApside) : null}
            onBlur={() => setEditingApside(null)}
    />m/s</span>
    </td></tr>
    <tr><td>Argument of Periapsis</td><td>
        <DegreesInput value={value.argumentOfPeriapsis}
                      onChange={props.onChange != null ? argp => props.onChange(changeOrbitKepler(value, {argp})) : null}
        />º
    </td></tr>
    <tr><td>Inclination</td><td>
        <DegreesInput
            value={value.inclination}
            onChange={props.onChange != null ? inc => props.onChange(changeOrbitKepler(value, {inc})) : null}
            onBlur={() => {
                if(value.inclination > Math.PI) {
                    // Correct inclination to be <=180º by swapping ascending & descending node
                    // Note: since argp is measured from the AN, we need to correct that as well
                    props.onChange(changeOrbitKepler(value, {
                        inc: 2*Math.PI - value.inclination,
                        lon_an: value.longitudeAscendingNode < Math.PI ? value.longitudeAscendingNode + Math.PI : value.longitudeAscendingNode - Math.PI,
                        argp: value.argumentOfPeriapsis < Math.PI ? value.argumentOfPeriapsis + Math.PI : value.argumentOfPeriapsis - Math.PI,
                    }))
                }
            }}
        />º
    </td></tr>
    <tr><td>Longitude of Ascending Node</td><td>
        <DegreesInput value={value.longitudeAscendingNode}
                      onChange={props.onChange != null ? lon_an => props.onChange(changeOrbitKepler(value, {lon_an})) : null}
        />º
    </td></tr>
    <tr><td>Mean anomaly at epoch</td><td>
        <DegreesInput value={value.meanAnomalyAtEpoch}
                      placeholder={"any"} emptyValue={null}
                      onChange={props.onChange != null ? ma0 => props.onChange(changeOrbitKepler(value, {ma0})) : null}
        />º
    </td></tr>
    </tbody></table>;
}