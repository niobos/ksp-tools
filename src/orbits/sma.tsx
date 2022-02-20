import * as React from 'react';
import {useState} from "react";
import {KerbalYdhmsInput, SiInput} from "../components/formatedInput";
import {default as kspOrbit} from "../utils/orbit";

interface SmaProps {
    value: number
    onChange?: (value: number) => void
    gravity?: number
}

export default function Sma(props: SmaProps) {
    const onChange = props.onChange || (() => null);
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
        <SiInput value={props.value}
                 onChange={sma => onChange(sma)}
        />m<span style={periodStyle}>{" => "}period of <KerbalYdhmsInput
            value={period}
            onFocus={() => setEditingPeriod(period)}
            onChange={p => onChange(kspOrbit.smaFromPeriod(props.gravity, p))}
            onBlur={() => setEditingPeriod(null)}
        /></span>
    </span>;
}