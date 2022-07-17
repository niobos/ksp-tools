import * as React from "react";
import {formatValueSi, SiInput} from "formattedInput";
import Vector from "../utils/vector";

export interface BurnDetailsProps {
    value: Vector
    onChange: (Vector) => void
}

export default function BurnDetails(props: BurnDetailsProps) {
    return <>
        Burn:
        <table><tbody>
            <tr><td>Prograde</td><td><SiInput
                value={props.value.x}
                onChange={v => props.onChange(new Vector(v, props.value.y, props.value.z))}
            />m/s</td></tr>
            <tr><td>Radial-in</td><td><SiInput
                value={props.value.y}
                onChange={v => props.onChange(new Vector(props.value.x, v, props.value.z))}
            />m/s</td></tr>
            <tr><td>Normal</td><td><SiInput
                value={props.value.z}
                onChange={v => props.onChange(new Vector(props.value.x, props.value.y, v))}
            />m/s</td></tr>
            <tr><td>Total</td><td>{formatValueSi(props.value.norm)}m/s</td></tr>
        </tbody></table>
    </>;
}
