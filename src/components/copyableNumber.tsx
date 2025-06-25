import * as React from "react"

import './copyableNumber.css'

export interface CopyableNumberProps {
    value: number
    displayDecimals?: number
}
export default function CopyableNumber({
    value,
    displayDecimals = 0,
}: CopyableNumberProps) {
    let formattedValue
    try {
        formattedValue = value.toFixed(displayDecimals)
    } catch(e) {
        formattedValue = "NaN"
    }
    return <span
        className="copyable"
        onClick={() => navigator.clipboard.writeText('' + value)}
        title="Copy to clipboard"
    >
        {formattedValue}
    </span>
}