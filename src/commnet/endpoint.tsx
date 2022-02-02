import React, {useState} from "react";  // JSX support
import {SiInput} from "../components/formatedInput";
import {arrayInsertElement, arrayRemoveElement} from "../components/list";
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
    const [selectedAntenna, setSelectedAntenna] = useState("")

    const combinedPower = calcCombinedPower(props.value);

    const antennasJsx = []
    if(Array.isArray(props.value)) {
        for(let antennaNr = 0; antennaNr < props.value.length; antennaNr++) {
            const antenna = props.value[antennaNr];
            let content;
            if(typeof antenna === 'string') {
                content = antenna;
            } else {
                content = <span>Custom {antenna}</span>;
            }
            antennasJsx.push(<div key={antennaNr}>
                <input type="button" value="-"
                       onClick={e => props.onChange(arrayRemoveElement(props.value as string[], antennaNr))}
                />{content}
            </div>);
        }
    } else {
        antennasJsx.push(<div>Custom</div>);
    }

    const presetAntennasJsx = [];
    for(let antennaName in kspAntennas) {
        const antenna = kspAntennas[antennaName]
        if(antenna.relay !== null || props.showGroundstations) {
            presetAntennasJsx.push(<option key={antennaName} value={antennaName}>{antennaName}</option>);
        }
    }

    return <div className="endpoint">
        Combined antenna power: <SiInput
            value={combinedPower}
            onChange={v => props.onChange(customOnly(v))}
        />:<br/>
        {antennasJsx}
        <input type="button" value="+" onClick={e => props.onChange(addAntenna(props.value, selectedAntenna))}
        /><select value={selectedAntenna}
                  onChange={e => setSelectedAntenna(e.target.value)}>
            <option value="" disabled>Add antenna</option>
            {presetAntennasJsx}
        </select>
    </div>;
}