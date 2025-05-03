import * as React from "react";
import {useState} from "react";  // JSX support
import Antenna from "../utils/kspParts-antenna";
import {formatValueSi, SiInput} from "formattedInput";
import {HierarchicalBodySelect} from "../components/kspSystemSelect";
import kspSystems from "../utils/kspSystems";

interface LinkProps {
    systemName: string
    value: number
    powerA: number
    powerB: number
    onChange: (number) => void
}

function maybeChange(
    systemName: string,
    bodyNameA: string,
    bodyNameB: string,
    onChange: (number) => void,
): void {
    if(bodyNameA === "") return
    if(bodyNameB === "") return

    const locA = kspSystems[systemName].hierarchicalLocation(bodyNameA)
    const locB = kspSystems[systemName].hierarchicalLocation(bodyNameB)
    let common = 0
    while(locA[common] === locB[common] && common < locA.length) common++

    let maxDistA
    if(locA[common] === undefined) maxDistA = 0
    else {
        maxDistA = kspSystems[systemName].bodies[locA[common]].orbit.distanceAtApoapsis
    }

    let maxDistB
    if(locB[common] === undefined) maxDistB = 0
    else {
        maxDistB = kspSystems[systemName].bodies[locB[common]].orbit.distanceAtApoapsis
    }

    onChange(maxDistA + maxDistB)
}

export default function Link(props: LinkProps) {
    const maxRange = Antenna.maxRange(props.powerA, props.powerB);
    const signalStrength = Antenna.signalStrength(props.powerA, props.powerB, props.value);

    const [distA, setDistA] = useState("");
    const [distB, setDistB] = useState("");

    return <div className="link">
        Distance: <SiInput
            value={props.value}
            onChange={v => {
                props.onChange(v);
                setDistA("");
                setDistB("");
            }}
        />m (max range {formatValueSi(maxRange)}m)<br/>
        Distance between <HierarchicalBodySelect
            systemName={props.systemName}
            customValue="Select body"
            value={distA} onChange={(b) => {
                setDistA(b);
                maybeChange(props.systemName, b, distB, props.onChange);
            }}
        /> and <HierarchicalBodySelect
            systemName={props.systemName}
            customValue="Select body"
            value={distB} onChange={(b) => {
                setDistB(b);
                maybeChange(props.systemName, distA, b, props.onChange);
            }}
        /><br/>
        Signal strength {(signalStrength*100).toFixed(0)}%
    </div>;
}