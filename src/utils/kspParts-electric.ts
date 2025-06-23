import Part, {Resources} from "./kspParts";

export class SolarPanel extends Part {
    /* Power generator dependent on the distance to Kerbol
     * and night/eclipses
     */
}

export class Convertor extends Part {
    /* Converts one type of resource into another
     * E.g. a Fuel Cell converts LF+Ox into El
     */
}

export class RTG extends Part {
    /* Decaying power generation independent of location
     */
    halfLife: number = Infinity
}

export class Battery extends Part {
    /* Stores electricity
     */
}

export const electricalGenerators = {
    'Gigantor XL Solar Array': SolarPanel.create({
        cost: 3000,
        mass: 0.3,
        size: new Set(["R"]),
        consumption: new Resources({El: -24.4}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Gigantor_XL_Solar_Array"
    }),
    'OX-4W 3x2 Photovoltaic Panels': SolarPanel.create({
        cost: 380,
        mass: 0.0175,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-4W_3x2_Photovoltaic_Panels"
    }),
    'OX-4L 1x6 Photovoltaic Panels': SolarPanel.create({
        cost: 380,
        mass: 0.0175,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-4L_1x6_Photovoltaic_Panels"
    }),
    'SP-W 3x2 Photovoltaic Panels': SolarPanel.create({
        cost: 440,
        mass: 0.025,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/SP-W_3x2_Photovoltaic_Panels"
    }),
    'SP-L 1x6 Photovoltaic Panels': SolarPanel.create({
        cost: 440,
        mass: 0.025,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/SP-L_1x6_Photovoltaic_Panels"
    }),
    'OX-STAT Photovoltaic Panels': SolarPanel.create({
        cost: 75,
        mass: 0.005,
        size: new Set(["R"]),
        consumption: new Resources({El: -0.35}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-STAT_Photovoltaic_Panels"
    }),
    'OX-STAT-XL Photovoltaic Panels': SolarPanel.create({
        cost: 600,
        mass: 0.04,
        size: new Set(["R"]),
        consumption: new Resources({El: -2.80}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-STAT-XL_Photovoltaic_Panels"
    }),
    'PB-NUK Radioisotope Thermoelectric Generator': RTG.create({
        cost: 23300,
        mass: 0.08,
        size: new Set(["0"]),
        consumption: new Resources({El: -0.75}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/PB-NUK_Radioisotope_Thermoelectric_Generator"
    }),
    'Fuel Cell': Convertor.create({
        cost: 750,
        mass: 0.05,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.50, LF: 0.0016875, Ox: 0.0020625}),
        content: new Resources({El: 50}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Fuel_Cell"
    }),
    'Fuel Cell Array': Convertor.create({
        cost: 4500,
        mass: 0.24,
        size: new Set(["R"]),
        consumption: new Resources({El: -18.0, LF: 0.02025, Ox: 0.02475}),
        content: new Resources({El: 300}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Fuel_Cell_Array"
    }),
}
export const batteries = {
    // Same energy/mass ratio
    // Z-100 has lowest cost/energy ratio; Z-200 has highest cost/energy ratio
    'Z-100': Battery.create({
        cost: 80,
        mass: 0.005,
        size: new Set(["R"]),
        content: new Resources({El: 100}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-100_Rechargeable_Battery_Pack"
    }),
    'Z-200': Battery.create({
        cost: 360,
        mass: 0.01,
        size: new Set(["0"]),
        content: new Resources({El: 200}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-200_Rechargeable_Battery_Bank"
    }),
    'Z-400': Battery.create({
        cost: 550,
        mass: 0.02,
        size: new Set(["R"]),
        content: new Resources({El: 400}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-400_Rechargeable_Battery"
    }),
    'Z-1k': Battery.create({
        cost: 880,
        mass: 0.05,
        size: new Set(["1"]),
        content: new Resources({El: 1000}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-1k_Rechargeable_Battery_Bank"
    }),
    'Z-4k': Battery.create({
        cost: 4500,
        mass: 0.3,
        size: new Set(["2"]),
        content: new Resources({El: 4000}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-4K_Rechargeable_Battery_Bank"
    }),
}

export function electricalPartsWithMods(activeMods: Set<string> = new Set()): Record<string, Part> {
    return {...electricalGenerators, ...batteries}
}
