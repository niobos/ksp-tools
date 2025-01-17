import * as React from "react";
import {Resources} from "../utils/kspParts";
import {ConvertOTronRecipes, activeRecipes} from "./convertOTronRecipes";
import {FloatInput} from "formattedInput";

export type ValueType = {
    convertOTron250: Array<activeRecipes>
    convertOTron125: Array<activeRecipes>
    oreConsumptionLimit: number | null  // null: limit by drill
    electricityLimit: number
}

export interface ConvertingProps {
    engineerStars: number
    drillOreRate: number
    value: ValueType
    onChange: (newValue: ValueType) => void
}

export function fromString(s: string): ValueType {
    const defaultValue: ValueType = {
        convertOTron250: [{lfox: true, lf: false, ox: false, mono: false}],
        convertOTron125: [],
        oreConsumptionLimit: null,
        electricityLimit: 1000,  // "high enough"
    };
    if (s === null || s === undefined) return defaultValue;
    try {
        return JSON.parse(s);
    } catch (e) {
        return defaultValue;
    }
}
export function toString(v: ValueType): string {
    return JSON.stringify(v)
}

export function calc(engineerStars, drillOreRate, value) {
    const engineerMultiplier = 0.25 + engineerStars * 0.20

    let maxOreConsumption = 0
    let maxElectricity = 0
    let maxThermal = 0
    let lfProd = 0
    let oxProd = 0
    let monoProd = 0
    for (let tron of value.convertOTron250) {
        let somethingActive = false
        if (tron.lfox) {
            maxOreConsumption += 0.5 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            lfProd += 0.45 * engineerMultiplier
            oxProd += 0.55 * engineerMultiplier
            somethingActive = true
        }
        if (tron.lf) {
            maxOreConsumption += 0.45 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            lfProd += 0.9 * engineerMultiplier
            somethingActive = true
        }
        if (tron.ox) {
            maxOreConsumption += 0.55 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            oxProd += 1.1 * engineerMultiplier
            somethingActive = true
        }
        if (tron.mono) {
            maxOreConsumption += 0.5 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            monoProd += 1.0 * engineerMultiplier
            somethingActive = true
        }
        if (somethingActive) {
            maxThermal += 200
        }
    }
    for (let tron of value.convertOTron125) {
        let somethingActive = false
        if (tron.lfox) {
            maxOreConsumption += 2.5 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            lfProd += 0.225 * engineerMultiplier
            oxProd += 0.275 * engineerMultiplier
            somethingActive = true
        }
        if (tron.lf) {
            maxOreConsumption += 2.25 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            lfProd += 0.45 * engineerMultiplier
            somethingActive = true
        }
        if (tron.ox) {
            maxOreConsumption += 2.75 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            oxProd += 0.55 * engineerMultiplier
            somethingActive = true
        }
        if (tron.mono) {
            maxOreConsumption += 2.5 * engineerMultiplier
            maxElectricity += 30 * engineerMultiplier
            monoProd += 0.5 * engineerMultiplier
            somethingActive = true
        }
        if (somethingActive) {
            maxThermal += 100
        }
    }

    const oreConsumptionLimit = value.oreConsumptionLimit == null ? drillOreRate : value.oreConsumptionLimit

    const factorForOreLimit = Math.min(1, oreConsumptionLimit / maxOreConsumption)
    const factorForElectricityLimit = Math.min(1, value.electricityLimit / maxElectricity)
    let limitFactor, limitedBy = 'none'
    if (factorForOreLimit < factorForElectricityLimit) {
        limitFactor = factorForOreLimit
        if (factorForOreLimit < 1) limitedBy = 'ore'
    } else {
        limitFactor = factorForElectricityLimit
        if (factorForElectricityLimit < 1) limitedBy = 'elec'
    }
    const oreCons = maxOreConsumption * limitFactor
    lfProd *= limitFactor
    oxProd *= limitFactor
    monoProd *= limitFactor
    const elecCons = maxElectricity * limitFactor
    const thermal = maxThermal

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

export function Converting(props: ConvertingProps) {
    const value = props.value
    const {
        maxResources, resources, thermal, oreConsumptionLimit,
        limitFactor, limitedBy, engineerMultiplier
    } = calc(
        props.engineerStars,
        props.drillOreRate,
        value,
    )

    return <div>
        <table border={1}>
            <tbody>
            <tr>
                <td>Convert-O-Tron 250</td>
                <td>
                    <ConvertOTronRecipes trons={value.convertOTron250}
                                         onChange={t => props.onChange({...props.value, convertOTron250: t})}
                    />
                </td>
            </tr>
            <tr>
                <td>Convert-O-Tron 125</td>
                <td>
                    <ConvertOTronRecipes trons={value.convertOTron125}
                                         onChange={t => props.onChange({...props.value, convertOTron125: t})}
                    />
                </td>
            </tr>
            <tr>
                <td>Max input</td>
                <td>
                    {(-maxResources.ore).toFixed(3)} Ore/s
                    {" = "}{((-maxResources.ore) * 3600).toFixed(1)} Ore/h
                    {" = "}{((-maxResources.ore) * 3600 * 6).toFixed(1)} Ore/d<br/>
                    {(-maxResources.el).toFixed(1)} ⚡/s<br/>
                    {thermal} kW cooling
                </td>
            </tr>
            <tr>
                <td>Limit</td>
                <td>
                    <FloatInput value={oreConsumptionLimit} disabled={value.oreConsumptionLimit == null}
                                onChange={(v) => props.onChange({...props.value, oreConsumptionLimit: v})}
                    /> Ore/s
                    {" "}<label><input type="checkbox" checked={value.oreConsumptionLimit == null}
                                       onChange={(e) => {
                                           if(e.target.checked) {
                                               props.onChange({...props.value, oreConsumptionLimit: null})
                                           } else {
                                               props.onChange({...props.value, oreConsumptionLimit: oreConsumptionLimit})
                                           }
                                       }}
                />Drill output</label><br/>
                    <FloatInput decimals={1}
                                value={value.electricityLimit}
                                onChange={(v) => props.onChange({...props.value, electricityLimit: v})}
                    /> ⚡/s
                </td>
            </tr>
            <tr>
                <td>Limited flow</td>
                <td>
                    {(engineerMultiplier * limitFactor * 100).toFixed(2)} %<br/>
                    {(-resources.ore).toFixed(3)} Ore/s
                    = {((-resources.ore) * 3600).toFixed(1)} Ore/h{limitedBy === 'ore' ? " (limit)" : ""}<br/>
                    {(-resources.el).toFixed(3)} ⚡/s
                    = {((-resources.el) * 60).toFixed(1)} ⚡/m{limitedBy === 'elec' ? " (limit)" : ""}<br/>
                    {/*{thermal.toFixed(0)} kW<br/>*/}
                    {resources.lf.toFixed(3)} Lf/s = {(resources.lf * 3600).toFixed(1)} Lf/h
                    = {(resources.lf * 3600 * 6).toFixed(0)} Lf/d<br/>
                    {resources.ox.toFixed(3)} Ox/s = {(resources.ox * 3600).toFixed(1)} Ox/h
                    = {(resources.ox * 3600 * 6).toFixed(0)} Ox/d<br/>
                    {resources.mono.toFixed(3)} Mono/s = {(resources.mono * 3600).toFixed(1)} Mono/h
                    = {(resources.mono * 3600 * 6).toFixed(0)} Mono/d<br/>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
}
