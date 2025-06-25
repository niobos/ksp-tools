import Part, {Resources} from "./kspParts";
import {combineWithOverride, setEq} from "./utils";

export class SolarPanel extends Part {
    /* Power generator dependent on the distance to Kerbol
     * and night/eclipses
     */
}

export class Convertor extends Part {
    /* Converts one type of resource into another
     * E.g. a Fuel Cell converts LF+Ox into El
     */
    minimumModulation: number = 0  // Some converters can modulate down to 0%, but not all
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

const electricalParts = [
    SolarPanel.create({
        name: 'Gigantor XL',
        cost: 3000,
        mass: 0.3,
        size: new Set(["R"]),
        consumption: new Resources({El: -24.4}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Gigantor_XL_Solar_Array"
    }),
    SolarPanel.create({
        name: 'OX-4W 3x2',
        cost: 380,
        mass: 0.0175,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-4W_3x2_Photovoltaic_Panels"
    }),
    SolarPanel.create({
        name: 'OX-4L 1x6',
        cost: 380,
        mass: 0.0175,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-4L_1x6_Photovoltaic_Panels"
    }),
    SolarPanel.create({
        name: 'SP-W 3x2',
        cost: 440,
        mass: 0.025,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/SP-W_3x2_Photovoltaic_Panels"
    }),
    SolarPanel.create({
        name: 'SP-L 1x6',
        cost: 440,
        mass: 0.025,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/SP-L_1x6_Photovoltaic_Panels"
    }),
    SolarPanel.create({
        name: 'OX-STAT',
        cost: 75,
        mass: 0.005,
        size: new Set(["R"]),
        consumption: new Resources({El: -0.35}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-STAT_Photovoltaic_Panels"
    }),
    SolarPanel.create({
        name: 'OX-STAT-XL',
        cost: 600,
        mass: 0.04,
        size: new Set(["R"]),
        consumption: new Resources({El: -2.80}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-STAT-XL_Photovoltaic_Panels"
    }),

    RTG.create({
        name: 'PB-NUK',
        cost: 23300,
        mass: 0.08,
        size: new Set(["0", "R"]),
        consumption: new Resources({El: -0.75}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/PB-NUK_Radioisotope_Thermoelectric_Generator"
    }),

    Convertor.create({
        name: 'Fuel Cell',
        cost: 750,
        mass: 0.05,
        size: new Set(["R"]),
        consumption: new Resources({El: -1.50, LF: 0.0016875, Ox: 0.0020625}),
        content: new Resources({El: 50}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Fuel_Cell"
    }),
    Convertor.create({
        name: 'Fuel Cell Array',
        cost: 4500,
        mass: 0.24,
        size: new Set(["R"]),
        consumption: new Resources({El: -18.0, LF: 0.02025, Ox: 0.02475}),
        content: new Resources({El: 300}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Fuel_Cell_Array"
    }),

    Battery.create({
        name: 'Z-100',
        cost: 80,
        mass: 0.005,
        size: new Set(["R"]),
        content: new Resources({El: 100}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-100_Rechargeable_Battery_Pack"
    }),
    Battery.create({
        name: 'Z-200',
        cost: 360,
        mass: 0.01,
        size: new Set(["0"]),
        content: new Resources({El: 200}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-200_Rechargeable_Battery_Bank"
    }),
    Battery.create({
        name: 'Z-400',
        cost: 550,
        mass: 0.02,
        size: new Set(["R"]),
        content: new Resources({El: 400}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-400_Rechargeable_Battery"
    }),
    Battery.create({
        name: 'Z-1k',
        cost: 880,
        mass: 0.05,
        size: new Set(["1"]),
        content: new Resources({El: 1000}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-1k_Rechargeable_Battery_Bank"
    }),
    Battery.create({
        name: 'Z-4k',
        cost: 4500,
        mass: 0.3,
        size: new Set(["2"]),
        content: new Resources({El: 4000}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-4K_Rechargeable_Battery_Bank"
    }),
]

const nearFuture: Array<Part> = [
    // TODO: Solar Panels

    Battery.create({
        name: 'B-12K',
        cost: 13500,
        mass: 0.6,
        size: new Set(["2"]),
        content: new Resources({El: 12000}),
    }),
    Battery.create({
        name: 'B-3K',
        cost: 3150,
        mass: 0.14,
        size: new Set(["0"]),
        content: new Resources({El: 3000}),
    }),
    Battery.create({
        name: 'B-6K',
        cost: 7200,
        mass: 0.32,
        size: new Set(["1"]),
        content: new Resources({El: 6000}),
    }),
    Battery.create({
        name: 'B-800',
        cost: 1100,
        mass: 0.04,
        size: new Set(["R"]),
        content: new Resources({El: 800}),
    }),

    RTG.create({
        name: 'PB-ACK',
        cost: 3200,
        mass: 0.03,
        size: new Set(["0", "R"]),
        consumption: new Resources({El: -0.25}),
        halfLife: 8*426*6*60*60,
    }),
    RTG.create({  // Override
        name: 'PB-NUK',
        cost: 11650,
        mass: 0.08,
        size: new Set(["0", "R"]),
        consumption: new Resources({El: -0.75}),
        halfLife: 8*426*6*60*60,
    }),
    RTG.create({
        name: 'PB-NUK-II',
        cost: 47500,
        mass: 0.3,
        size: new Set(["0", "R"]),
        consumption: new Resources({El: -3}),
        halfLife: 8*426*6*60*60,
    }),
    RTG.create({
        name: 'PB-NUK-III',
        cost: 27500,
        mass: 0.18,
        size: new Set(["0", "R"]),
        consumption: new Resources({El: -2}),
        halfLife: 8*426*6*60*60,
    }),
    RTG.create({
        name: 'PB-SRG',
        cost: 26000,
        mass: 0.16,
        size: new Set(["0", "R"]),
        consumption: new Resources({El: -2}),
        halfLife: Infinity,
    }),

    Convertor.create({
        name: "MN-1 'SNAK'",
        cost: 10_880,
        mass: 0.0305,
        size: new Set(["0"]),
        consumption: new Resources({El: -5, EnrU: 6.5206E-9, DeplU: -6.5206E-9}),
        content: new Resources({El: 5, EnrU: 1.5}),
        minimumModulation: 0.25,
    }),
    Convertor.create({
        name: "MX-0 'Toaster",
        cost: 85_300,
        mass: 0.2757,
        size: new Set(["0"]),
        consumption: new Resources({El: -60, EnrU: 4.35E-8, DeplU: -4.35E-8}),
        content: new Resources({El: 60, EnrU: 10}),
        minimumModulation: 0.10,
    }),
    Convertor.create({
        name: "MX-1 'Garnet'",
        cost: 164_630,
        mass: 0.8781,
        size: new Set(["1"]),
        consumption: new Resources({El: -200, EnrU: 1.30E-7, DeplU: -1.30E-7}),
        content: new Resources({El: 200, EnrU: 30}),
        minimumModulation: 0.10,
    }),
    Convertor.create({
        name: "MX-1B 'Prometheus'",
        cost: 260_280,
        mass: 2.6653,
        size: new Set(["1.5"]),
        consumption: new Resources({El: -625, EnrU: 3.91E-7, DeplU: -3.91E-7}),
        content: new Resources({El: 625, EnrU: 90}),
        minimumModulation: 0.10,
    }),
    Convertor.create({
        name: "MX-2C 'Hyperion'",
        cost: 449_200,
        mass: 8.0716,
        size: new Set(["2"]),
        consumption: new Resources({El: -2000, EnrU: 1.22E-6, DeplU: -1.22E-6}),
        content: new Resources({El: 2000, EnrU: 280}),
        minimumModulation: 0.10,
    }),
    Convertor.create({
        name: "MX-2L 'Excalibur'",
        cost: 515_699,
        mass: 11.531,
        size: new Set(["2"]),
        consumption: new Resources({El: -3000, EnrU: 1.52E-6, DeplU: -1.52E-6}),
        content: new Resources({El: 1500, EnrU: 400}),
        minimumModulation: 0.10,
    }),
    Convertor.create({
        name: "MX-3L 'Hermes'",
        cost: 722_385,
        mass: 17.2326,
        size: new Set(["3"]),
        consumption: new Resources({El: -5000, EnrU: 2.52E-6, DeplU: -2.52E-6}),
        content: new Resources({El: 3000, EnrU: 580}),
        minimumModulation: 0.10,
    }),
]

const farFuture: Array<Part> = [
    Convertor.create({
        name: 'FX-2 Fusion Reactor [D-D mode]',
        cost: 802_600,
        mass: 13.333,
        size: new Set(["2"]),
        consumption: new Resources({El: -4000, D: 1.09E-5}),
        minimumModulation: 0.025,
    }),
    Convertor.create({
        name: 'FX-2 Fusion Reactor [D-He3 mode]',
        cost: 802_600,
        mass: 13.333,
        size: new Set(["2"]),
        consumption: new Resources({El: -8000, D: 2.18E-6, He3: 8.72E-6}),
        minimumModulation: 0.025,
    }),
    Convertor.create({
        name: 'FX-3 Fusion Reactor [D-D mode]',
        cost: 2_002_600,
        mass: 33.333,
        size: new Set(["3"]),
        consumption: new Resources({El: -10_000, D: 2.73E-5}),
        minimumModulation: 0.025,
    }),
    Convertor.create({
        name: 'FX-3 Fusion Reactor [D-He3 mode]',
        cost: 2_002_600,
        mass: 33.333,
        size: new Set(["3"]),
        consumption: new Resources({El: -20_000, D: 5.45E-6, He3: 2.18E-5}),
        minimumModulation: 0.025,
    }),
]

function electricalPartsWithMods_(activeMods: Set<string> = new Set()): Array<Part> {
    let parts: Array<Part> = [...electricalParts]
    if(activeMods.has("NFT")) {
        parts = combineWithOverride(parts, nearFuture)
    }
    if(activeMods.has("FFT")) {
        parts = combineWithOverride(parts, farFuture)
    }
    return parts
}

let electricalPartsCache: null | {activeMods: Set<string>, parts: Array<Part>} = null
export function electricalPartsWithMods(activeMods: Set<string> = new Set()): Array<Part> {
    if(electricalPartsCache == null || !setEq(electricalPartsCache.activeMods, activeMods)) {
        electricalPartsCache = {
            activeMods: new Set(activeMods),
            parts: electricalPartsWithMods_(activeMods),
        }
    }
    return electricalPartsCache.parts
}
