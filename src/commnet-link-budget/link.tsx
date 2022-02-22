import * as React from "react";
import {useState} from "react";  // JSX support
import Antenna from "../utils/kspParts-antenna";
import {SiInput} from "../components/formatedInput";
import KspHierBody from "../components/kspHierBody";
import {bodiesHierFind} from "../utils/kspBody";
import {orbits} from "../utils/kspOrbit";

interface LinkProps {
    value: number
    powerA: number
    powerB: number
    onChange: (number) => void
}

function maybeChange(
    bodyNameA: string,
    bodyNameB: string,
    onChange: (number) => void,
): void {
    if(bodyNameA === "") return;
    if(bodyNameB === "") return;

    const locA = bodiesHierFind(bodyNameA);
    const locB = bodiesHierFind(bodyNameB);
    let common = 0;
    while(locA[common] === locB[common] && common < locA.length) common++;

    let maxDistA;
    if(locA[common] === undefined) maxDistA = 0;
    else {
        maxDistA = orbits[locA[common]].distanceAtApoapsis;
    }

    let maxDistB;
    if(locB[common] === undefined) maxDistB = 0;
    else {
        maxDistB = orbits[locB[common]].distanceAtApoapsis;
    }

    onChange(maxDistA + maxDistB);
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
        />m (max range {SiInput.format(maxRange)}m)<br/>
        Distance between <KspHierBody
            customValue="Select body"
            value={distA} onChange={(b) => {
                setDistA(b);
                maybeChange(b, distB, props.onChange);
            }}
        /> and <KspHierBody
            customValue="Select body"
            value={distB} onChange={(b) => {
                setDistB(b);
                maybeChange(distA, b, props.onChange);
            }}
        /><br/>
        Signal strength {(signalStrength*100).toFixed(0)}%
    </div>;
}