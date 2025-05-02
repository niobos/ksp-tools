import * as React from "react"
import {ReactNode} from "react"

export interface MultiselectProps {
    items: Record<string, string> | Array<string>
    value: Set<string>
    onChange: (v: Set<string>) => void
}
export default function Multiselect({
    items,
    value,
    onChange,
}: MultiselectProps) {
    /* Renders a list of checkboxes.
     * Props:
     *  - items: object: mapping of internal value -> visible label
     *  - value: Set() of internal values
     *  - onChange(newValue: Set): updates to value
     */
    if(Array.isArray(items)) {
        items = items.reduce((obj, el) => {
            obj[el] = el
            return obj
        }, {})
    }

    const checkboxes: Array<ReactNode> = []
    for(let v in items) {
        const label = items[v]
        const checked = value.has(v)

        checkboxes.push(<label key={v} style={{display: 'inline-block'}}>
            <input type="checkbox" value={v}
                   checked={checked}
                   onChange={() => {
                       const newValue = new Set(value)  // copy
                       if(checked) {  // remove
                           newValue.delete(v)
                       } else {  // unchecked: add
                           newValue.add(v)
                       }
                       onChange(newValue)
                   }}
            />{label}
        </label>)
        checkboxes.push(" ")
    }
    return <div>{checkboxes}</div>
}
