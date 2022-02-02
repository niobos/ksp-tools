import React from "react";
import ReactDOM from "react-dom";
import {FloatInput, KerbalYdhmsInput, SiInput} from "./components/formatedInput";
import {addFragmentStateProperty, addStateProperty} from "./utils/useFragmentState";
import Preset from "./components/preset";
import SortableTable from "./components/sortableTable";
import AdjustableList from "./components/list";
import {bodies, planets} from "./utils/kspBody";
import Orbit, {orbitalDarkness, orbits} from "./utils/kspOrbit";
import KspHierBody from "./components/kspHierBody";
import {Resources} from "./utils/kspParts";
import FuelTank from "./components/fuelTank";
import {fuelTanks} from "./utils/kspParts-fuelTanks";
import {batteries, electricalGenerators, FuelCell, SolarPanel} from "./utils/kspParts-solarPanel";
import {probeCores} from "./utils/kspParts-other";
import {fromPreset, objectMap} from "./utils/utils";

import {KspFund} from "./components/kspIcon";
import './electricity.css';

function solarPanelEfficiencyFromKerbolDistance(d) {
    return 1 / Math.pow(d/orbits.Kerbin.sma, 2);
}
function kerbolDistanceFromSolarPanelEfficiency(e) {
    return Math.sqrt(1/e) * orbits.Kerbin.sma;
}

function formatPower(power) {
    const units = ['s', 'm', 'h', 'd'];
    const unitFactor = [60, 60, 6];
    while(power < 1 && unitFactor.length) {
        power *= unitFactor.shift();
        units.shift();
    }
    return `${power.toFixed(1)}⚡/${units[0]}`;
}

export class ContinuousPowerCalc extends AdjustableList {
    static defaultValue = ["Probodobodyne HECS2"];
    static devices = this.generateDeviceMap();

    static generateDeviceMap() {
        const hierLabelMap = {};
        const valueMap = {};
        const labelMap = {};

        {
            const options = {};
            for (let deviceName in probeCores) {
                const device = probeCores[deviceName];

                const shortName = deviceName;
                options[deviceName] = shortName;
                valueMap[shortName] = device.consumption.el;
                labelMap[shortName] = deviceName;

                if(device.hibernateMultiplier !== undefined) {
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

    static calcPowerFromDevices(devices) {
        let power = 0;
        for(let dev of devices) {
            if(typeof dev === 'number') {
                power += dev;
            } else {
                power += ContinuousPowerCalc.devices.valueMap[dev];
            }
        }
        return power;
    }

    static fromString(s) {
        if(s === null || s === undefined) return ContinuousPowerCalc.defaultValue;
        try {
            const v = JSON.parse(s);
            return v;
        } catch(e) {
            return ContinuousPowerCalc.defaultValue;
        }
    }
    static toString(v) {
        return JSON.stringify(v);
    }

    static customOnly(v) {
        return [v];
    }

    constructor(props) {
        super(props);
        this.state = {
            selectedDevice: "",
        };
    }

    onAdd(v) {
        if(v === "") v = 0;
        super.onAdd(v);
    }

    render() {
        const devices = [];
        for(let i in this.props.value) {
            const dev = this.props.value[i];
            let devJsx;
            if(typeof dev === 'number') {
                devJsx = <span>
                    Custom <FloatInput
                        decimals={1}
                        value={dev}
                        onChange={v => this.onChange(i, v)}
                    />⚡/s
                </span>;

            } else {
                const power = ContinuousPowerCalc.devices.valueMap[dev];
                devJsx = <span>{ContinuousPowerCalc.devices.labelMap[dev]} ({formatPower(power)})
                </span>;
            }

            devices.push(<div key={i}>
                <input type="button" value="-"
                       onClick={() => this.onDelete(i)}
                />{" "}{devJsx}</div>);
        }

        const deviceOptions = [];
        for(let group in ContinuousPowerCalc.devices.hierLabelMap) {
            const options = [];
            for(let option in ContinuousPowerCalc.devices.hierLabelMap[group]) {
                options.push(<option key={option} value={ContinuousPowerCalc.devices.hierLabelMap[group][option]}>{option}</option>);
            }
            deviceOptions.push(<optgroup key={group} label={group}>{options}</optgroup>);
        }

        return <div>
            Devices requiring power:<br/>
            {devices}
            <input type="button" value="+"
                   onClick={() => this.onAdd(this.state.selectedDevice)}
            /><select value={this.state.selectedDevice}
                      onChange={e => this.setState({selectedDevice: e.target.value})}
            >
                <option value="">Custom power</option>
                {deviceOptions}
            </select>
        </div>;
    }
}

export class BurstPowerCalc extends AdjustableList {
    static defaultValue = [{dev: "Probodobodyne HECS2", duration: 30, interval: 3600}];
    static devices = this.generateDeviceMap();

    static generateDeviceMap() {
        const hierLabelMap = {};
        const valueMap = {};
        const labelMap = {};

        {
            const options = {};
            for (let deviceName in probeCores) {
                const device = probeCores[deviceName];
                const maxTorqueConsumption = (device.maxTorque[0] + device.maxTorque[1] + device.maxTorque[2])
                    * device.torquePowerRequirement;

                const shortName = deviceName;
                const label = `${deviceName} @max torque`;
                options[label] = shortName;
                valueMap[shortName] = maxTorqueConsumption;
                labelMap[shortName] = label;
            }
            hierLabelMap['Probe Cores'] = options;
        }

        return {hierLabelMap, valueMap, labelMap};
    }

    static fromString(s) {
        if(s === null || s === undefined) return BurstPowerCalc.defaultValue;
        try {
            return JSON.parse(s);
        } catch(e) {
            return BurstPowerCalc.defaultValue;
        }
    }
    static toString(v) {
        return JSON.stringify(v);
    }

    static calcBurstPowerFromDevices(devices) {
        let energy = 0;
        let chargePower = 0;
        for(let dev of devices) {
            if('dev' in dev) {
                dev = {
                    energy: BurstPowerCalc.devices.valueMap[dev.dev] * dev.duration,
                    interval: dev.interval,
                };
            }
            energy += dev.energy;
            chargePower += dev.energy / dev.interval;
        }
        return {energy, interval: energy / chargePower};
    }

    static fromEnergyInterval(energy, interval) {
        /* Create a burst load that will require `energy` and `chargePower`
         */
        return [{energy, interval}];
    }

    constructor(props) {
        super(props);
        this.state = {
            selectedDevice: "",
        }
    }

    onAdd(element, index) {
        if(element === "") element = {energy: 1, interval: 300};
        super.onAdd(element, index);
    }

    render() {
        const devices = [];
        for(let i in this.props.value) {
            const dev = this.props.value[i];
            let devJsx;
            if('dev' in dev) {  // named device
                devJsx = <span>
                    {BurstPowerCalc.devices.labelMap[dev.dev]}
                    {" for "}<KerbalYdhmsInput
                        value={dev.duration}
                        onChange={v => this.onChange(i, {dev: dev.dev, duration: v, interval: dev.interval})}
                    /> every <KerbalYdhmsInput
                        value={dev.interval}
                        onChange={v => this.onChange(i, {dev: dev.dev, duration: dev.duration, interval: v})}
                    />
                </span>;
            } else {
                devJsx = <span>
                    Custom <FloatInput
                        decimals={1}
                        value={dev.energy}
                        onChange={v => this.onChange(i, {energy: v, interval: dev.interval})}
                    />⚡ every <KerbalYdhmsInput
                        value={dev.interval}
                        onChange={v => this.onChange(i, {energy: dev.energy, interval: v})}
                    /></span>;
            }

            devices.push(<div key={i}>
                <input type="button" value="-"
                       onClick={() => this.onDelete(i)}
                />{" "}{devJsx}</div>);
        }

        const deviceOptions = [];
        for(let group in BurstPowerCalc.devices.hierLabelMap) {
            const options = [];
            for(let option in BurstPowerCalc.devices.hierLabelMap[group]) {
                options.push(<option key={option} value={BurstPowerCalc.devices.hierLabelMap[group][option]}>{option}</option>);
            }
            deviceOptions.push(<optgroup key={group} label={group}>{options}</optgroup>);
        }

        return <div>
            Calculate power burst to support:<br/>
            {devices}
            <input type="button" value="+"
                   onClick={() => this.onAdd(this.state.selectedDevice)}
            /><select value={this.state.selectedDevice}
                      onChange={e => this.setState({selectedDevice: e.target.value})}
        >
            <option value="">Custom power burst</option>
            {deviceOptions}
        </select>
        </div>;
    }
}

export class ShadeCalc extends AdjustableList {
    static defaultValue = [{'o': 'Kerbin', 'a': 100000}];

    static fromString(s) {
        if(s === null || s === undefined) return ShadeCalc.defaultValue;
        try {
            return JSON.parse(s);
        } catch(e) {
            return ShadeCalc.defaultValue;
        }
    }
    static toString(v) {
        return JSON.stringify(v);
    }

    static calcShade(shades) {
        let maxDuration = 0;
        let maxDuty = 0;
        for(let shade of shades) {
            let duration, duty;
            if('o' in shade) {  // orbital darkness
                const body = bodies[shade.o];
                duration = orbitalDarkness(body.gravity, body.radius_m, shade.a);
                duty = duration / Orbit.period_from_sma(body.radius_m + shade.a, body.gravity);
            } else if('s' in shade) {  // solar night
                const body = bodies[shade.s];
                duration = body.solar_day_s / 2;
                duty = 0.5;
            } else if('d' in shade) {  // custom
                duration = shade.d;
                duty = shade.d === 0 ? 0 : shade.d / shade.i;
            }
            if(duration > maxDuration) maxDuration = duration;
            if(duty > maxDuty) maxDuty = duty;
        }
        return {duration: maxDuration, interval: maxDuty > 0 ? maxDuration / maxDuty : Infinity};
    }

    static custom(duration, interval) {
        return [{'d': duration, 'i': interval}];
    }

    constructor(props) {
        super(props);
        this.state = {
            selectedSolarNight: 'Kerbin',
            selectedOrbitalDarknessBody: 'Kerbin',
            orbitalDarknessAlt: 100000,
        }
    }

    render() {
        const shades = [];
        for(let i in this.props.value) {
            const shade = this.props.value[i];
            let shadeJsx;
            if('o' in shade) {  // orbital darkness
                shadeJsx = <span>Orbital darkness
                    at {SiInput.formatValue(shade.a)}mAGL
                    above {shade.o}
                </span>;
            } else if('s' in shade) {  // solar night
                shadeJsx = <span>Solar night on {shade.s}</span>;
            } else if('d' in shade) {  // custom
                shadeJsx = <span>
                    <KerbalYdhmsInput
                        value={shade.d} singleUnit={true}
                        onChange={v => this.onChange(i, {d: v, i: shade.i})}
                    /> every <KerbalYdhmsInput
                        value={shade.i} singleUnit={true}
                        onChange={v => this.onChange(i, {d: shade.d, i: v})}
                    />
                </span>;
            } else {
                console.error(shade);
            }
            shades.push(<div key={i}>
                <input type="button" value="-"
                       onClick={() => this.onDelete(i)}
                />{" "}{shadeJsx}</div>);
        }

        return <div>
            Calculate shade from worst of:<br/>
            {shades}
            <input type="button" value="Add solar night on"
                   onClick={() => this.onAdd({'s': this.state.selectedSolarNight})}
            /><KspHierBody value={this.state.selectedSolarNight}
                           onChange={v => this.setState({selectedSolarNight: v})}
            /><br/>
            <input type="button" value="Add orbital darkness at"
                   onClick={() => this.onAdd({
                       'o': this.state.selectedOrbitalDarknessBody,
                       'a': this.state.orbitalDarknessAlt,
                   })}
            /><SiInput
                value={this.state.orbitalDarknessAlt}
                onChange={v => this.setState({orbitalDarknessAlt: v})}
            />mAGL above <KspHierBody
                value={this.state.selectedSolarNight}
                onChange={v => this.setState({selectedSolarNight: v})}
            /><br/>
            <input type="button" value="Add custom shade"
                   onClick={() => this.onAdd({
                       'd': 5*60,
                       'i': 6*60*60,
                   })}
            />
        </div>;
    }
}

export default class App extends React.PureComponent {
    constructor(props) {
        super(props);
        addFragmentStateProperty(this, 'continuousPower', 'c', ContinuousPowerCalc.fromString, ContinuousPowerCalc.toString);
        addStateProperty(this, 'continuousPowerCalcOpen', false);
        addFragmentStateProperty(this, 'burstPower', 'b', BurstPowerCalc.fromString, BurstPowerCalc.toString);
        addStateProperty(this, 'burstPowerCalcOpen', false);
        addFragmentStateProperty(this, 'duration', 'd', 10 * 6 * 60 * 60);
        addFragmentStateProperty(this, 'fuelTank', 'ft', {fullEmptyRatio: 8.69, cost: 233.50});
        addFragmentStateProperty(this, 'solarEfficiency', 's', 1.00);
        addFragmentStateProperty(this, 'shade', 'S', ShadeCalc.fromString, ShadeCalc.toString);
        addStateProperty(this, 'shadeCalcOpen', false);
    }

    static columns = [
        {title: 'Config', value: i => i.config},
        {
            title: <span>Cost [<KspFund/>]</span>, value: i => i.cost.toFixed(0),
            classList: i => isNaN(i.cost) ? ['number', 'zero'] : ['number'],
            cmp: (a, b) => a.cost - b.cost,
        },
        {
            title: 'Mass [t]', classList: 'number', value: i => i.mass.toFixed(2),
            cmp: (a, b) => a.mass - b.mass,
        },
        {
            title: 'Max power [⚡/m]', classList: 'number',
            value: i => (i.maxPower * 60).toFixed(1),
            cmp: (a, b) => a.maxPower - b.maxPower,
        },
        {
            title: 'Energy [⚡]', classList: 'number',
            value: i => i.batteryEnergy.toFixed(0),
            cmp: (a, b) => a.batteryEnergy - b.batteryEnergy,
        },
        {
            title: 'Nominal power [⚡/m]', classList: 'number',
            value: i => (i.nominalPower * 60).toFixed(1),
            cmp: (a, b) => a.nominalPower - b.nominalPower,
        },
        {
            title: 'Charge (burst+darkness) [⚡/m]', classList: 'number',
            value: i => `${((i.burstChargePower+i.darknessChargePower)*60).toFixed(1)} (`
                + `${(i.burstChargePower*60).toFixed(1)} + `
                + `${(i.darknessChargePower*60).toFixed(1)})`,
            cmp: (a, b) => (a.burstChargePower + a.darknessChargePower) - (b.burstChargePower + b.darknessChargePower),
        },
        {
            title: 'Available power [⚡/m]', classList: 'number',
            value: i => ((i.maxPower-i.burstChargePower-i.darknessChargePower)*60).toFixed(1),
            cmp: (a, b) => (a.maxPower-a.burstChargePower-a.darknessChargePower) - (b.maxPower-b.burstChargePower-b.darknessChargePower),
        },
    ];

    // Only use Z-100 batteries. Other batteries have same energy/mass ratio, but have higher cost/energy ratio
    static batteryName = "Z-100";
    static battery = batteries[this.batteryName];

    solarPanelSolutions(shadeValue, continuousPowerValue, burstPowerValue) {
        const solutions = [];
        for (let panelName in electricalGenerators) {
            const panel = electricalGenerators[panelName];
            if (!(panel instanceof SolarPanel)) continue;

            const burstChargePower = burstPowerValue.energy / burstPowerValue.interval;
            const shadeEnergy = shadeValue.duration * (continuousPowerValue + burstChargePower);
            const lightDuration = shadeValue.interval - shadeValue.duration;
            const shadeChargePower = shadeEnergy / lightDuration;
            const neededPowerDuringLight = continuousPowerValue + burstChargePower + shadeChargePower;
            const panelPower = (-panel.consumption.el) * this.solarEfficiency;
            const numDev = Math.ceil(neededPowerDuringLight / panelPower);
            const batteryEnergy = shadeEnergy + burstPowerValue.energy;
            const numBatteries = Math.ceil(batteryEnergy / this.constructor.battery.content.el);
            if (panel.wikiUrl !== undefined) {
                panelName = <a href={panel.wikiUrl}>{panelName}</a>;
            }
            let batteryName = this.constructor.batteryName;
            if(this.constructor.battery.wikiUrl !== undefined) {
                batteryName = <a href={this.constructor.battery.wikiUrl}>{batteryName}</a>;
            }
            solutions.push({
                config: <span>{numDev} × {panelName} + {numBatteries} × {batteryName}</span>,
                cost: numDev * panel.cost + numBatteries * batteries["Z-100"].cost,
                mass: numDev * panel.mass + numBatteries * batteries["Z-100"].mass,
                maxPower: numDev * panelPower,
                batteryEnergy: batteryEnergy,
                nominalPower: neededPowerDuringLight,
                burstChargePower: burstChargePower,
                darknessChargePower: shadeChargePower,
            });
        }
        return solutions;
    }

    fuelCellSolutions(burstPowerValue, continuousPowerValue, fuelTankValue) {
        const solutions = [];
        for (let cellName in electricalGenerators) {
            const cell = electricalGenerators[cellName];
            if (!(cell instanceof FuelCell)) continue;

            const burstChargePower = burstPowerValue.energy / burstPowerValue.interval;
            const neededPower = continuousPowerValue + burstChargePower;
            const numDev = Math.ceil(neededPower / (-cell.consumption.el));
            const numBatteries = Math.max(0, Math.ceil((burstPowerValue.energy - numDev * cell.content.el) / batteries['Z-100'].content.el));
            const totalEnergy = neededPower * this.duration;
            const fullLoadTime = totalEnergy / (-cell.consumption.el);  // equivalent time at 100% load
            const neededFuelMass = fullLoadTime * (
                cell.consumption.lf * Resources.mass.lf
                + cell.consumption.ox * Resources.mass.ox
            );
            /* fullTank = emptyTank + fuel
             * fullTank / emptyTank = WDR  => emptyTank = fullTank / WDR
             * fullTank = fullTank / WDR + fuel
             * (1 - 1/WDR) fullTank = fuel
             * fullTank = fuel / (1 - 1/WDR)
             */
            const neededTankMass = neededFuelMass / (1 - 1 / fuelTankValue.fullEmptyRatio);

            if (cell.wikiUrl !== undefined) {
                cellName = <a href={cell.wikiUrl}>{cellName}</a>;
            }
            let batteryName = this.constructor.batteryName;
            if(this.constructor.battery.wikiUrl !== undefined) {
                batteryName = <a href={this.constructor.battery.wikiUrl}>{batteryName}</a>;
            }
            solutions.push({
                config:
                    <span>{numDev} × {cellName} + {numBatteries} × {batteryName} + {neededTankMass.toFixed(1)}t fuel tanks</span>,
                cost: numDev * cell.cost + numBatteries * batteries["Z-100"].cost + neededFuelMass * fuelTankValue.cost,
                mass: numDev * cell.mass + numBatteries * batteries["Z-100"].mass + neededFuelMass,
                maxPower: numDev * (-cell.consumption.el),
                batteryEnergy: burstPowerValue.energy,
                nominalPower: neededPower,
                burstChargePower: burstChargePower,
                darknessChargePower: 0,
            });
        }
        return solutions;
    }

    rtgSolutions(burstPowerValue, continuousPowerValue) {
        const solutions = [];
        const dev = electricalGenerators["PB-NUK Radioisotope Thermoelectric Generator"];
        const burstCharge = burstPowerValue.energy / burstPowerValue.interval;
        const neededPower = continuousPowerValue + burstCharge;
        const numDev = Math.ceil(neededPower / (-dev.consumption.el));
        const numBatteries = Math.ceil(burstPowerValue.energy / batteries['Z-100'].content.el);
        let genName = 'PB-NUK';
        if (dev.wikiUrl !== undefined) {
            genName = <a href={dev.wikiUrl}>{genName}</a>;
        }
        let batteryName = this.constructor.batteryName;
        if(this.constructor.battery.wikiUrl !== undefined) {
            batteryName = <a href={this.constructor.battery.wikiUrl}>{batteryName}</a>;
        }
        solutions.push({
            config: <span>{numDev} × {genName} + {numBatteries} × {batteryName}</span>,
            cost: numDev * dev.cost + numBatteries * batteries["Z-100"].cost,
            mass: numDev * dev.mass + numBatteries * batteries["Z-100"].mass,
            maxPower: numDev * (-dev.consumption.el),
            batteryEnergy: burstPowerValue.energy,
            nominalPower: continuousPowerValue + burstCharge,
            burstChargePower: burstCharge,
            darknessChargePower: 0,
        });
        return solutions;
    }

    render() {
        const continuousPowerValue = ContinuousPowerCalc.calcPowerFromDevices(this.continuousPower);
        const burstPowerValue = BurstPowerCalc.calcBurstPowerFromDevices(this.burstPower);
        const shadeValue = ShadeCalc.calcShade(this.shade);
        const {value: fuelTankValue, preset: fuelTankPreset} = fromPreset(
            this.fuelTank, objectMap(fuelTanks, (ft) => {
                return {fullEmptyRatio: ft.mass / ft.emptied().mass, cost: ft.cost / ft.mass}
            })
        );

        const solutions = [];
        solutions.push(...this.solarPanelSolutions(shadeValue, continuousPowerValue, burstPowerValue));
        solutions.push(...this.fuelCellSolutions(burstPowerValue, continuousPowerValue, fuelTankValue));
        solutions.push(...this.rtgSolutions(burstPowerValue, continuousPowerValue, solutions));

        return <div>
            <h1>Electricity options</h1>
            <h2>Requirements</h2>
            <table>
                <tbody>
                <tr>
                    <td>Continuous:</td>
                    <td>
                        <div style={{display: 'inline', cursor: 'pointer'}}
                             onClick={(e) => this.continuousPowerCalcOpen = !this.continuousPowerCalcOpen}>
                            {this.continuousPowerCalcOpen ? "▾" : "▸"}</div>
                        <FloatInput decimals={1} value={continuousPowerValue}
                                    onChange={v => this.continuousPower = ContinuousPowerCalc.customOnly(v)}
                        />⚡/s
                        {" = "}
                        <FloatInput decimals={1} value={continuousPowerValue * 60}
                                    onChange={v => this.continuousPower = ContinuousPowerCalc.customOnly(v / 60)}
                        />⚡/m
                        {" = "}
                        <FloatInput decimals={1} value={continuousPowerValue * 60 * 60}
                                    onChange={v => this.continuousPower = ContinuousPowerCalc.customOnly(v / 60 / 60)}
                        />⚡/h<br/>
                        <div style={{
                            display: this.continuousPowerCalcOpen ? "block" : "none",
                            borderLeft: "1px solid black",
                            marginLeft: "0.3em",
                            paddingLeft: "0.3em",
                        }}>
                            <ContinuousPowerCalc value={this.continuousPower}
                                                 onChange={v => this.continuousPower = v}
                            />
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Burst:</td>
                    <td>
                        <div style={{display: 'inline', cursor: 'pointer'}}
                             onClick={(e) => this.burstPowerCalcOpen = !this.burstPowerCalcOpen}>
                            {this.burstPowerCalcOpen ? "▾" : "▸"}</div>
                        <FloatInput decimals={1} value={burstPowerValue.energy}
                                    onChange={v => this.burstPower = BurstPowerCalc.fromEnergyInterval(v, burstPowerValue.interval)}
                        />⚡ storage, <KerbalYdhmsInput
                        value={burstPowerValue.interval} singleUnit={true}
                        onChange={v => this.burstPower = BurstPowerCalc.fromEnergyInterval(burstPowerValue.energy, v)}
                    /> charge time
                        <div style={{
                            display: this.burstPowerCalcOpen ? "block" : "none",
                            borderLeft: "1px solid black",
                            marginLeft: "0.3em",
                            paddingLeft: "0.3em",
                        }}>
                            <BurstPowerCalc value={this.burstPower}
                                            onChange={v => this.burstPower = v}
                            />
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Mission duration:</td>
                    <td>
                        <KerbalYdhmsInput value={this.duration}
                                          onChange={v => this.duration = v}/>
                    </td>
                </tr>
                <tr>
                    <td>Fuel tank:</td>
                    <td>
                        <Preset options={Object.keys(fuelTanks).reduce((acc, el) => {
                            if (fuelTanks[el].content.lf > 0 && fuelTanks[el].content.ox > 0) acc[el] = el;  // only lf+ox tanks
                            return acc;
                        }, {})}
                                value={fuelTankPreset} onChange={v => this.fuelTank = v}
                        /><br/>
                        <FuelTank value={fuelTankValue} onChange={v => this.fuelTank = v}/>
                    </td>
                </tr>
                </tbody>
            </table>
            <h2>Solar situation</h2>
            Panel efficiency: <FloatInput decimals={0} value={this.solarEfficiency * 100}
                                          onChange={v => this.solarEfficiency = v / 100}
        />%, equivalent to a distance to Kerbol of <SiInput
            value={kerbolDistanceFromSolarPanelEfficiency(this.solarEfficiency)}
            onChange={d => this.solarEfficiency = solarPanelEfficiencyFromKerbolDistance(d)}
        />m <Preset options={planets.reduce((acc, p) => {
            acc[p] = orbits[p].sma;
            return acc
        }, {})}
                    value={kerbolDistanceFromSolarPanelEfficiency(this.solarEfficiency)}
                    onChange={d => this.solarEfficiency = solarPanelEfficiencyFromKerbolDistance(d)}
        /><br/>

            <div style={{display: 'inline', cursor: 'pointer'}}
                 onClick={(e) => this.shadeCalcOpen = !this.shadeCalcOpen}>
                {this.shadeCalcOpen ? "▾" : "▸"}</div>
            Account for <KerbalYdhmsInput
                value={shadeValue.duration} singleUnit={true}
                onChange={v => this.shade = ShadeCalc.custom(v, shadeValue.interval)}
            /> of shade every <KerbalYdhmsInput
                value={shadeValue.interval} singleUnit={true}
                onChange={v => this.shade = ShadeCalc.custom(shadeValue.duration, v)}
            />
            <div style={{
                display: this.shadeCalcOpen ? "block" : "none",
                borderLeft: "1px solid black",
                marginLeft: "0.3em",
                paddingLeft: "0.3em",
            }}>
                <ShadeCalc value={this.shade} onChange={v => this.shade = v}/>
            </div>
            <h2>Options</h2>
            <SortableTable columns={this.constructor.columns} data={solutions}/>
        </div>;
    }
}

if(typeof window === 'object') window.renderApp = function() {
    ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
};
