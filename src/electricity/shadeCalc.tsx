import * as React from "react";
import {useState} from "react";
import {arrayInsertElement, arrayRemoveElement, arrayReplaceElement} from "../utils/list";
import Orbit, {orbitalDarkness} from "../utils/orbit";
import {formatValueSi, SiInput} from "formattedInput";
import {formatValueYdhms, KerbalYdhmsInput} from "../components/formattedInput";
import {Body, KspSystem} from "../utils/kspSystems";
import {HierarchicalBodySelect} from "../components/kspSystemSelect";

type Shade = {
    d: number,
    i: number,
} | {
    o: string,
    a: number,
} | {
    s: string,
}
type ValueType = Shade[]
type DurationDuty = {
    duration: number,
    duty: number,
    interval?: number,
}
type DurationInterval = {
    duration: number,
    interval: number,
    duty?: number,
}

export function fromString(s: string): ValueType {
    const defaultValue = [{'o': 'Kerbin', 'a': 100000}];
    if (s === null || s === undefined) return defaultValue;
    try {
        return JSON.parse(s);
    } catch (e) {
        return defaultValue;
    }
}

export function toString(v: ValueType): string {
    return JSON.stringify(v);
}

function calcOrbitalDarkness(body: Body, altitude: number): DurationDuty {
    if(body == null) return {duration: 0, duty: 0, interval: 0}
    const duration = orbitalDarkness(body.gravity, body.radius, altitude);
    const interval = Orbit.periodFromSma(body.gravity, body.radius + altitude);
    const duty = duration / interval;
    return {duration, duty, interval};
}

function calcSolarNight(body: Body): DurationDuty {
    if(body == null) return {duration: 0, duty: 0, interval: 0}
    const interval = body.solarDay;
    const duration = body.solarDay / 2;
    const duty = 0.5;
    return {duration, duty, interval};
}

export function calcShade(system: KspSystem, shades: ValueType): DurationInterval {
    let maxDuration = 0;
    let maxDuty = 0;
    for (let shade of shades) {
        let duration, duty;
        if ('o' in shade) {  // orbital darkness
            ({duration, duty} = calcOrbitalDarkness(system.bodies[shade.o], shade.a));
        } else if ('s' in shade) {  // solar night
            ({duration, duty} = calcSolarNight(system.bodies[shade.s]));
        } else if ('d' in shade) {  // custom
            duration = shade.d;
            duty = shade.d === 0 ? 0 : shade.d / shade.i;
        }
        if (duration > maxDuration) maxDuration = duration;
        if (duty > maxDuty) maxDuty = duty;
    }
    return {duration: maxDuration, interval: maxDuty > 0 ? maxDuration / maxDuty : Infinity};
}

export function custom(duration: number, interval: number): ValueType {
    return [{'d': duration, 'i': interval}];
}

export interface ShadeCalcProps {
    system: KspSystem
    value: ValueType
    onChange: (v: ValueType) => void
}

export function ShadeCalc(props: ShadeCalcProps) {
    const system = props.system
    const [selectedSolarNight, setSelectedSolarNight] = useState(system.defaultBodyName);
    const [selectedOrbitalDarknessBody, setSelectedOrbitalDarknessBody] = useState(system.defaultBodyName);
    const [orbitalDarknessAlt, setOrbitalDarknessAlt] = useState(100_000);

    const shades = [];
    for (let i = 0; i < props.value.length; i++) {
        const shade = props.value[i];
        let shadeJsx;
        if ('o' in shade) {  // orbital darkness
            const body = system.bodies[shade.o]
            if(body == null) continue
            const {duration, interval} = calcOrbitalDarkness(body, shade.a);
            shadeJsx = <span>Orbital darkness
                at {formatValueSi(shade.a)}mAGL
                above {shade.o} (
                {formatValueYdhms(duration, 1)}{" "}
                every {formatValueYdhms(interval, 1)})
            </span>;
        } else if ('s' in shade) {  // solar night
            const body = system.bodies[shade.s]
            if(body == null) continue
            const {duration, interval} = calcSolarNight(body);
            shadeJsx = <span>Solar night on {shade.s} (
                {formatValueYdhms(duration, 1)}{" "}
                every {formatValueYdhms(interval, 1)})</span>;
        } else if ('d' in shade) {  // custom
            shadeJsx = <span>
                <KerbalYdhmsInput
                    value={shade.d} maxUnits={1}
                    onChange={v => props.onChange(arrayReplaceElement(props.value, i,
                        {d: v, i: shade.i}))}
                /> every <KerbalYdhmsInput
                value={shade.i} maxUnits={1}
                onChange={v => props.onChange(arrayReplaceElement(props.value, i,
                    {d: shade.d, i: v}))}
            />
            </span>;
        } else {
            console.error(shade);
        }
        shades.push(<div key={i}>
            <input type="button" value="-"
                   onClick={() => props.onChange(arrayRemoveElement(props.value, i))}
            />{" "}{shadeJsx}</div>);
    }

    return <div>
        Calculate shade from worst of:<br/>
        {shades}
        <input type="button" value="Add solar night on"
               onClick={() => props.onChange(arrayInsertElement(props.value,
                   {'s': selectedSolarNight}))}
        /><HierarchicalBodySelect system={system} value={selectedSolarNight}
                       onChange={v => setSelectedSolarNight(v)}
    /><br/>
        <input type="button" value="Add orbital darkness at"
               onClick={() => props.onChange(arrayInsertElement(props.value,
                   {
                       'o': selectedOrbitalDarknessBody,
                       'a': orbitalDarknessAlt,
                   }))}
        /><SiInput
        value={orbitalDarknessAlt}
        onChange={v => setOrbitalDarknessAlt(v)}
    />mAGL above <HierarchicalBodySelect system={system}
        value={selectedOrbitalDarknessBody}
        onChange={v => setSelectedOrbitalDarknessBody(v)}
    /><br/>
        <input type="button" value="Add custom shade"
               onClick={() => props.onChange(arrayInsertElement(props.value, {
                   'd': 5 * 60,
                   'i': 6 * 60 * 60,
               }))}
        />
    </div>;
}
