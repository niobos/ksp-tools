import * as React from "react";
import {ReactNode, useState} from "react";

import "./tooltip.css"

export interface TooltipProps {
    tooltip: ReactNode | (() => ReactNode)
    children: ReactNode
}

export default function Tooltip(
    {
        tooltip,
        children,
    }: TooltipProps
) {
    const [visible, setVisible] = useState<boolean>(false)
    const [actionTimeout, setActionTimeout] = useState(null)

    const maybeTooltip = visible ? <div className="tooltip">
        {typeof(tooltip) === "function" ? tooltip() : tooltip}
    </div> : <></>

    return <span
        className="tooltip"
        onMouseEnter={() => {
            if (actionTimeout != null) {
                clearTimeout(actionTimeout)
            }
            setActionTimeout(setTimeout(() => {
                setVisible(true)
            }, 200))
        }}
        onMouseLeave={() => {
            if (actionTimeout != null) clearTimeout(actionTimeout)
            setActionTimeout(setTimeout(() => {
                setVisible(false)
            }, 500))
        }}
    >
        {children}
        {maybeTooltip}
    </span>
}

