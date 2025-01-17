import * as React from "react";
import {FloatInput} from "formattedInput";

export class Mining extends React.PureComponent {
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
            <table>
                <tbody>
                <tr>
                    <td>Body type:</td>
                    <td>
                        <label><input type="radio" name="body_type" value="planet"
                                      defaultChecked={value.body === 'planet'}
                                      onChange={(e) => this.updateValue({body: e.target.value})}
                        />planet</label>
                        <label><input type="radio" name="body_type" value="asteroid"
                                      defaultChecked={value.body === 'asteroid'}
                                      onChange={(e) => this.updateValue({body: e.target.value})}
                        />asteroid</label></td>
                </tr>
                <tr>
                    <td>Ore concentration:</td>
                    <td>
                        <FloatInput decimals={2} value={value.oreConcentration * 100}
                                    onChange={(v) => this.updateValue({oreConcentration: v / 100})}/>%
                    </td>
                </tr>
                <tr>
                    <td>Drill-O-Matic</td>
                    <td>
                        <input type="number" value={value.drill}
                               onChange={(e) => this.updateValue({drill: parseInt(e.target.value)})}
                        />
                    </td>
                </tr>
                <tr>
                    <td>Drill-O-Matic Junior</td>
                    <td>
                        <input type="number" value={value.drillJr}
                               onChange={(e) => this.updateValue({drillJr: parseInt(e.target.value)})}
                        />
                    </td>
                </tr>
                <tr>
                    <td>Ore rate</td>
                    <td>{oreRate.toFixed(3)} Ore/s</td>
                </tr>
                <tr>
                    <td>Load</td>
                    <td>{load.toFixed(2)} %</td>
                </tr>
                <tr>
                    <td>Ore production</td>
                    <td>{totalOreProduction.toFixed(3)} Ore/s
                        {" = "}{(totalOreProduction * 3600).toFixed(1)} Ore/h
                        {" = "}{(totalOreProduction * 3600 * 6).toFixed(1)} Ore/d
                    </td>
                </tr>
                <tr>
                    <td>Electrical power</td>
                    <td>{electricalPower.toFixed(1)} ⚡/s</td>
                </tr>
                <tr>
                    <td>Thermal power</td>
                    <td>{thermalPower} kW</td>
                </tr>

                </tbody>
            </table>
        </div>;
    }
}