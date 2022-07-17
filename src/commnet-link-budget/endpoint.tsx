import * as React from "react";  // JSX support
import {SiInput} from "../components/formatedInput";
import {arrayInsertElement, arrayRemoveElement, arrayReplaceElement} from "../utils/list";
import Antenna, {antennas as kspAntennas} from "../utils/kspParts-antenna";

type Antennas = number | string[]

interface EndpointProps {
    value: Antennas
    onChange: (number) => void
    showGroundstations?: boolean
}

function customOnly(power: number): Antennas {
    return power;
}

export function calcCombinedPower(antennas: Antennas): number {
    if(typeof antennas === 'number') return antennas;
    const antennaParts = antennas.map(name => kspAntennas[name]);
    return Antenna.combinedPower(antennaParts);
}

function addAntenna(arr, el) {
    if(el === "") return arr;  // Don't add placeholder
    if(Array.isArray(arr)) return arrayInsertElement(arr, el);
    return [el];
}

export default function Endpoint(props: EndpointProps) {
    const combinedPower = calcCombinedPower(props.value);

    const presetAntennasJsx = [];
    for(let antennaName in kspAntennas) {
        const antenna = kspAntennas[antennaName]
        if(antenna.relay !== null || props.showGroundstations) {
            presetAntennasJsx.push(<option key={antennaName} value={antennaName}>{antennaName}</option>);
        }
    }

    const antennasJsx = []
    if(Array.isArray(props.value) && props.value.length > 0) {
        for(let antennaNr = 0; antennaNr < props.value.length; antennaNr++) {
            const antennaName = props.value[antennaNr];
            const antenna = kspAntennas[antennaName];
            let scienceJsx;
            if(antenna.txSpeed == null) {
                scienceJsx = "(Not able to transmit science)"
            } else {
                scienceJsx = <>
                    {antenna.txSpeed}Mit/s{", "}
                    {antenna.consumption.el}⚡/Mit{", "}
                    {(antenna.consumption.el / antenna.txSpeed).toFixed(1)}⚡/s
                </>;
            }
            antennasJsx.push(<div key={antennaNr}>
                <input type="button" value="-"
                       onClick={e => props.onChange(arrayRemoveElement(props.value as string[], antennaNr))}
                /><select value={antennaName}
                          onChange={e => props.onChange(arrayReplaceElement(props.value as string[], antennaNr, e.target.value))}>
                    {presetAntennasJsx}
                </select>{" "}
                {scienceJsx}
            </div>);
        }
    } else {
        antennasJsx.push(<div></div>);
    }

    const anyAntennaName = Object.keys(kspAntennas).filter(antennaName => kspAntennas[antennaName].relay !== null)[0];
    // Filter ground-station antenna's

    return <div className="endpoint">
        Combined antenna power: <SiInput
            value={combinedPower}
            onChange={v => props.onChange(customOnly(v))}
        />:<br/>
        {antennasJsx}
        <input type="button" value="+" onClick={e => props.onChange(addAntenna(props.value, anyAntennaName))}
        />
    </div>;
}