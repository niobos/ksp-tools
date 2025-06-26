import * as React from "react"
import {FloatInput} from "formattedInput";
import {arrayInsertElement, arrayRemoveElement, arrayReplaceElement} from "../utils/list";

export interface KeyValueListProps {
    value: Array<[string, number]>
    onChange: (value: Array<[string, number]>) => void
}

export default function KeyValueList({
            value,
            onChange,
        }: KeyValueListProps) {
    const rows = []
    for(const [i, kv] of value.entries()) {
        const [k, v] = kv
        rows.push(<tr key={i}>
            <td>
                <input type="button" value="-"
                       onClick={() => onChange(arrayRemoveElement(value, i))}
                />
            </td>
            <td><input type="text" value={k}
                       onChange={e => onChange(arrayReplaceElement(value, i, [e.target.value, v]))}
            /></td>
            <td><FloatInput value={v} decimals={1}
                            onChange={newV => onChange(arrayReplaceElement(value, i, [k, newV]))}
            /></td>
        </tr>)
    }
    return <table>
        <tbody>{rows}</tbody>
        <tfoot><tr><td>
            <input type="button" value="+"
                   onClick={() => onChange(arrayInsertElement(value, ["", 0]))}
            />
        </td></tr></tfoot>
    </table>
}
