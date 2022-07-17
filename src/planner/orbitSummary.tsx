import * as React from "react";
import OrbitAround from "../utils/orbitAround";
import {formatValueSi} from "formattedInput";
import {formatValueYdhmsAbs} from "../components/formattedInput";

export interface OrbitSummaryProps {
    t: number
    value: OrbitAround
}

export function OrbitSummary(props: OrbitSummaryProps) {
    if (props.value.orbit.energy < 0) {
        return <>t={formatValueYdhmsAbs(props.t)}{" "}
            <span>
                {formatValueSi(props.value.orbit.distanceAtApoapsis - props.value.body.radius)}mAGL
            </span> ⨯ <span>
                {formatValueSi(props.value.orbit.distanceAtPeriapsis - props.value.body.radius)}mAGL
            </span>{' '}
            orbit around {props.value.body.name}
        </>;
    } else {
        return <>
            Escape trajectory out of {props.value.body.name}
        </>;
    }
}