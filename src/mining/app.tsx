import ReactDOM from "react-dom";
import * as React from "react";
import {Resources} from "../utils/kspParts";
import {FloatInput} from "formattedInput";
import useFragmentState from "useFragmentState";

class Mining extends React.PureComponent {
    static defaultValue = {
        body: 'planet',  // 'planet' for planet or moon; or 'asteroid'
        oreConcentration: 0.025,  // fraction, not %
        drill: 1,
        drillJr: 0,
    };
    static defaultProps = {
        engineerStars: 5,  // -1 (no), 0-5 stars
        value: this.defaultValue,
        onChange: (newValue) => null,
    }

    static calc(engineerStars, value) {
        const baseRateSr = value.body === 'planet' ? 1.5 : 5.0;
        const baseRateJr = value.body === 'planet' ? 0.3 : 1.0;
        const oreRateSr = value.oreConcentration * baseRateSr;
        const oreRateJr = value.oreConcentration * baseRateJr;
        const oreRate = value.drill * oreRateSr + value.drillJr * oreRateJr;

        const thermalEfficiency = 1.00;
        const engineerMultiplier = 0.25 + 0.20 * engineerStars;

        const totalOreProduction = oreRate * thermalEfficiency * engineerMultiplier;

        const electricalPowerSr = value.drill * (
            value.body === 'planet' ? 15 * thermalEfficiency * engineerMultiplier : 1.5);
        const electricalPowerJr = value.drillJr * (
            value.body === 'planet' ? 3 * thermalEfficiency * engineerMultiplier : 1.5);
        // TODO: check power consumption on asteroid, not found in docs
        const electricalPower = electricalPowerSr + electricalPowerJr;

        const thermalPower = value.drill * 100 + value.drillJr * 50;

        return {
            oreRate,
            load: thermalEfficiency * engineerMultiplier * 100,
            totalOreProduction,
            electricalPower,
            thermalPower,
        }
    }

    updateValue(obj) {
        this.props.onChange(Object.assign({}, this.props.value, obj));
    }

    render() {
        const value = this.props.value;
        const {oreRate, load, totalOreProduction, electricalPower, thermalPower}
            = this.constructor.calc(this.props.engineerStars, value);

        return <div>
            <table><tbody>
            <tr><td>Body type:</td><td>
                <label><input type="radio" name="body_type" value="planet"
                              defaultChecked={value.body === 'planet'}
                              onChange={(e) => this.updateValue({body: e.target.value})}
                />planet</label>
                <label><input type="radio" name="body_type" value="asteroid"
                              defaultChecked={value.body === 'asteroid'}
                              onChange={(e) => this.updateValue({body: e.target.value})}
                />asteroid</label></td></tr>
            <tr><td>Ore concentration:</td><td>
                <FloatInput decimals={2} value={value.oreConcentration * 100}
                            onChange={(v) => this.updateValue({oreConcentration: v/100})}/>%
            </td></tr>
            <tr><td>Drill-O-Matic</td><td>
                <input type="number" value={value.drill}
                       onChange={(e) => this.updateValue({drill: parseInt(e.target.value)})}
                />
            </td></tr>
            <tr><td>Drill-O-Matic Junior</td><td>
                <input type="number" value={value.drillJr}
                       onChange={(e) => this.updateValue({drillJr: parseInt(e.target.value)})}
                />
            </td></tr>
            <tr><td>Ore rate</td><td>{oreRate.toFixed(3)} Ore/s</td></tr>
            <tr><td>Load</td><td>{load.toFixed(2)} %</td></tr>
            <tr><td>Ore production</td><td>{totalOreProduction.toFixed(3)} Ore/s
                {" = "}{(totalOreProduction*3600).toFixed(1)} Ore/h
                {" = "}{(totalOreProduction*3600*6).toFixed(1)} Ore/d</td></tr>
            <tr><td>Electrical power</td><td>{electricalPower.toFixed(1)} ⚡/s</td></tr>
            <tr><td>Thermal power</td><td>{thermalPower} kW</td></tr>

            </tbody></table>
        </div>;
    }
}

class ConvertOTronRecipes extends React.PureComponent {
    addTron() {
        const trons = this.props.trons.slice();  // create copy to keep original immutable
        trons.push({lfox: false, lf: false, ox: false, mono: false})
        this.props.onChange(trons);
    }

    removeTron(tronNr) {
        const trons = this.props.trons.slice();  // create copy to keep original immutable
        trons.splice(tronNr, 1);
        this.props.onChange(trons);
    }

    switchRecipe(tronNr, rcp, value) {
        const trons = this.props.trons.slice();  // create copy
        const tron = {};
        Object.assign(tron, trons[tronNr]);  // copy
        trons[tronNr] = tron;
        trons[tronNr][rcp] = value;
        this.props.onChange(trons);
    }

    render() {
        const convertOTrons = [];
        for(let tronNr in this.props.trons) {
            const tron = this.props.trons[tronNr];
            convertOTrons.push(<div key={tronNr}>
                <label key="lfox"><input type="checkbox" checked={tron.lfox}
                                         onChange={(e) => this.switchRecipe(tronNr, 'lfox', e.target.checked)}
                />Lf+Ox</label>
                <label key="mono"><input type="checkbox" checked={tron.mono}
                                         onChange={(e) => this.switchRecipe(tronNr, 'mono', e.target.checked)}
                />Mono</label>
                <label key="lf"><input type="checkbox" checked={tron.lf}
                                       onChange={(e) => this.switchRecipe(tronNr, 'lf', e.target.checked)}
                />Lf</label>
                <label key="ox"><input type="checkbox" checked={tron.ox}
                                       onChange={(e) => this.switchRecipe(tronNr, 'ox', e.target.checked)}
                />Ox</label>
                <input type="button" value="-" onClick={() => this.removeTron(tronNr)} />
                <br/>
            </div>);
        }

        return <div>
            {convertOTrons}
            <input type="button" value="+"
                   onClick={() => this.addTron()}
            />
        </div>
    }
}

class Converting extends React.PureComponent {
    static defaultValue = {
        convertOTron250: [{lfox: true, lf: false, ox: false, mono: false}],
        convertOTron125: [],
        limitByDrill: true,
        electricityLimit: 1000,  // "high enough"
    };
    static defaultProps = {
        engineerStars: -1,  // -1 (no), 0-5
        drillOreRate: 1,
        value: this.defaultValue,
        onChange: (newValue) => null,
    }

    static calc(engineerStars, drillOreRate, value) {
        const engineerMultiplier = 0.25 + engineerStars * 0.20;

        let maxOreConsumption = 0;
        let maxElectricity = 0;
        let maxThermal = 0;
        let lfProd = 0;
        let oxProd = 0;
        let monoProd = 0;
        for(let tron of value.convertOTron250) {
            let somethingActive = false;
            if(tron.lfox) {
                maxOreConsumption += 0.5 * engineerMultiplier;
                maxElectricity += 30 * engineerMultiplier;
                lfProd += 0.45 * engineerMultiplier;
                oxProd += 0.55 * engineerMultiplier;
                somethingActive = true;
            }
            if(tron.lf) {
                maxOreConsumption += 0.45 * engineerMultiplier;
                maxElectricity += 30 * engineerMultiplier;
                lfProd += 0.9 * engineerMultiplier;
                somethingActive = true;
            }
            if(tron.ox) {
                maxOreConsumption += 0.55 * engineerMultiplier;
                maxElectricity += 30 * engineerMultiplier;
                oxProd += 1.1 * engineerMultiplier;
                somethingActive = true;
            }
            if(tron.mono) {
                maxOreConsumption += 0.5 * engineerMultiplier;
                maxElectricity += 30 * engineerMultiplier;
                monoProd += 1.0 * engineerMultiplier;
                somethingActive = true;
            }
            if(somethingActive) {
                maxThermal += 200;
            }
        }
        for(let tron of value.convertOTron125) {
            let somethingActive = false;
            if(tron.lfox) {
                maxOreConsumption += 2.5 * engineerMultiplier;
                maxElectricity += 30  * engineerMultiplier;
                lfProd += 0.225 * engineerMultiplier;
                oxProd += 0.275 * engineerMultiplier;
                somethingActive = true;
            }
            if(tron.lf) {
                maxOreConsumption += 2.25 * engineerMultiplier;
                maxElectricity += 30  * engineerMultiplier;
                lfProd += 0.45 * engineerMultiplier;
                somethingActive = true;
            }
            if(tron.ox) {
                maxOreConsumption += 2.75 * engineerMultiplier;
                maxElectricity += 30  * engineerMultiplier;
                oxProd += 0.55 * engineerMultiplier;
                somethingActive = true;
            }
            if(tron.mono) {
                maxOreConsumption += 2.5 * engineerMultiplier;
                maxElectricity += 30  * engineerMultiplier;
                monoProd += 0.5 * engineerMultiplier;
                somethingActive = true;
            }
            if(somethingActive) {
                maxThermal += 100;
            }
        }

        const oreConsumptionLimit = value.limitByDrill ? drillOreRate : value.oreConsumptionLimit;

        const factorForOreLimit = Math.min(1, oreConsumptionLimit / maxOreConsumption);
        const factorForElectricityLimit = Math.min(1, value.electricityLimit / maxElectricity);
        let limitFactor, limitedBy = 'none';
        if(factorForOreLimit < factorForElectricityLimit) {
            limitFactor = factorForOreLimit;
            if(factorForOreLimit < 1) limitedBy = 'ore';
        } else {
            limitFactor = factorForElectricityLimit;
            if(factorForElectricityLimit < 1) limitedBy = 'elec';
        }
        const oreCons = maxOreConsumption * limitFactor;
        lfProd *= limitFactor;
        oxProd *= limitFactor;
        monoProd *= limitFactor;
        const elecCons = maxElectricity * limitFactor;
        const thermal = maxThermal;

        return {
            maxResources: Resources.create({el: -maxElectricity, ore: -maxOreConsumption}),
            resources: Resources.create({lf: lfProd, ox: oxProd, mono: monoProd, el: -elecCons, ore: -oreCons}),
            thermal,
            oreConsumptionLimit,
            limitFactor,
            limitedBy,
            engineerMultiplier,
        }
    }

    updateValue(obj) {
        this.props.onChange(Object.assign({}, this.props.value, obj));
    }

    render() {
        const value = this.props.value;
        const {maxResources, resources, thermal, oreConsumptionLimit,
            limitFactor, limitedBy, engineerMultiplier} = this.constructor.calc(
                this.props.engineerStars,
                this.props.drillOreRate,
                value,
        );

        return <div>
            <table border="1"><tbody>
            <tr><td>Convert-O-Tron 250</td><td>
                <ConvertOTronRecipes trons={value.convertOTron250}
                                     onChange={t => this.updateValue({convertOTron250: t})}
                />
            </td></tr>
            <tr><td>Convert-O-Tron 125</td><td>
                <ConvertOTronRecipes trons={value.convertOTron125}
                                     onChange={t => this.updateValue({convertOTron125: t})}
                />
            </td></tr>
            <tr><td>Max input</td><td>
                {(-maxResources.ore).toFixed(3)} Ore/s
                {" = "}{((-maxResources.ore)*3600).toFixed(1)} Ore/h
                {" = "}{((-maxResources.ore)*3600*6).toFixed(1)} Ore/d<br/>
                {(-maxResources.el).toFixed(1)} ⚡/s<br/>
                {thermal} kW cooling
            </td></tr>
            <tr><td>Limit</td><td>
                <FloatInput type="number" value={oreConsumptionLimit} disabled={value.limitByDrill}
                            onChange={(v) => this.updateValue({oreConsumptionLimit: v})}
                /> Ore/s
                {" "}<label><input type="checkbox" checked={value.limitByDrill}
                                   onChange={(e) => this.updateValue({limitByDrill: e.target.checked})}
            />Drill output</label><br/>
                <input type="number" value={value.electricityLimit}
                       onChange={(e) => this.updateValue({electricityLimit: e.target.value})}
                /> ⚡/s
            </td></tr>
            <tr><td>Limited flow</td><td>
                {(engineerMultiplier*limitFactor*100).toFixed(2)} %<br/>
                {(-resources.ore).toFixed(3)} Ore/s = {((-resources.ore)*3600).toFixed(1)} Ore/h{limitedBy === 'ore' ? " (limit)" : ""}<br/>
                {(-resources.el).toFixed(3)} ⚡/s = {((-resources.el)*60).toFixed(1)} ⚡/m{limitedBy === 'elec' ? " (limit)" : ""}<br/>
                {/*{thermal.toFixed(0)} kW<br/>*/}
                {resources.lf.toFixed(3)} Lf/s = {(resources.lf*3600).toFixed(1)} Lf/h = {(resources.lf*3600*6).toFixed(0)} Lf/d<br/>
                {resources.ox.toFixed(3)} Ox/s = {(resources.ox*3600).toFixed(1)} Ox/h = {(resources.ox*3600*6).toFixed(0)} Ox/d<br/>
                {resources.mono.toFixed(3)} Mono/s = {(resources.mono*3600).toFixed(1)} Mono/h = {(resources.mono*3600*6).toFixed(0)} Mono/d<br/>
            </td></tr>
            </tbody></table>
        </div>;
    }
}

function App() {
    const [engineerStars, setEngineerStars] = useFragmentState<number>('eng', 5)
    const [mining, setMining] = useFragmentState('m', Mining.defaultValue)
    const [converting, setConverting] = useFragmentState('c', Converting.defaultValue)
    const [fuelCell, setFuelCell] = useFragmentState<boolean>('fc', false)

    const drill = Mining.calc(engineerStars, mining)
    const convert = Converting.calc(engineerStars, drill.totalOreProduction, converting)

    const elec = drill.electricalPower - convert.resources.el
    let fuel = convert.resources.lf
    let ox = convert.resources.ox

    if(fuelCell) {
        fuel -= elec * 0.00125  // 0.0016875 -> 1.5 (0.001125); 0.02025 -> 18 (0.001125)
        ox -= elec * 0.001375  // 0.0020625 -> 1.5 (0.001375); 0.02475 -> 18 (0.001375)
    }

    const engineerRadios = []
    engineerRadios.push(<label key="-1">
        <input type="radio" name="engineer_stars" value="-1"
               defaultChecked={engineerStars === -1}
               onChange={(e) => setEngineerStars(parseInt(e.target.value))}
        />No
    </label>)
    for(let s = 0; s <= 5; s++) {
        engineerRadios.push(<label key={s}>
            <input type="radio" name="engineer_stars" value={'' + s}
                   defaultChecked={engineerStars === s}
                   onChange={(e) => setEngineerStars(parseInt(e.target.value))}
            />{s}{" "}
        </label>)
    }

    return <div>
        <h1>In-Situ Resource Harvesting</h1>
        Engineer on board: {engineerRadios}
        <h2>Mining</h2>
        <Mining engineerStars={engineerStars}
                value={mining}
                onChange={v => setMining(v)}
        />
        <h2>Converting</h2>
        <Converting engineerStars={engineerStars}
                    drillOreRate={drill.totalOreProduction}
                    value={converting}
                    onChange={v => setConverting(v)}
        />

        <h2>Total</h2>
        <table><tbody>
        <tr><td>Electricity:</td><td>
            {elec.toFixed(1)} ⚡/s
            {" "}<label><input type="checkbox" checked={fuelCell}
                               onChange={(e) => setFuelCell(e.target.checked)}
        />Provided by Fuel Cells</label>
        </td></tr>
        <tr><td>Fuel production:</td><td>
            {fuel.toFixed(3)} Lf/s = {(fuel*3600*6).toFixed(0)} Lf/d<br/>
            {ox.toFixed(3)} Ox/s = {(ox*3600*6).toFixed(0)} Ox/d<br/>
            {convert.resources.mono.toFixed(3)} Mono/s = {(convert.resources.mono*3600*6).toFixed(0)} Mono/d<br/>
        </td></tr>
        </tbody></table>
    </div>
}

if(typeof window === 'object') {   // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'))
    }
}
