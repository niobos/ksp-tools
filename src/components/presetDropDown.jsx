import React from "react";

export default function PresetDropDown(props) {
    const options = [];
    options.push(<option key="" value="" disabled>custom</option>);
    for(let label of props.items) {
        const value = props.items[label];
        options.push(<option key={label} value={value}>{label}</option>);
    }
    return <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {options}
    </select>;
}
