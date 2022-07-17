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
            <tr><td>Prograde</td><td><SiInput value={props.value[0]}/>m/s</td></tr>
            <tr><td>Radial-in</td><td><SiInput value={props.value[1]}/>m/s</td></tr>
            <tr><td>Normal</td><td><SiInput value={props.value[2]}/>m/s</td></tr>
            <tr><td>Total</td><td>{formatValueSi(props.value.norm)}m/s</td></tr>
        </tbody></table>
    </>;
}
