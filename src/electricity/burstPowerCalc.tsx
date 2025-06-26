import * as React from "react";
import {useState} from "react";
import {probeCores, reactionWheels} from "../utils/kspParts-other";
import {FloatInput} from "formattedInput"
import {KerbalYdhmsInput} from "../components/formattedInput";
import {arrayInsertElement, arrayRemoveElement, arrayReplaceElement} from "../utils/list";

function generateDeviceMap() {
    const hierLabelMap = {};
    const valueMap = {};
    const labelMap = {};

    {  // Probe Cores
        const options = {};
        for (let deviceName in probeCores) {
            const device = probeCores[deviceName];
            const maxTorque = device.maxTorque[0] + device.maxTorque[1] + device.maxTorque[2]
            if (maxTorque === 0) continue;
            const maxTorqueConsumption = maxTorque * device.torquePowerRequirement;

            const shortName = deviceName;
            const label = `${deviceName} @max torque`;
            options[label] = shortName;
            valueMap[shortName] = maxTorqueConsumption;
            labelMap[shortName] = label;
        }
        hierLabelMap['Probe Cores'] = options;
    }
    { // Reaction wheels
        const options = {};
        for (let deviceName in reactionWheels) {
            const device = reactionWheels[deviceName];
            const maxTorqueConsumption = (device.maxTorque[0] + device.maxTorque[1] + device.maxTorque[2])
                * device.torquePowerRequirement;

            const shortName = deviceName;
            const label = `${deviceName} @max torque`;
            options[label] = shortName;
            valueMap[shortName] = maxTorqueConsumption;
            labelMap[shortName] = label;
        }
        hierLabelMap['Reaction wheels'] = options;
    }
    // TODO: Engines requiring power

    return {hierLabelMap, valueMap, labelMap};
}
const deviceInfo = generateDeviceMap();

type BurstPowerDevice = {
    dev: string,
    duration: number,
    interval: number,
} | {
    energy: number,
    interval: number,
}
type ValueType = BurstPowerDevice[]

export function fromString(s: string): ValueType {
    const defaultValue = [{dev: "Probodobodyne HECS2", duration: 30, interval: 3600}];
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

function calcBurstPowerFromDevice(device: BurstPowerDevice) {
    if ('dev' in device) {
        device = {
            energy: deviceInfo.valueMap[device.dev] * device.duration,
            interval: device.interval,
        };
    }
    return {energy: device.energy, chargePower: device.energy / device.interval};
}

export function calcBurstPowerFromDevices(devices: ValueType) {
    let energy = 0;
    let chargePower = 0;
    for (let dev of devices) {
        const {energy: deviceEnergy, chargePower: deviceChargePower} = calcBurstPowerFromDevice(dev);
        energy += deviceEnergy;
        chargePower += deviceChargePower;
    }
    return {energy, interval: energy / chargePower};
}

export function fromEnergyInterval(energy: number, interval: number): ValueType {
    /* Create a burst load that will require `energy` and `chargePower`
     */
    return [{energy, interval}];
}

export interface BurstPowerCalcProps {
    value: ValueType
    onChange: (v: ValueType) => void
}

export function BurstPowerCalc(props: BurstPowerCalcProps) {
    const [selectedDevice, setSelectedDevice] = useState("");

    const devicesJsx = [];
    for (let i = 0; i < props.value.length; i++) {
        const dev = props.value[i];
        let devJsx;
        if ('dev' in dev) {  // named device
            const {energy} = calcBurstPowerFromDevice(dev);
            devJsx = <span>
                {deviceInfo.labelMap[dev.dev]}
                {" for "}<KerbalYdhmsInput
                value={dev.duration}
                onChange={v => props.onChange(arrayReplaceElement(props.value, i,
                    {dev: dev.dev, duration: v, interval: dev.interval}))}
            /> every <KerbalYdhmsInput
                value={dev.interval}
                onChange={v => props.onChange(arrayReplaceElement(props.value, i,
                    {dev: dev.dev, duration: dev.duration, interval: v}))}
            /> ({energy.toFixed(1)}⚡)
            </span>;
        } else {
            devJsx = <span>
                Custom <FloatInput
                decimals={1}
                value={dev.energy}
                onChange={v => props.onChange(arrayReplaceElement(props.value, i,
                    {energy: v, interval: dev.interval}))}
            />⚡ every <KerbalYdhmsInput
                value={dev.interval}
                onChange={v => props.onChange(arrayReplaceElement(props.value, i,
                    {energy: dev.energy, interval: v}))}
            /></span>;
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
        Calculate power burst to support:<br/>
        {devicesJsx}
        <input type="button" value="+"
               onClick={() => {
                   const dev = selectedDevice === ""
                       ? {energy: 1, interval: 300}
                       : {dev: selectedDevice, duration: 30, interval: 3600};
                   props.onChange(arrayInsertElement(props.value, dev))
               }}
        /><select value={selectedDevice}
                  onChange={e => setSelectedDevice(e.target.value)}
        >
        <option value="">Custom power burst</option>
        {deviceOptions}
    </select>
    </div>;
}
