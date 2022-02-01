import ReactDOM from "react-dom";
import React from "react";
import {Resources} from "./utils/kspParts";
import {FloatInput} from "./components/formatedInput";
import {addFragmentStateProperty} from "./utils/useFragmentState";

class Mining extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            body: 'planet',  // 'planet' for planet or moon; or 'asteroid'
            oreConcentration: 0.025,  // fraction, not %
            drill: 1,
            drillJr: 0,
        }
    }

    bodyChange(e) {
        /* onChange is triggered by both old and newly selected radio button
         * So we need to actually read out the current value
         */
        this.setState({
            body: e.target.value,
        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const previous = this.calc(prevProps, prevState);
        const current = this.calc();
        const prevRate = Resources.create({el: -previous.electricalPower, ore: previous.totalOreProduction});
        const currentRate = Resources.create({el: -current.electricalPower, ore: current.totalOreProduction});
        if(!prevRate.equals(currentRate)) this.props.onRateChange(currentRate);
    }

    calc(props, state) {
        if(props === undefined) props = this.props;
        if(state === undefined) state = this.state;

        const baseRateSr = state.body === 'planet' ? 1.5 : 5.0;
        const baseRateJr = state.body === 'planet' ? 0.3 : 1.0;
        const oreRateSr = state.oreConcentration * baseRateSr;
        const oreRateJr = state.oreConcentration * baseRateJr;
        const oreRate = state.drill * oreRateSr + state.drillJr * oreRateJr;

        const thermalEfficiency = 1.00;
        const engineerMultiplier = 0.25 + 0.20 * props.engineerStars;

        const totalOreProduction = oreRate * thermalEfficiency * engineerMultiplier;

        const electricalPowerSr = state.drill * (
            state.body === 'planet' ? 15 * thermalEfficiency * engineerMultiplier : 1.5);
        const electricalPowerJr = state.drillJr * (
            state.body === 'planet' ? 3 * thermalEfficiency * engineerMultiplier : 1.5);
        // TODO: check power consumption on asteroid, not found in docs
        const electricalPower = electricalPowerSr + electricalPowerJr;

        const thermalPower = state.drill * 100 + state.drillJr * 50;

        return {
            oreRate,
            load: thermalEfficiency * engineerMultiplier * 100,
            totalOreProduction,
            electricalPower,
            thermalPower,
        }
    }

    render() {
        const {oreRate, load, totalOreProduction, electricalPower, thermalPower} = this.calc();

        return <div>
            <table><tbody>
            <tr><td>Body type:</td><td>
                <label><input type="radio" name="body_type" value="planet"
                              defaultChecked={this.state.body === 'planet'}
                              onChange={(e) => this.bodyChange(e)}
                />planet</label>
                <label><input type="radio" name="body_type" value="asteroid"
                              defaultChecked={this.state.body === 'asteroid'}
                              onChange={(e) => this.bodyChange(e)}
                />asteroid</label></td></tr>
            <tr><td>Ore concentration:</td><td>
                <FloatInput decimals={2} value={this.state.oreConcentration * 100}
                            onChange={(v) => this.setState({oreConcentration: v/100})}/>%
            </td></tr>
            <tr><td>Drill-O-Matic</td><td>
                <input type="number" value={this.state.drill}
                       onChange={(e) => this.setState({drill: parseInt(e.target.value)})}
                />
            </td></tr>
            <tr><td>Drill-O-Matic Junior</td><td>
                <input type="number" value={this.state.drillJr}
                       onChange={(e) => this.setState({drillJr: parseInt(e.target.value)})}
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
    constructor(props) {
        super(props);
        this.state = {
            convertOTron250: [{lfox: true, lf: false, ox: false, mono: false}],
            convertOTron125: [],
            limitByDrill: true,
            oreConsumptionLimit: this.props.drillOreRate,
            electricityLimit: 1000,  // "high enough"
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.state.limitByDrill) {
            if(this.state.oreConsumptionLimit !== this.props.drillOreRate) {
                this.setState({oreConsumptionLimit: this.props.drillOreRate});
            }
        }
        const {resources: prevRates} = this.calc(prevProps, prevState);
        const {resources: currentRates} = this.calc();
        if(!prevRates.equals(currentRates)) this.props.onRateChange(currentRates);
    }

    calc(props, state) {
        if(props === undefined) props = this.props;
        if(state === undefined) state = this.state;

        const engineerMultiplier = 0.25 + props.engineerStars * 0.20;

        let maxOreConsumption = 0;
        let maxElectricity = 0;
        let maxThermal = 0;
        let lfProd = 0;
        let oxProd = 0;
        let monoProd = 0;
        for(let tron of state.convertOTron250) {
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
        for(let tron of state.convertOTron125) {
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

        const oreConsumptionLimit = state.limitByDrill ? props.drillOreRate : state.oreConsumptionLimit;

        const factorForOreLimit = Math.min(1, oreConsumptionLimit / maxOreConsumption);
        const factorForElectricityLimit = Math.min(1, state.electricityLimit / maxElectricity);
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

    render() {
        const {maxResources, resources, thermal, oreConsumptionLimit,
            limitFactor, limitedBy, engineerMultiplier} = this.calc()

        return <div>
            <table border="1"><tbody>
            <tr><td>Convert-O-Tron 250</td><td>
                <ConvertOTronRecipes trons={this.state.convertOTron250}
                                     onChange={(t) => this.setState({convertOTron250: t})}
                />
            </td></tr>
            <tr><td>Convert-O-Tron 125</td><td>
                <ConvertOTronRecipes trons={this.state.convertOTron125}
                                     onChange={(t) => this.setState({convertOTron125: t})}
                />
            </td></tr>
            <tr><td>Max input</td><td>
                {(-maxResources.ore).toFixed(3)} Ore/s
                {" = "}{((-maxResources.ore)*3600).toFixed(1)} Ore/h
                {" = "}{((-maxResources.ore)*3600*6).toFixed(1)} Ore/d<br/>
                {(-maxResources.elec).toFixed(1)} ⚡/s<br/>
                {thermal} kW cooling
            </td></tr>
            <tr><td>Limit</td><td>
                <FloatInput type="number" value={oreConsumptionLimit} disabled={this.state.limitByDrill}
                            onChange={(v) => this.setState({oreConsumptionLimit: v})}
                /> Ore/s
                {" "}<label><input type="checkbox" checked={this.state.limitByDrill}
                                   onChange={(e) => this.setState({limitByDrill: e.target.checked})}
            />Drill output</label><br/>
                <input type="number" value={this.state.electricityLimit}
                       onChange={(e) => this.setState({electricityLimit: e.target.value})}
                /> ⚡/s
            </td></tr>
            <tr><td>Limited flow</td><td>
                {(engineerMultiplier*limitFactor*100).toFixed(2)} %<br/>
                {(-resources.ore).toFixed(3)} Ore/s = {((-resources.ore)*3600).toFixed(1)} Ore/h{limitedBy === 'ore' ? " (limit)" : ""}<br/>
                {(-resources.el).toFixed(3)} ⚡/s = {((-resources.el)*60).toFixed(1)} ⚡/m{limitedBy === 'elec' ? " (limit)" : ""}<br/>
                {/*{thermal.toFixed(0)} kW<br/>*/}
                {resources.lf.toFixed(3)} Lf/s = {(resources.lf*3600).toFixed(1)} Lf/h = {(resources.fuel*3600*6).toFixed(0)} Lf/d<br/>
                {resources.ox.toFixed(3)} Ox/s = {(resources.ox*3600).toFixed(1)} Ox/h = {(resources.ox*3600*6).toFixed(0)} Ox/d<br/>
                {resources.mono.toFixed(3)} Mono/s = {(resources.mono*3600).toFixed(1)} Mono/h = {(resources.mono*3600*6).toFixed(0)} Mono/d<br/>
            </td></tr>
            </tbody></table>
        </div>;
    }
}

class App extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            // pre-calculated from current default values:
            drillRates: Resources.create({el: -18.8, ore: 0.046875}),
            convertRates: Resources.create({lf: 0.057, ox: 0.070, el: -4.026, ore: -0.047}),
        };
        addFragmentStateProperty(this, 'engineerStars', 'eng', "5");
        addFragmentStateProperty(this, 'fuelCell', 'fc', false);
    }

    render() {
        const elec = - this.state.drillRates.el - this.state.convertRates.el;
        let fuel = this.state.convertRates.lf;
        let ox = this.state.convertRates.ox;

        if(this.state.fuelCell) {
            fuel -= elec * 0.00125; // 0.0016875 -> 1.5 (0.001125); 0.02025 -> 18 (0.001125)
            ox -= elec * 0.001375; // 0.0020625 -> 1.5 (0.001375); 0.02475 -> 18 (0.001375)
        }

        const engineerRadios = [];
        engineerRadios.push(<label key="-1">
            <input type="radio" name="engineer_stars" value="-1"
                   defaultChecked={this.engineerStars === '-1'}
                   onChange={(e) => this.engineerStars = e.target.value}
            />No
        </label>);
        for(let s = 0; s <= 5; s++) {
            engineerRadios.push(<label key={s}>
                <input type="radio" name="engineer_stars" value={'' + s}
                       defaultChecked={this.engineerStars === '' + s}
                       onChange={(e) => this.engineerStars = e.target.value}
                />{s}
            </label>);
        }

        return <div>
            <h1>In-Situ Resource Harvesting</h1>
            Engineer on board: {engineerRadios}
            <h2>Mining</h2>
            <Mining engineerStars={this.engineerStars}
                    onRateChange={(rates) => this.setState({drillRates: rates})}
            />
            <h2>Converting</h2>
            <Converting engineerStars={this.engineerStars}
                        drillOreRate={this.state.drillRates.ore}
                        onRateChange={(rates) => this.setState({convertRates: rates})}
            />

            <h2>Total</h2>
            <table><tbody>
            <tr><td>Electricity:</td><td>
                {elec.toFixed(1)} ⚡/s
                {" "}<label><input type="checkbox" checked={this.fuelCell}
                                   onChange={(e) => this.fuelCell = e.target.checked}
            />Provided by Fuel Cells</label>
            </td></tr>
            <tr><td>Fuel production:</td><td>
                {fuel.toFixed(3)} Lf/s = {(fuel*3600*6).toFixed(0)} Lf/d<br/>
                {ox.toFixed(3)} Ox/s = {(ox*3600*6).toFixed(0)} Ox/d<br/>
                {this.state.convertRates.mono.toFixed(3)} Mono/s = {(this.state.convertRates.mono*3600*6).toFixed(0)} Mono/d<br/>
            </td></tr>
            </tbody></table>
        </div>;
    }
}

if(typeof window === 'object') window.renderApp = function() {
    ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
};
