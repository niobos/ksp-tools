import * as React from 'react';
import {useState} from "react";
import {default as kspOrbit} from "../utils/orbit";
import {SiInput} from 'formattedInput';
import {KerbalYdhmsInput} from "../components/formattedInput";

interface SmaProps {
    value: number
    onChange?: (value: number) => void
    gravity?: number
}

export default function Sma(props: SmaProps) {
    const [editingPeriod, setEditingPeriod] = useState(null);

    let periodStyle: object = {visibility: 'hidden'};
    if(props.gravity != null) {
        periodStyle = {};
    }

    let period = kspOrbit.periodFromSma(props.gravity, props.value);
    if(editingPeriod != null) {
        period = editingPeriod;
    }

    return <span>
        <SiInput
            value={props.value}
            onChange={props.onChange != null ? props.onChange : null}
        />m<span style={periodStyle}>{" => "}period of <KerbalYdhmsInput
            value={period}
            onFocus={() => setEditingPeriod(period)}
            onChange={props.onChange != null ? p => props.onChange(kspOrbit.smaFromPeriod(props.gravity, p)) : null}
            onBlur={() => setEditingPeriod(null)}
        /></span>
    </span>;
}
