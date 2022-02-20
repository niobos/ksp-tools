import * as React from "react";
import {useState} from "react";
import AdjustableList, {arrayInsertElement, arrayRemoveElement, arrayReplaceElement} from "../utils/list";
import Orbit, {orbitalDarkness} from "../utils/orbit";
import Body, {bodies} from "../utils/kspBody";
import {KerbalYdhmsInput, SiInput} from "../components/formatedInput";
import KspHierBody from "../components/kspHierBody";

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
}
type DurationInterval = {
    duration: number,
    interval: number,
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
    const duration = orbitalDarkness(body.gravity, body.radius, altitude);
    const duty = duration / Orbit.periodFromSma(body.gravity, body.radius + altitude);
    return {duration, duty};
}

function calcSolarNight(body: Body): DurationDuty {
    const duration = body.solarDay / 2;
    const duty = 0.5;
    return {duration, duty};
}

export function calcShade(shades: ValueType): DurationInterval {
    let maxDuration = 0;
    let maxDuty = 0;
    for (let shade of shades) {
        let duration, duty;
        if ('o' in shade) {  // orbital darkness
            ({duration, duty} = calcOrbitalDarkness(bodies[shade.o], shade.a));
        } else if ('s' in shade) {  // solar night
            ({duration, duty} = calcSolarNight(bodies[shade.s]));
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
    value: ValueType
    onChange: (v: ValueType) => void
}

export function ShadeCalc(props) {
    const [selectedSolarNight, setSelectedSolarNight] = useState('Kerbin');
    const [selectedOrbitalDarknessBody, setSelectedOrbitalDarknessBody] = useState('Kerbin');
    const [orbitalDarknessAlt, setOrbitalDarknessAlt] = useState(100_000);

    const shades = [];
    for (let i = 0; i < props.value.length; i++) {
        const shade = props.value[i];
        let shadeJsx;
        if ('o' in shade) {  // orbital darkness
            const body = bodies[shade.o];
            const {duration} = calcOrbitalDarkness(body, shade.a);
            shadeJsx = <span>Orbital darkness
                at {SiInput.format(shade.a)}mAGL
                above {shade.o} ({KerbalYdhmsInput.formatValueSingleUnit(duration)})
            </span>;
        } else if ('s' in shade) {  // solar night
            const body = bodies[shade.s];
            const {duration} = calcSolarNight(body);
            shadeJsx = <span>Solar night on {shade.s} ({KerbalYdhmsInput.formatValueSingleUnit(duration)})</span>;
        } else if ('d' in shade) {  // custom
            shadeJsx = <span>
                <KerbalYdhmsInput
                    value={shade.d} singleUnit={true}
                    onChange={v => props.onChange(arrayReplaceElement(props.value, i,
                        {d: v, i: shade.i}))}
                /> every <KerbalYdhmsInput
                value={shade.i} singleUnit={true}
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
        /><KspHierBody value={selectedSolarNight}
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
    />mAGL above <KspHierBody
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
