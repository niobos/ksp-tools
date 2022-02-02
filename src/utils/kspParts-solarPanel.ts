import Part, {Resources, Size} from "./kspParts";

export class SolarPanel extends Part {
    /* Power generator dependent on the distance to Kerbol
     * and night/eclipses
     */
}

export class FuelCell extends Part {
    /* Throttlable power generator
     */
}

export const electricalGenerators = {
    'Gigantor XL Solar Array': SolarPanel.create({
        cost: 3000,
        mass: 0.3,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -24.4}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Gigantor_XL_Solar_Array"
    }),
    'OX-4W 3x2 Photovoltaic Panels': SolarPanel.create({
        cost: 380,
        mass: 0.0175,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-4W_3x2_Photovoltaic_Panels"
    }),
    'OX-4L 1x6 Photovoltaic Panels': SolarPanel.create({
        cost: 380,
        mass: 0.0175,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-4L_1x6_Photovoltaic_Panels"
    }),
    'SP-W 3x2 Photovoltaic Panels': SolarPanel.create({
        cost: 440,
        mass: 0.025,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/SP-W_3x2_Photovoltaic_Panels"
    }),
    'SP-L 1x6 Photovoltaic Panels': SolarPanel.create({
        cost: 440,
        mass: 0.025,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -1.64}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/SP-L_1x6_Photovoltaic_Panels"
    }),
    'OX-STAT Photovoltaic Panels': SolarPanel.create({
        cost: 75,
        mass: 0.005,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -0.35}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-STAT_Photovoltaic_Panels"
    }),
    'OX-STAT-XL Photovoltaic Panels': SolarPanel.create({
        cost: 600,
        mass: 0.04,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -2.80}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/OX-STAT-XL_Photovoltaic_Panels"
    }),
    'PB-NUK Radioisotope Thermoelectric Generator': Part.create({
        cost: 23300,
        mass: 0.08,
        size: new Set([Size.TINY]),
        consumption: Resources.create({el: -0.75}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/PB-NUK_Radioisotope_Thermoelectric_Generator"
    }),
    'Fuel Cell': FuelCell.create({
        cost: 750,
        mass: 0.05,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -1.50, lf: 0.0016875, ox: 0.0020625}),
        content: Resources.create({el: 50}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Fuel_Cell"
    }),
    'Fuel Cell Array': FuelCell.create({
        cost: 4500,
        mass: 0.24,
        size: new Set([Size.RADIAL]),
        consumption: Resources.create({el: -18.0, lf: 0.02025, ox: 0.02475}),
        content: Resources.create({el: 300}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Fuel_Cell_Array"
    }),
};
export const batteries = {
    // Same energy/mass ratio
    // Z-100 has lowest cost/energy ratio; Z-200 has highest cost/energy ratio
    'Z-100': Part.create({
        cost: 80,
        mass: 0.005,
        size: new Set([Size.RADIAL]),
        content: Resources.create({el: 100}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-100_Rechargeable_Battery_Pack"
    }),
    'Z-200': Part.create({
        cost: 360,
        mass: 0.01,
        size: new Set([Size.TINY]),
        content: Resources.create({el: 200}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-200_Rechargeable_Battery_Bank"
    }),
    'Z-400': Part.create({
        cost: 550,
        mass: 0.02,
        size: new Set([Size.RADIAL]),
        content: Resources.create({el: 400}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-400_Rechargeable_Battery"
    }),
    'Z-1k': Part.create({
        cost: 880,
        mass: 0.05,
        size: new Set([Size.SMALL]),
        content: Resources.create({el: 1000}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-1k_Rechargeable_Battery_Bank"
    }),
    'Z-4k': Part.create({
        cost: 4500,
        mass: 0.3,
        size: new Set([Size.LARGE]),
        content: Resources.create({el: 4000}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Z-4K_Rechargeable_Battery_Bank"
    }),
};