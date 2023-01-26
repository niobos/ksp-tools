import * as React from "react";  // JSX
import {SiInput} from 'formattedInput';
import Body, {bodies as kspBodies} from "../utils/kspBody";

interface PrimaryBodyProps {
    value: Body | string
    onChange?: (v: Body) => void
}

export function fromString(s: string): Body | string {
    if(s === undefined || s === null || s === "") return "Kerbin";
    const o = JSON.parse(s);
    if(typeof o === "string") return o;
    return Body.create({
        mass: o.m,
        radius: o.r,
        atmosphere: o.a,
        terrain: o.t,
        soi: o.s,
    });
}

export function toString(v: Body | string): string {
    if(typeof v === "string") return JSON.stringify(v);
    // else:
    return JSON.stringify({
        m: v.mass,
        r: v.radius,
        a: v.atmosphere,
        t: v.terrain,
        s: v.soi,
    });
}

export function resolve(value: Body | string): Body {
    if(typeof value === 'string') {
        return kspBodies[value];
    } // else:
    return value;
}

export default function PrimaryBody(props: PrimaryBodyProps) {
    const value = resolve(props.value);

    return <table><tbody>
    <tr><td>Gravity</td><td>
        <SiInput value={value.gravity}
                 emptyValue={null} placeholder="none"
                 onChange={g => props.onChange(value.copy({mass: Body.massFromGravity(g)}))}
        />m<sup>3</sup>/s<sup>2</sup>
    </td></tr>
    <tr><td>Body radius</td><td>
        <SiInput value={value.radius}
                 emptyValue={null} placeholder="none"
                 onChange={r => props.onChange(value.copy({radius: r}))}
        />m
    </td></tr>
    <tr><td>Atmosphere</td><td>
        <SiInput value={value.atmosphere}
                 emptyValue={null} placeholder="none"
                 onChange={a => props.onChange(value.copy({atmosphere: a}))}
        />m
    </td></tr>
    <tr><td>Terrain</td><td>
        <SiInput value={value.terrain}
                 emptyValue={null} placeholder="none"
                 onChange={a => props.onChange(value.copy({terrain: a}))}
        />m
    </td></tr>
    <tr><td>Sphere of Influence</td><td>
        <SiInput value={value.soi}
                 emptyValue={null} placeholder="none"
                 onChange={s => props.onChange(value.copy({soi: s}))}
        />m
    </td></tr>
    </tbody></table>;
}