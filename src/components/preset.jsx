import React from "react";

function normalizeProps(props) {
    const defaultProps = {
        // value:   // mutually exclusive with option
        // option:  // mutually exclusive with value
        onChange: (value, optionName) => null,
        options: {},  // {"visible name": value, "group name": {"nested name": 42}}
        customName: "custom",  // name for the custom option
        customValue: "",  // value for the "custom" option, should be unique
    };

    return Object.assign({}, defaultProps, props);
}

export default function Preset(props) {
    props = normalizeProps(props);

    const option_els = [];
    const flattened_options = {};
    for(const option in props.options) {
        if(typeof props.options[option] === "object") {
            const suboptions = [];
            for(const suboption in props.options[option]) {
                const value = '' + options[option][suboption];
                suboptions.push(<option key={suboption} value={value}>{suboption}</option>)
                flattened_options[suboption] = value;
            }
            option_els.push(<optgroup key={option} label={option}>{suboptions}</optgroup>)
        } else {
            const value = '' + props.options[option];
            option_els.push(<option key={option} value={value}>{option}</option>)
            flattened_options[option] = value;
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