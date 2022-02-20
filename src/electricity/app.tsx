import * as React from "react";
import {useState} from "react";
import ReactDOM from "react-dom";
import {FloatInput, KerbalYdhmsInput, SiInput} from "../components/formatedInput";
import useFragmentState from "../utils/useFragmentState";
import Preset from "../components/preset";
import SortableTable from "../components/sortableTable";
import {planets} from "../utils/kspBody";
import {orbits} from "../utils/kspOrbit";
import {Resources} from "../utils/kspParts";
import FuelTank from "../components/fuelTank";
import {fuelTanks} from "../utils/kspParts-fuelTanks";
import {batteries, electricalGenerators, FuelCell, SolarPanel} from "../utils/kspParts-solarPanel";
import {fromPreset, objectMap} from "../utils/utils";
import {
    ContinuousPowerCalc,
    fromString as ContinuousPowerCalcFromString,
    toString as ContinuousPowerCalcToString,
    calcPowerFromDevices as calcContinuousPowerFromDevices,
    customOnly as ContinuousPowerCalcCustomOnly,
} from "./continuousPowerCalc";
import {
    BurstPowerCalc,
    fromString as BurstPowerCalcFromString,
    toString as BurstPowerCalcToString,
    calcBurstPowerFromDevices,
    fromEnergyInterval as BurstFromEnergyInterval,
} from "./burstPowerCalc";
import {
    ShadeCalc,
    fromString as ShadeCalcFromString,
    toString as ShadeCalcToString,
    calcShade,
    custom as ShadeCustom,
} from "./shadeCalc";

import {KspFund} from "../components/kspIcon";
import './app.css';

function solarPanelEfficiencyFromKerbolDistance(d) {
    return 1 / Math.pow(d/orbits.Kerbin.semiMajorAxis, 2);
}
function kerbolDistanceFromSolarPanelEfficiency(e) {
    return Math.sqrt(1/e) * orbits.Kerbin.semiMajorAxis;
}

const columns = [
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
        title: <span>Max<br/>power<br/>[⚡/m]</span>, classList: 'number',
        value: i => (i.maxPower * 60).toFixed(1),
        cmp: (a, b) => a.maxPower - b.maxPower,
    },
    {
        title: <span>Nominal<br/>power<br/>[⚡/m]</span>, classList: 'number',
        value: i => (i.nominalPower * 60).toFixed(1),
        cmp: (a, b) => a.nominalPower - b.nominalPower,
    },
    {
        title: <span>Charge<br/>(burst+darkness)<br/>[⚡/m]</span>, classList: 'number',
        value: i => `${((i.burstChargePower+i.darknessChargePower)*60).toFixed(1)} (`
            + `${(i.burstChargePower*60).toFixed(1)} + `
            + `${(i.darknessChargePower*60).toFixed(1)})`,
        cmp: (a, b) => (a.burstChargePower + a.darknessChargePower) - (b.burstChargePower + b.darknessChargePower),
    },
    {
        title: <span>Spare<br/>power<br/>[⚡/m]</span>, classList: 'number',
        value: i => ((i.maxPower-i.nominalPower)*60).toFixed(1),
        cmp: (a, b) => (a.maxPower-a.nominalPower) - (b.maxPower-b.nominalPower),
    },
    {
        title: <span>Storage<br/>available<br/>[⚡]</span>, classList: 'number',
        value: i => i.maxEnergy.toFixed(0),
        cmp: (a, b) => a.maxEnergy - b.maxEnergy,
    },
    {
        title: <span>Storage<br/>(burst+darkness)<br/>needed [⚡]</span>, classList: 'number',
        value: i => `${(i.burstBatteryEnergy + i.shadeBatteryEnergy).toFixed(0)} (`
            + `${i.burstBatteryEnergy.toFixed(0)} + `
            + `${i.shadeBatteryEnergy.toFixed(0)})`,
        cmp: (a, b) => (a.burstBatteryEnergy + a.shadeBatteryEnergy) - (b.burstBatteryEnergy + b.shadeBatteryEnergy),
    },
];

type Solution = {
    config,
    cost: number,
    mass: number,
    maxPower: number,
    maxEnergy: number,
    shadeBatteryEnergy: number,
    burstBatteryEnergy: number,
    nominalPower: number,
    burstChargePower: number,
    darknessChargePower: number,
};

// Only use Z-100 batteries. Other batteries have same energy/mass ratio, but have higher cost/energy ratio
const batteryName = "Z-100";
const battery = batteries[batteryName];

function solarPanelSolutions(shadeValue, continuousPowerValue, burstPowerValue, solarEfficiency: number): Solution[] {
    const solutions: Solution[] = [];
    let panelName: any;
    for (panelName in electricalGenerators) {
        const panel = electricalGenerators[panelName];
        if (!(panel instanceof SolarPanel)) continue;

        const burstChargePower = burstPowerValue.energy / burstPowerValue.interval;
        const shadeEnergy = shadeValue.duration * (continuousPowerValue + burstChargePower);
        const lightDuration = shadeValue.interval - shadeValue.duration;
        const shadeChargePower = shadeEnergy / lightDuration;
        const neededPowerDuringLight = continuousPowerValue + burstChargePower + shadeChargePower;
        const panelPower = (-panel.consumption.el) * solarEfficiency;
        const numDev = Math.ceil(neededPowerDuringLight / panelPower);
        const batteryEnergy = shadeEnergy + burstPowerValue.energy;
        const numBatteries = Math.ceil(batteryEnergy / battery.content.el);
        if (panel.wikiUrl !== undefined) {
            panelName = <a href={panel.wikiUrl}>{panelName}</a>;
        }
        let batteryNameJsx: any = batteryName;
        if(battery.wikiUrl !== undefined) {
            batteryNameJsx = <a href={battery.wikiUrl}>{batteryNameJsx}</a>;
        }
        solutions.push({
            config: <span>{numDev} × {panelName} + {numBatteries} × {batteryNameJsx}</span>,
            cost: numDev * panel.cost + numBatteries * batteries["Z-100"].cost,
            mass: numDev * panel.mass + numBatteries * batteries["Z-100"].mass,
            maxPower: numDev * panelPower,
            maxEnergy: numBatteries * battery.content.el,
            shadeBatteryEnergy: shadeEnergy,
            burstBatteryEnergy: burstPowerValue.energy,
            nominalPower: neededPowerDuringLight,
            burstChargePower: burstChargePower,
            darknessChargePower: shadeChargePower,
        });
    }
    return solutions;
}

function fuelCellSolutions(burstPowerValue, continuousPowerValue, fuelTankValue, missionDuration): Solution[] {
    const solutions: Solution[] = [];
    let cellName: any;
    for (cellName in electricalGenerators) {
        const cell = electricalGenerators[cellName];
        if (!(cell instanceof FuelCell)) continue;

        const burstChargePower = burstPowerValue.energy / burstPowerValue.interval;
        const neededPower = continuousPowerValue + burstChargePower;
        const numDev = Math.ceil(neededPower / (-cell.consumption.el));
        const numBatteries = Math.max(0, Math.ceil((burstPowerValue.energy - numDev * cell.content.el) / batteries['Z-100'].content.el));
        const totalEnergy = neededPower * missionDuration;
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
        let batteryNameJsx: any = batteryName;
        if(battery.wikiUrl !== undefined) {
            batteryNameJsx = <a href={battery.wikiUrl}>{batteryNameJsx}</a>;
        }
        solutions.push({
            config:
                <span>{numDev} × {cellName} + {numBatteries} × {batteryNameJsx} + {neededTankMass.toFixed(1)}t fuel tanks</span>,
            cost: numDev * cell.cost + numBatteries * batteries["Z-100"].cost + neededFuelMass * fuelTankValue.cost,
            mass: numDev * cell.mass + numBatteries * batteries["Z-100"].mass + neededFuelMass,
            maxPower: numDev * (-cell.consumption.el),
            maxEnergy: numDev * cell.content.el + numBatteries * battery.content.el,
            shadeBatteryEnergy: 0,
            burstBatteryEnergy: burstPowerValue.energy,
            nominalPower: neededPower,
            burstChargePower: burstChargePower,
            darknessChargePower: 0,
        });
    }
    return solutions;
}

function rtgSolutions(burstPowerValue, continuousPowerValue): Solution[] {
    const solutions: Solution[] = [];
    const dev = electricalGenerators["PB-NUK Radioisotope Thermoelectric Generator"];
    const burstCharge = burstPowerValue.energy / burstPowerValue.interval;
    const neededPower = continuousPowerValue + burstCharge;
    const numDev = Math.ceil(neededPower / (-dev.consumption.el));
    const numBatteries = Math.ceil(burstPowerValue.energy / batteries['Z-100'].content.el);
    let genName: any = 'PB-NUK';
    if (dev.wikiUrl !== undefined) {
        genName = <a href={dev.wikiUrl}>{genName}</a>;
    }
    let batteryNameJsx: any = batteryName;
    if(battery.wikiUrl !== undefined) {
        batteryNameJsx = <a href={battery.wikiUrl}>{batteryNameJsx}</a>;
    }
    solutions.push({
        config: <span>{numDev} × {genName} + {numBatteries} × {batteryNameJsx}</span>,
        cost: numDev * dev.cost + numBatteries * batteries["Z-100"].cost,
        mass: numDev * dev.mass + numBatteries * batteries["Z-100"].mass,
        maxPower: numDev * (-dev.consumption.el),
        maxEnergy: numBatteries * battery.content.el,
        shadeBatteryEnergy: 0,
        burstBatteryEnergy: burstPowerValue.energy,
        nominalPower: continuousPowerValue + burstCharge,
        burstChargePower: burstCharge,
        darknessChargePower: 0,
    });
    return solutions;
}

export default function App() {
    const [continuousPower, setContinuousPower] = useFragmentState('c', ContinuousPowerCalcFromString, ContinuousPowerCalcToString);
    const [continuousPowerCalcOpen, setContinuousPowerCalcOpen] = useState(false);
    const [burstPower, setBurstPower] = useFragmentState('b', BurstPowerCalcFromString, BurstPowerCalcToString);
    const [burstPowerCalcOpen, setBurstPowerCalcOpen] = useState(false);
    const [missionDuration, setMissionDuration] = useFragmentState('d', 10 * 6 * 60 * 60);
    const [fuelTank, setFuelTank] = useFragmentState('ft', {fullEmptyRatio: 8.69, cost: 233.50});
    const [solarEfficiency, setSolarEfficiency] = useFragmentState('s', 1.00);
    const [shade, setShade] = useFragmentState('S', ShadeCalcFromString, ShadeCalcToString);
    const [shadeCalcOpen, setShadeCalcOpen] = useState(false);

    const continuousPowerValue = calcContinuousPowerFromDevices(continuousPower);
    const burstPowerValue = calcBurstPowerFromDevices(burstPower);
    const shadeValue = calcShade(shade);
    const {value: fuelTankValue, preset: fuelTankPreset} = fromPreset(
        fuelTank, objectMap(fuelTanks, (ft) => {
            return {fullEmptyRatio: ft.mass / ft.emptied().mass, cost: ft.cost / ft.mass}
        })
    );

    const solutions = [];
    solutions.push(...solarPanelSolutions(shadeValue, continuousPowerValue, burstPowerValue, solarEfficiency));
    solutions.push(...fuelCellSolutions(burstPowerValue, continuousPowerValue, fuelTankValue, missionDuration));
    solutions.push(...rtgSolutions(burstPowerValue, continuousPowerValue));

    return <div>
        <h1>Electricity options</h1>
        <h2>Requirements</h2>
        <table>
            <tbody>
            <tr>
                <td>Continuous:</td>
                <td>
                    <div style={{display: 'inline', cursor: 'pointer'}}
                         onClick={() => setContinuousPowerCalcOpen(!continuousPowerCalcOpen)}>
                        {continuousPowerCalcOpen ? "▾" : "▸"}</div>
                    <FloatInput decimals={1} value={continuousPowerValue}
                                onChange={v => setContinuousPower(ContinuousPowerCalcCustomOnly(v))}
                    />⚡/s
                    {" = "}
                    <FloatInput decimals={1} value={continuousPowerValue * 60}
                                onChange={v => setContinuousPower(ContinuousPowerCalcCustomOnly(v / 60))}
                    />⚡/m
                    {" = "}
                    <FloatInput decimals={1} value={continuousPowerValue * 60 * 60}
                                onChange={v => setContinuousPower(ContinuousPowerCalcCustomOnly(v / 60 / 60))}
                    />⚡/h<br/>
                    <div style={{
                        display: continuousPowerCalcOpen ? "block" : "none",
                        borderLeft: "1px solid black",
                        marginLeft: "0.3em",
                        paddingLeft: "0.3em",
                    }}>
                        <ContinuousPowerCalc value={continuousPower}
                                             onChange={v => setContinuousPower(v)}
                        />
                    </div>
                </td>
            </tr>
            <tr>
                <td>Burst:</td>
                <td>
                    <div style={{display: 'inline', cursor: 'pointer'}}
                         onClick={() => setBurstPowerCalcOpen(!burstPowerCalcOpen)}>
                        {burstPowerCalcOpen ? "▾" : "▸"}</div>
                    <FloatInput decimals={1} value={burstPowerValue.energy}
                                onChange={v => setBurstPower(BurstFromEnergyInterval(v, burstPowerValue.interval))}
                    />⚡ storage, <KerbalYdhmsInput
                    value={burstPowerValue.interval} singleUnit={true}
                    onChange={v => setBurstPower(BurstFromEnergyInterval(burstPowerValue.energy, v))}
                /> charge time
                    <div style={{
                        display: burstPowerCalcOpen ? "block" : "none",
                        borderLeft: "1px solid black",
                        marginLeft: "0.3em",
                        paddingLeft: "0.3em",
                    }}>
                        <BurstPowerCalc value={burstPower}
                                        onChange={v => setBurstPower(v)}
                        />
                    </div>
                </td>
            </tr>
        </tbody></table>
        <h2>Solar situation</h2>
        Panel efficiency: <FloatInput decimals={0} value={solarEfficiency * 100}
                                      onChange={v => setSolarEfficiency(v / 100)}
        />%, equivalent to a distance to Kerbol of <SiInput
            value={kerbolDistanceFromSolarPanelEfficiency(solarEfficiency)}
            onChange={d => setSolarEfficiency(solarPanelEfficiencyFromKerbolDistance(d))}
        />m <Preset options={planets.reduce((acc, p) => {
            acc[p] = orbits[p].semiMajorAxis;
            return acc
        }, {})}
                    value={kerbolDistanceFromSolarPanelEfficiency(solarEfficiency)}
                    onChange={d => setSolarEfficiency(solarPanelEfficiencyFromKerbolDistance(d))}
        /><br/>

        <div style={{display: 'inline', cursor: 'pointer'}}
             onClick={() => setShadeCalcOpen(!shadeCalcOpen)}>
            {shadeCalcOpen ? "▾" : "▸"}</div>
        Account for <KerbalYdhmsInput
            value={shadeValue.duration} singleUnit={true}
            onChange={v => setShade(ShadeCustom(v, shadeValue.interval))}
        /> of shade every <KerbalYdhmsInput
            value={shadeValue.interval} singleUnit={true}
            onChange={v => setShade(ShadeCustom(shadeValue.duration, v))}
        />
        <div style={{
            display: shadeCalcOpen ? "block" : "none",
            borderLeft: "1px solid black",
            marginLeft: "0.3em",
            paddingLeft: "0.3em",
        }}>
            <ShadeCalc value={shade} onChange={v => setShade(v)}/>
        </div>
        <h2>Info for fuel cells</h2>
        <table><tbody>
            <tr>
                <td>Mission duration:</td>
                <td>
                    <KerbalYdhmsInput value={missionDuration}
                                      onChange={v => setMissionDuration(v)}/>
                </td>
            </tr>
            <tr>
                <td>Fuel tank:</td>
                <td>
                    <Preset options={Object.keys(fuelTanks).reduce((acc, el) => {
                        if (fuelTanks[el].content.lf > 0 && fuelTanks[el].content.ox > 0) acc[el] = el;  // only lf+ox tanks
                        return acc;
                    }, {})}
                            value={fuelTankPreset} onChange={v => setFuelTank(v)}
                    /><br/>
                    <FuelTank value={fuelTankValue} onChange={v => setFuelTank(v)}/>
                </td>
            </tr>
            </tbody>
        </table>
        <h2>Options</h2>
        <SortableTable columns={columns} data={solutions}/>
    </div>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
    };
}
