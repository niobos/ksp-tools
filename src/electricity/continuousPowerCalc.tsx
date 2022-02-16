import React, {useState} from "react";
import {
    arrayInsertElement,
    arrayRemoveElement,
    arrayReplaceElement
} from "../components/list";
import {probeCores} from "../utils/kspParts-other";
import {FloatInput} from "../components/formatedInput";

function formatPower(power) {
    const units = ['s', 'm', 'h', 'd'];
    const unitFactor = [60, 60, 6];
    while (power < 1 && unitFactor.length) {
        power *= unitFactor.shift();
        units.shift();
    }
    return `${power.toFixed(1)}⚡/${units[0]}`;
}

function generateDeviceMap() {
    const hierLabelMap = {};
    const valueMap = {};
    const labelMap = {};

    {
        const options = {};
        for (let deviceName in probeCores) {
            const device = probeCores[deviceName];
            if (device.consumption.el === 0) continue;

            const shortName = deviceName;
            options[deviceName] = shortName;
            valueMap[shortName] = device.consumption.el;
            labelMap[shortName] = deviceName;

            if (device.hibernateMultiplier !== undefined) {
                deviceName = `${deviceName} (hibernating)`;
                const hibernatingShortName = shortName + '@H';
                options[deviceName] = hibernatingShortName;
                valueMap[hibernatingShortName] = device.consumption.el * device.hibernateMultiplier;
                labelMap[hibernatingShortName] = deviceName;
            }
        }
        hierLabelMap['Probe Cores'] = options;
    }

    return {hierLabelMap, valueMap, labelMap};
}
const deviceInfo = generateDeviceMap();

export function calcPowerFromDevices(devices) {
    let power = 0;
    for (let dev of devices) {
        if (typeof dev === 'number') {
            power += dev;
        } else {
            power += deviceInfo.valueMap[dev];
        }
    }
    return power;
}

type ContinuousPowerDevice = number | string;
type ValueType = ContinuousPowerDevice[];

export function fromString(s: string): ValueType {
    const defaultValue = ["Probodobodyne HECS2"];
    if (s === null || s === undefined) return defaultValue;
    try {
        return JSON.parse(s);
    } catch (e) {
        return defaultValue;
    }
}

export function toString(v: ValueType): string {
    return JSON.stringify(v);
}

export function customOnly(v: number): ValueType {
    return [v];
}

export interface ContinuousPowerCalcProps {
    value: ValueType
    onChange: (v: ValueType) => void
}

export function ContinuousPowerCalc(props: ContinuousPowerCalcProps) {
    const [selectedDevice, setSelectedDevice] = useState("");

    const devicesJsx = [];
    for(let i = 0; i < props.value.length; i++) {
        const dev = props.value[i];
        let devJsx;
        if (typeof dev === 'number') {
            devJsx = <span>
                Custom <FloatInput
                decimals={1}
                value={dev}
                onChange={v => props.onChange(arrayReplaceElement(props.value, i, v))}
            />⚡/s
            </span>;

        } else {
            const power = deviceInfo.valueMap[dev];
            devJsx = <span>{deviceInfo.labelMap[dev]} ({formatPower(power)})
            </span>;
        }

        devicesJsx.push(<div key={i}>
            <input type="button" value="-"
                   onClick={() => props.onChange(arrayRemoveElement(props.value, i))}
            />{" "}{devJsx}</div>);
    }

    const deviceOptions = [];
    for (let group in deviceInfo.hierLabelMap) {
        const options = [];
        for (let option in deviceInfo.hierLabelMap[group]) {
            options.push(<option key={option}
                                 value={deviceInfo.hierLabelMap[group][option]}>{option}</option>);
        }
        deviceOptions.push(<optgroup key={group} label={group}>{options}</optgroup>);
    }

    return <div>
        Devices requiring power:<br/>
        {devicesJsx}
        <input type="button" value="+"
               onClick={() => {
                   const v = selectedDevice === "" ? 0 : selectedDevice;
                   props.onChange(arrayInsertElement(props.value, v));
               }}
        /><select value={selectedDevice}
                  onChange={e => setSelectedDevice(e.target.value)}
    >
        <option value="">Custom power</option>
        {deviceOptions}
    </select>
    </div>;
}
