import * as React from "react";
import {useState} from "react";  // JSX support
import Antenna from "../utils/kspParts-antenna";
import {formatValueSi, SiInput} from "formattedInput";
import {HierarchicalBodySelect} from "../components/kspSystemSelect";
import {KspSystem} from "../utils/kspSystems";

interface LinkProps {
    system: KspSystem
    value: number
    powerA: number
    powerB: number
    onChange: (value: number) => void
}

function maybeChange(
    system: KspSystem,
    bodyNameA: string,
    bodyNameB: string,
    onChange: (value: number) => void,
): void {
    if(bodyNameA === "") return
    if(bodyNameB === "") return

    const locA = system.hierarchicalLocation(bodyNameA)
    const locB = system.hierarchicalLocation(bodyNameB)
    let common = 0
    while(locA[common] === locB[common] && common < locA.length) common++

    let maxDistA
    if(locA[common] === undefined) maxDistA = 0
    else {
        maxDistA = system.bodies[locA[common]].orbit.distanceAtApoapsis
    }

    let maxDistB
    if(locB[common] === undefined) maxDistB = 0
    else {
        maxDistB = system.bodies[locB[common]].orbit.distanceAtApoapsis
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
            system={props.system}
            customValue="Select body"
            value={distA} onChange={(b) => {
                setDistA(b);
                maybeChange(props.system, b, distB, props.onChange);
            }}
        /> and <HierarchicalBodySelect
            system={props.system}
            customValue="Select body"
            value={distB} onChange={(b) => {
                setDistB(b);
                maybeChange(props.system, distA, b, props.onChange);
            }}
        /><br/>
        Signal strength {(signalStrength*100).toFixed(0)}%
    </div>;
}