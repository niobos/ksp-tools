import * as React from 'react';
import {useState} from "react";
import {default as kspOrbit} from "../utils/orbit";
import {SiInput} from 'formattedInput';
import {KerbalYdhmsInput} from "./formattedInput";

interface SmaProps {
    value: number
    onChange?: (value: number) => void
    readOnly?: boolean
    gravity?: number
}

export default function Sma(props: SmaProps) {
    const [editingPeriod, setEditingPeriod] = useState(null);

    let period = kspOrbit.periodFromSma(props.gravity, props.value);
    if(editingPeriod != null) {
        period = editingPeriod;
    }

    return <>
        <SiInput
            value={props.value}
            onChange={props.onChange != null ? props.onChange : null}
            readOnly={props.readOnly}
        />m{props.gravity != null ?
            <>{" => "}period of <KerbalYdhmsInput
                value={period}
                onFocus={() => setEditingPeriod(period)}
                onChange={props.onChange != null ? p => props.onChange(kspOrbit.smaFromPeriod(props.gravity, p)) : null}
                onBlur={() => setEditingPeriod(null)}
                readOnly={props.onChange == null}
            /></>
            : null
        }
    </>;
}
