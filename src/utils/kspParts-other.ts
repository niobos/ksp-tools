import Part, {Resources, Size} from "./kspParts";
import * as React from "react";

export class ReactionWheel extends Part {
    maxTorque: [number, number, number] = [0, 0, 0];  // pitch, yaw, roll
    torquePowerRequirement: number = undefined;  // ⚡/s / (kN*m)
}

export const reactionWheels = {
    'Small Inline Reaction Wheel': ReactionWheel.create({
        cost: 600,
        mass: 0.05,
        size: new Set([Size.TINY]),
        maxTorque: [5, 5, 5],
        torquePowerRequirement: 0.050,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Small_Inline_Reaction_Wheel",
    }),
    'Advanced Inline Stabilizer': ReactionWheel.create({
        cost: 1200,
        mass: 0.1,
        size: new Set([Size.SMALL]),
        maxTorque: [15, 15, 15],
        torquePowerRequirement: 0.030,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Advanced_Inline_Stabilizer",
    }),
    'Advanced Reaction Wheel Module': ReactionWheel.create({
        cost: 2100,
        mass: 0.2,
        size: new Set([Size.LARGE]),
        maxTorque: [30, 30, 30],
        torquePowerRequirement: 0.020,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Advanced_Reaction_Wheel_Module,_Large",
    }),
};

export class Pod extends ReactionWheel {
    crew: number = 0;
    hibernateMultiplier: number = undefined;  // no hibernate

    get consumptionHibernated() {
        if (this.hibernateMultiplier === undefined) return this.consumption;
        // else:
        return this.consumption.copy({el: this.consumption.el * this.hibernateMultiplier})
    }
}

export const probeCores = {
    'Mk1 Cockpit': Pod.create({
        cost: 1250,
        mass: 1.28,
        size: new Set([Size.SMALL]),
        content: Resources.create({el: 50, mono: 7.5}),
        maxTorque: [10, 10, 10],
        torquePowerRequirement: 0.038,
        crew: 1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk1_Cockpit",
    }),
    'Mk1 Inline Cockpit': Pod.create({
        cost: 1600,
        mass: 1.03,
        size: new Set([Size.SMALL]),
        content: Resources.create({el: 50, mono: 7.5}),
        maxTorque: [10, 10, 10],
        torquePowerRequirement: 0.030,
        crew: 1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk1_Inline_Cockpit",
    }),
    'Mk2 Cockpit': Pod.create({
        cost: 3500,
        mass: 2.06,
        size: new Set([Size.MK2]),
        content: Resources.create({el: 150, mono: 15}),
        maxTorque: [15, 15, 15],
        torquePowerRequirement: 0.033,
        crew: 2,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk2_Cockpit",
    }),
    'Mk2 Inline Cockpit': Pod.create({
        cost: 3500,
        mass: 2.10,
        size: new Set([Size.MK2]),
        content: Resources.create({el: 150, mono: 25}),
        maxTorque: [15, 15, 15],
        torquePowerRequirement: 0.033,
        crew: 2,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk2_Inline_Cockpit",
    }),
    'Mk3 Cockpit': Pod.create({
        cost: 10000,
        mass: 3.90,
        size: new Set([Size.SMALL, Size.MK3]),
        content: Resources.create({el: 500, mono: 100}),
        maxTorque: [40, 40, 20],
        torquePowerRequirement: 0.025,
        crew: 4,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk3_Cockpit",
    }),
    'Mk1 Command Pod': Pod.create({
        cost: 600,
        mass: 0.84,
        size: new Set([Size.SMALL, Size.TINY]),
        content: Resources.create({el: 50, mono: 10}),
        maxTorque: [5, 5, 5],
        torquePowerRequirement: 0.048,
        crew: 1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk1_Command_Pod",
    }),
    'Mk1-3 Command Pod': Pod.create({
        cost: 3800,
        mass: 2.72,
        size: new Set([Size.LARGE, Size.SMALL]),
        content: Resources.create({el: 150, mono: 30}),
        maxTorque: [15, 15, 15],
        torquePowerRequirement: 0.030,
        crew: 3,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk1-3_Command_Pod",
    }),
    'Mk2 Command Pod': Pod.create({
        cost: 2800,
        mass: 1.56,
        size: new Set([Size.MEDIUM]),
        content: Resources.create({el: 200}),
        maxTorque: [5, 5, 5],
        torquePowerRequirement: 0.050,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk2_Command_Pod",
    }),
    'Mk1 Lander Can': Pod.create({
        cost: 1500,
        mass: 0.66,
        size: new Set([Size.SMALL]),
        content: Resources.create({el: 50, mono: 15}),
        maxTorque: [3, 3, 3],
        torquePowerRequirement: 0.100,
        crew: 1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk1_Lander_Can",
    }),
    'Mk2 Lander Can': Pod.create({
        cost: 3250,
        mass: 1.515,
        size: new Set([Size.LARGE]),
        content: Resources.create({el: 100, mono: 40}),
        maxTorque: [15, 15, 15],
        torquePowerRequirement: 0.050,
        crew: 2,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk2_Lander_Can",
    }),
    'PPD-12 Cupola Module': Pod.create({
        cost: 3200,
        mass: 1.80,
        size: new Set([Size.LARGE, Size.SMALL]),
        content: Resources.create({el: 200, mono: 10}),
        maxTorque: [9, 9, 9],
        torquePowerRequirement: 0.100,
        crew: 1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/PPD-12_Cupola_Module",
    }),
    "KV-1 'Onion' Reentry Module": Pod.create({
        cost: 600,
        mass: 0.77,
        size: new Set([Size.SMALL]),
        content: Resources.create({el: 50}),
        crew: 1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/KV-1_%27Onion%27_Reentry_Module",
    }),
    "KV-2 'Pea' Reentry Module": Pod.create({
        cost: 2000,
        mass: 1.52,
        size: new Set([Size.SMALL]),
        content: Resources.create({el: 50}),
        crew: 2,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/KV-2_%E2%80%98Pea%E2%80%99_Reentry_Module",
    }),
    "KV-3 'Pomegranate' Reentry Module": Pod.create({
        cost: 3000,
        mass: 2.27,
        size: new Set([Size.SMALL]),
        content: Resources.create({el: 50}),
        crew: 3,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/KV-3_%27Pomegranate%27_Reentry_Module",
    }),
    'EAS-1 External Command Seat': Pod.create({
        cost: 200,
        mass: 0.05,
        size: new Set([Size.RADIAL]),
        crew: 1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/EAS-1_External_Command_Seat",
    }),
    'Munar Excursion Module (M.E.M.)': Pod.create({
        cost: 3500,
        mass: 2.075,
        size: new Set([Size.TINY, Size.SMALL]),
        content: Resources.create({el: 150, lf: 54, ox: 66, mono: 30}),
        crew: 2,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Munar_Excursion_Module_(M.E.M.)",
    }),
    'Probodobodyne RoveMate': Pod.create({
        cost: 800,
        mass: 0.15,
        size: new Set([Size.SMALL]),
        consumption: Resources.create({el: 2.40 / 60}),
        hibernateMultiplier: .25,
        content: Resources.create({el: 120}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Probodobodyne_RoveMate"
    }),
    'Probodobodyne Stayputnik': Pod.create({
        cost: 300,
        mass: 0.05,
        size: new Set([Size.TINY]),
        consumption: Resources.create({el: 1.67 / 60}),
        hibernateMultiplier: .001,
        content: Resources.create({el: 10}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Probodobodyne_Stayputnik"
    }),
    'Probodobodyne QBE': Pod.create({
        cost: 360,
        mass: 0.07,
        size: new Set([Size.TINY]),
        consumption: Resources.create({el: 1.50 / 60}),
        hibernateMultiplier: .01,
        content: Resources.create({el: 5}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Probodobodyne_QBE"
    }),
    'Probodobodyne HECS': Pod.create({
        cost: 650,
        mass: 0.10,
        size: new Set([Size.TINY]),
        consumption: Resources.create({el: 1.50 / 60}),
        hibernateMultiplier: .01,
        content: Resources.create({el: 10}),
        maxTorque: [0.3, 0.3, 0.3],
        torquePowerRequirement: 0.1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Probodobodyne_HECS"
    }),
    'Probodobodyne OKTO': Pod.create({
        cost: 450,
        mass: 0.10,
        size: new Set([Size.TINY]),
        consumption: Resources.create({el: 1.20 / 60}),
        hibernateMultiplier: .01,
        content: Resources.create({el: 10}),
        maxTorque: [0.3, 0.3, 0.3],
        torquePowerRequirement: 0.1,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Probodobodyne_OKTO"
    }),
    'Probodobodyne OKTO2': Pod.create({
        cost: 1480,
        mass: 0.04,
        size: new Set([Size.TINY]),
        consumption: Resources.create({el: 1.80 / 60}),
        hibernateMultiplier: .01,
        content: Resources.create({el: 5}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Probodobodyne_OKTO2"
    }),
    'Probodobodyne HECS2': Pod.create({
        cost: 7500,
        mass: 0.20,
        size: new Set([Size.SMALL]),
        consumption: Resources.create({el: 3.00 / 60}),
        hibernateMultiplier: .002,
        content: Resources.create({el: 1000}),
        maxTorque: [10, 10, 10],
        torquePowerRequirement: 0.050,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Probodobodyne_HECS2"
    }),
    'RC-001S Remote Guidance Unit': Pod.create({
        cost: 2250,
        mass: 0.10,
        size: new Set([Size.SMALL]),
        consumption: Resources.create({el: 3.0 / 60}),
        hibernateMultiplier: .004,
        content: Resources.create({el: 15}),
        maxTorque: [0.5, 0.5, 0.5],
        torquePowerRequirement: 0.060,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RC-001S_Remote_Guidance_Unit"
    }),
    'RC-L01 Remote Guidance Unit': Pod.create({
        cost: 3400,
        mass: 0.50,
        size: new Set([Size.LARGE]),
        consumption: Resources.create({el: 4.80 / 60}),
        hibernateMultiplier: .00125,
        content: Resources.create({el: 30}),
        maxTorque: [1.5, 1.5, 1.5],
        torquePowerRequirement: 0.100,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RC-L01_Remote_Guidance_Unit"
    }),
    'MK2 Drone Core': Pod.create({
        cost: 2700,
        mass: 0.20,
        size: new Set([Size.MK2]),
        consumption: Resources.create({el: 3.0 / 60}),
        hibernateMultiplier: .2,
        content: Resources.create({el: 250}),
        maxTorque: [15, 3, 3],
        torquePowerRequirement: 0.033,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/MK2_Drone_Core"
    }),
    'MPO Probe': Pod.create({
        cost: 9900,
        mass: 0.90,
        size: new Set([Size.SMALL]),
        consumption: Resources.create({el: 3.00 / 60}),
        hibernateMultiplier: .002,
        content: Resources.create({lf: 45, ox: 55, el: 1000}),
        maxTorque: [6, 6, 6],
        torquePowerRequirement: 0.050,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/MPO_Probe"
    }),
    'MTM Stage': Pod.create({
        cost: 21500,
        mass: 0.80,
        size: new Set([Size.SMALL, Size.TINY]),
        consumption: Resources.create({el: 1.80 / 60}),
        hibernateMultiplier: .01,
        content: Resources.create({xe: 3800, el: 4000}),
        maxTorque: [12, 12, 12],
        torquePowerRequirement: 0.050,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/MTM_Stage"
    }),
};
