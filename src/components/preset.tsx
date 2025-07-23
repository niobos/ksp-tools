import * as React from "react";

interface PresetProps {
    option?: string  // selected name, mutually exclusive with value
    value?: any  // selected value, mutually exclusive with option
    onChange?: (value: string, optionName: string) => void
    options: object  // {"visible name": value, "group name": {"nested name": 42}}
    customName?: string  // name for the custom option
    customValue?: string  // value for the "custom" option, should be unique
}

export default function Preset(
    {
        option,
        value,
        onChange = () => null,
        options,
        customName = "custom",
        customValue = "",
    }: PresetProps
) {
    const option_els = [];
    const flattened_options = {};
    for(const opt in options) {
        if(typeof options[opt] === "object") {
            const suboptions = [];
            for(const suboption in options[opt]) {
                suboptions.push(<option key={suboption} value={options[opt][suboption]}>{suboption}</option>)
                flattened_options[suboption] = options[opt][suboption];
            }
            option_els.push(<optgroup key={opt} label={opt}>{suboptions}</optgroup>)
        } else {
            flattened_options[opt] = options[opt];
            option_els.push(<option key={opt} value={options[opt]}>{opt}</option>)
        }
    }

    let defaultValue = customValue;
    if(option !== undefined) {
        if(option in flattened_options) {
            defaultValue = flattened_options[option];
        }
    } else if(value !== undefined) {
        if(Object.values(flattened_options).includes(value)) {
            defaultValue = value;
        }
    }

    return <select
        value={defaultValue}
        onChange={(e) => onChange(
            e.target.value, e.target.selectedOptions[0].innerText
        )}
    >
        <option disabled value={customValue}>{customName}</option>
        {option_els}
    </select>;
}
