import React from "react";

interface PresetProps {
    option?: string  // selected name, mutually exclusive with value
    value?: any  // selected value, mutually exclusive with option
    onChange?: (value: string, optionName: string) => void
    options: object  // {"visible name": value, "group name": {"nested name": 42}}
    customName?: string  // name for the custom option
    customValue?: string  // value for the "custom" option, should be unique
}

export default function Preset(props: PresetProps) {
    props = Object.assign({}, {  // default values
        onChange: (value: string, optionName: string) => null,
        customName: "custom",
        customValue: "",
    }, props);

    const option_els = [];
    const flattened_options = {};
    for(const option in props.options) {
        if(typeof props.options[option] === "object") {
            const suboptions = [];
            for(const suboption in props.options[option]) {
                suboptions.push(<option key={suboption} value={props.options[option][suboption]}>{suboption}</option>)
                flattened_options[suboption] = props.options[option][suboption];
            }
            option_els.push(<optgroup key={option} label={option}>{suboptions}</optgroup>)
        } else {
            flattened_options[option] = props.options[option];
            option_els.push(<option key={option} value={props.options[option]}>{option}</option>)
        }
    }

    let defaultValue = props.customValue;
    if(props.option !== undefined) {
        if(props.option in flattened_options) {
            defaultValue = flattened_options[props.option];
        }
    } else if(props.value !== undefined) {
        if(Object.values(flattened_options).includes(props.value)) {
            defaultValue = props.value;
        }
    }

    return <select
        value={defaultValue}
        onChange={(e) => props.onChange(
            e.target.value, e.target.selectedOptions[0].innerText
        )}
    >
        <option disabled value={props.customValue}>{props.customName}</option>
        {option_els}
    </select>;
}
