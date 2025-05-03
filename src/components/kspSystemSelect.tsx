import * as React from "react"
import kspSystems from "../utils/kspSystems"

export interface SystemSelectProps {
    value: string
    onChange: (value: string) => void
}

export function SystemSelect(props: SystemSelectProps){
    const options = []
    const systemNames = Object.keys(kspSystems).sort()
    for(const systemName of systemNames) {
        options.push(<option key={systemName} value={systemName}>{systemName}</option>)
    }
    return <select value={props.value} onChange={e => props.onChange(e.target.value)}>
        {options}
    </select>
}

export interface HierarchicalBodySelectProps {
    systemName: string
    value: string
    onChange: (value: string) => void
    customValue?: string
    planetsOnly?: boolean,
}

export function HierarchicalBodySelect({
    systemName,
    value,
    onChange,
    customValue,
    planetsOnly = false,
}: HierarchicalBodySelectProps) {
    const options = []

    let i = 0
    if(customValue != null) {
        options.push(<option key={i++} value="" disabled>{customValue}</option>)
    }

    // optgroup's don't nest, so we can only do 1 level
    const system = kspSystems[systemName]

    options.push(<option key={i++} value={system.rootName}>{system.rootName}</option>)
    for(let childName of system.bodies[system.rootName].childrenNames) {
        const descendants = [
            <option key={i++} value={childName}>{childName}</option>,
        ]

        if(planetsOnly) {
            options.push(descendants[0])
        } else {
            for (const descendantName of system.recurseChildrenNames(childName)) {
                descendants.push(<option key={i++} value={descendantName}>{descendantName}</option>)
            }

            options.push(<optgroup key={i++} label={`${childName} system`}>{descendants}</optgroup>)
        }
    }

    return <select value={value} onChange={e => onChange(e.target.value)}>
        {options}
    </select>
}
