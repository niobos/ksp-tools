import * as React from "react"
import kspMods from "../utils/kspMods"

export interface KspModSelectorProps {
    value: Set<string>
    onChange: (newActiveMods: Set<string>) => void
}
export default function KspModSelector({
    value,
    onChange,
}: KspModSelectorProps) {
    const list = []
    for(let [mod, info] of Object.entries(kspMods)) {
        const active = value.has(mod)
        list.push(<span key={mod}><label>
            <input type="checkbox"
                   checked={active}
                   onChange={e => {
                       if(e.target.checked) onChange(new Set([...value, mod]))
                       else onChange(new Set([...value].filter(m => m != mod)))
                   }}
            />
            {info.name}
        </label> </span>)
    }
    return <>
        Active mods: {list}
    </>
}
