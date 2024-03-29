import * as React from "react";
import OrbitAround from "../utils/orbitAround";
import {formatValueSi} from "formattedInput";
import {formatValueYdhmsAbs} from "../components/formattedInput";

export interface OrbitSummaryProps {
    value: OrbitAround
}

export function OrbitSummary(props: OrbitSummaryProps) {
    if( props.value.orbit.distanceAtPeriapsis < props.value.body.radius + props.value.body.atmosphere) {
        return <>collision course with {props.value.body.name} (Pe=<span>
                {formatValueSi(props.value.orbit.distanceAtPeriapsis - props.value.body.radius)}mAGL
            </span>)
        </>;
    } else if (props.value.orbit.distanceAtApoapsis > 0 && props.value.orbit.distanceAtApoapsis < props.value.body.soi) {
        return <><span>
                {formatValueSi(props.value.orbit.distanceAtApoapsis - props.value.body.radius)}mAGL
            </span> ⨯ <span>
                {formatValueSi(props.value.orbit.distanceAtPeriapsis - props.value.body.radius)}mAGL
            </span>{' '}
            orbit around {props.value.body.name}
        </>;
    } else {
        return <>
            escape trajectory out of {props.value.body.name} with
            Pe={formatValueSi(props.value.orbit.distanceAtPeriapsis - props.value.body.radius)}mAGL
        </>;
    }
}