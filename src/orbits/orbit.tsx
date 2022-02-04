import React, {useState} from "react";  // JSX
import {SiInput, FloatInput, KerbalYdhmsInput} from "../components/formatedInput";
import Apside from "./apside";
import Body from "../utils/kspBody";
import {default as kspOrbit, orbits as kspOrbits} from "../utils/kspOrbit";
import Vector from "../utils/vector";
import Sma from "./sma";

interface OrbitProps {
    value: kspOrbit
    onChange?: (value: kspOrbit) => void
    primaryBody?: Body
}

export function fromString(s: string): kspOrbit {
    if(s === "" || s === undefined) return kspOrbit.create({
        sma: 800_000,
        e: 0.125,
    });
    const o = JSON.parse(s);
    if(typeof o === 'string') return kspOrbits[o];
    return kspOrbit.create(o);
}

export function toString(o: kspOrbit | string): string {
    return JSON.stringify(o);
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
    const {orbit: newOrbit, ta} = kspOrbit.FromStateVector(
        new Vector(distance, 0, 0),
        new Vector(0, speed, 0),
        orbit.gravity,
    );
    const newApsideNr = (Math.abs(ta) < 0.01) ? 1 : 2;  // == 0 with rounding error
    const periapsis = newOrbit.distance_at_periapsis;
    const apoapsis = newOrbit.distance_at_apoapsis;
    const periapsisSpeed = newOrbit.speed_at_ta(0);
    const apoapsisSpeed = newOrbit.speed_at_ta(Math.PI);

    onChange(orbit.copy(kspOrbit.sma_e_from_apsides(periapsis, apoapsis)));
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
    const onChange = props.onChange || (() => null);
    const [editingApside, setEditingApside]: [editingApsideType, (editingApsideType) => void] = useState(null);

    let value = props.value;
    if(typeof value === 'string') {
        value = kspOrbits[value];
    }
    value = value.copy({
        gravity: props.primaryBody !== undefined ? props.primaryBody.gravity : null,
    });

    let apsis1 = value.distance_at_periapsis;
    let apsis2 = value.distance_at_apoapsis;
    let apsis1Speed = value.speed_at_ta(0);
    let apsis2Speed = value.speed_at_ta(Math.PI);
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
        <Sma value={value.sma}
             onChange={sma => onChange(value.copy({sma}))}
             gravity={value.gravity}
        />
    </td></tr>
    <tr><td>Eccentricity</td><td>
        <FloatInput value={value.e}
                    onChange={e => onChange(value.copy({e}))}
        />
    </td></tr>
    <tr><td>Periapsis</td><td>
        <Apside value={apsis1}
                onFocus={() => setEditingApside([
                    {distance: apsis1},
                    {distance: apsis2},
                ])}
                onChange={r => {
                    onChange(value.copy(
                        kspOrbit.sma_e_from_apsides(r, apsis2),
                    ));
                    if(editingApside != null) editingApside[0].distance = r;
                }}
                onBlur={() => setEditingApside(null)}
                primaryBody={props.primaryBody}
        /><span style={speedStyle}>, speed <FloatInput
            decimals={1}
            value={apsis1Speed}
            onFocus={() => setEditingApside([
                {distance: apsis1, speed: apsis1Speed},
                {distance: apsis2, speed: apsis2Speed},
            ])}
            onChange={s => fromApsideSpeed(1, apsis1, s, value, onChange, editingApside, setEditingApside)}
            onBlur={() => setEditingApside(null)}
        />m/s</span>
    </td></tr>
    <tr><td>Apoapsis</td><td>
        <Apside value={apsis2}
                onFocus={() => setEditingApside([
                    {distance: apsis1},
                    {distance: apsis2},
                ])}
                onChange={r => {
                    onChange(value.copy(
                        kspOrbit.sma_e_from_apsides(apsis1, r),
                    ));
                    if(editingApside != null) editingApside[1].distance = r;
                }}
                onBlur={() => setEditingApside(null)}
                primaryBody={props.primaryBody}
        /><span style={speedStyle}>, speed <FloatInput
            decimals={1}
            value={apsis2Speed}
            onFocus={() => setEditingApside([
                {distance: apsis1, speed: apsis1Speed},
                {distance: apsis2, speed: apsis2Speed},
            ])}
            onChange={s => fromApsideSpeed(2, apsis2, s, value, onChange, editingApside, setEditingApside)}
            onBlur={() => setEditingApside(null)}
    />m/s</span>
    </td></tr>
    </tbody></table>;
}