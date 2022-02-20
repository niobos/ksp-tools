import * as React from "react";  // for JSX
import {bodiesHier} from "../utils/kspBody";

interface KspHierBodyProps {
    value?: string
    customValue?: string
    onChange?: (bodyName: string) => void
}

export default function KspHierBody(props: KspHierBodyProps) {
    props = Object.assign({}, {  // default values
        value: "",
        onChange: (bodyName: string) => {},
    }, props)

    const options = [];
    let i = 0;

    if(props.customValue !== undefined && props.customValue !== null) {
        options.push(<option key={i++} value="" disabled>{props.customValue}</option>);
    }

    for(const system in bodiesHier) {
        if(bodiesHier[system] instanceof Array) {
            const system_bodies = [];
            for (const body of bodiesHier[system]) {
                system_bodies.push(<option key={i++} value={body}>{body}</option>);
            }
            options.push(<optgroup key={i++} label={system}>{system_bodies}</optgroup>);
        } else {
            const body = bodiesHier[system]
            options.push(<option key={i++} value={body}>{body}</option>);
        }
    }

    return <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
    >
        {options}
    </select>;
}
