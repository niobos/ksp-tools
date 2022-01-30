import React from "react";

export default function Multiselect(props) {
    /* Renders a list of checkboxes.
     * Props:
     *  - items: object: mapping of internal value -> visible label
     *  - value: Set() of internal values
     *  - onChange(newValue: Set): updates to value
     */
    let items = props.items;
    if(Array.isArray(items)) {
        items = items.reduce((obj, el) => {
            obj[el] = el;
            return obj;
        }, {})
    }

    const checkboxes = [];
    for(let value in items) {
        const label = items[value];
        const checked = props.value.has(value);

        const newValue = new Set(props.value);  // copy
        if(checked) {  // remove
            newValue.delete(value);
        } else {  // unchecked: add
            newValue.add(value);
        }

        checkboxes.push(<label key={value} style={{display: 'inline-block'}}>
            <input type="checkbox" value={value}
                   checked={checked}
                   onChange={() => props.onChange(newValue)}
            />{label}
        </label>);
        checkboxes.push(" ");
    }
    return <div>{checkboxes}</div>
}