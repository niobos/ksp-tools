import React, {useState} from "react";
import {KerbalYdhmsInput, SiInput} from "../components/formatedInput";
import {default as kspOrbit} from "../utils/kspOrbit";

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

    let period = kspOrbit.period_from_sma(props.value, props.gravity);
    if(editingPeriod != null) {
        period = editingPeriod;
    }

    return <span>
        <SiInput value={props.value}
                 onChange={sma => onChange(sma)}
        />m<span style={periodStyle}>{" => "}period of <KerbalYdhmsInput
            value={period}
            onFocus={() => setEditingPeriod(period)}
            onChange={p => onChange(kspOrbit.sma_from_period(p, props.gravity))}
            onBlur={() => setEditingPeriod(null)}
        /></span>
    </span>;
}