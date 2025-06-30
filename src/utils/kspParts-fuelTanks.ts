import Part, {Resources} from "./kspParts";
import {setEq} from "./utils";

export class FuelTank extends Part {}

const fuelTanks = [
    FuelTank.create({
        name: '2.5m to Mk2 Adapter',
        cost: 800,
        mass: 4.57,
        size: new Set(["2", "Mk2"]),
        content: new Resources({LF: 360, Ox: 440})
    }),
    FuelTank.create({
        name: 'C7 Brand Adapter (2.5m to 1.25m)',
        cost: 800,
        mass: 4.57,
        size: new Set(["1", "2"]),
        content: new Resources({LF: 360, Ox: 440})
    }),
    FuelTank.create({
        name: 'FL-A150 Fuel Tank Adapter',
        cost: 160,
        mass: 0.9,
        size: new Set(["0", "1.5"]),
        content: new Resources({LF: 72, Ox: 88})
    }),
    FuelTank.create({
        name: 'FL-A151L Fuel Tank Adapter',
        cost: 600,
        mass: 3.375,
        size: new Set(["1", "1.5"]),
        content: new Resources({LF: 270, Ox: 330})
    }),
    FuelTank.create({
        name: 'FL-A151S Fuel Tank Adapter',
        cost: 160,
        mass: 0.9,
        size: new Set(["1", "1.5"]),
        content: new Resources({LF: 72, Ox: 88})
    }),
    FuelTank.create({
        name: 'FL-A215 Fuel Tank Adapter',
        cost: 1200,
        mass: 6.75,
        size: new Set(["1.5", "2"]),
        content: new Resources({LF: 540, Ox: 660})
    }),
    FuelTank.create({
        name: 'FL-C1000 Fuel Tank',
        cost: 1400,
        mass: 6.78,
        size: new Set(["1.5"]),
        content: new Resources({LF: 540, Ox: 660})
    }),  // includes separator SRB
    FuelTank.create({
        name: 'FL-R1 RCS Fuel Tank',
        cost: 1800,
        mass: 3.4,
        size: new Set(["2"]),
        content: new Resources({Mono: 750})
    }),  // TODO: check size
    FuelTank.create({
        name: 'FL-R10 RCS Fuel Tank',
        cost: 200,
        mass: 0.1,
        size: new Set(["0"]),
        content: new Resources({Mono: 20})
    }),  // TODO: check size
    FuelTank.create({
        name: 'FL-R25 RCS Fuel Tank',
        cost: 330,
        mass: 0.56,
        size: new Set(["1"]),
        content: new Resources({Mono: 120})
    }),  // TODO: check size
    FuelTank.create({
        name: 'FL-R5 RCS Fuel Tank',
        cost: 960,
        mass: 1.85,
        size: new Set(["1.5"]),
        content: new Resources({Mono: 400})
    }),  // TODO: check size
    FuelTank.create({
        name: 'FL-T100 Fuel Tank',
        cost: 150,
        mass: 0.5625,
        size: new Set(["1", "R"]),
        content: new Resources({LF: 45, Ox: 55})
    }),
    FuelTank.create({
        name: 'FL-T200 Fuel Tank',
        cost: 275,
        mass: 1.125,
        size: new Set(["1", "R"]),
        content: new Resources({LF: 90, Ox: 110})
    }),
    FuelTank.create({
        name: 'FL-T400 Fuel Tank',
        cost: 500,
        mass: 2.25,
        size: new Set(["1", "R"]),
        content: new Resources({LF: 180, Ox: 220})
    }),
    FuelTank.create({
        name: 'FL-T800 Fuel Tank',
        cost: 800,
        mass: 4.5,
        size: new Set(["1", "R"]),
        content: new Resources({LF: 360, Ox: 440})
    }),
    FuelTank.create({
        name: 'FL-TX1800 Fuel Tank',
        cost: 1800,
        mass: 10.125,
        size: new Set(["1.5"]),
        content: new Resources({LF: 810, Ox: 990})
    }),
    FuelTank.create({
        name: 'FL-TX220 Fuel Tank',
        cost: 220,
        mass: 1.2375,
        size: new Set(["1.5"]),
        content: new Resources({LF: 99, Ox: 121})
    }),
    FuelTank.create({
        name: 'FL-TX440 Fuel Tank',
        cost: 440,
        mass: 2.475,
        size: new Set(["1.5"]),
        content: new Resources({LF: 198, Ox: 242})
    }),
    FuelTank.create({
        name: 'FL-TX900 Fuel Tank',
        cost: 900,
        mass: 5.0625,
        size: new Set(["1.5"]),
        content: new Resources({LF: 405, Ox: 495})
    }),
    FuelTank.create({
        name: 'Kerbodyne ADTP-2-3',
        cost: 1623,
        mass: 16.875,
        size: new Set(["2", "3"]),
        content: new Resources({LF: 1350, Ox: 1650})
    }),
    FuelTank.create({
        name: 'kerbodyne Engine Cluster Adapter Tank',
        cost: 9000,
        mass: 50.625,
        size: new Set(["4", "1"]),
        content: new Resources({LF: 4050, Ox: 4950})
    }),
    FuelTank.create({
        name: 'Kerbodyne S3-14400 Tank',
        cost: 13_000,
        mass: 81,
        size: new Set(["3"]),
        content: new Resources({LF: 6480, Ox: 7920})
    }),
    FuelTank.create({
        name: 'Kerbodyne S3-3600 Tank',
        cost: 3250,
        mass: 20.25,
        size: new Set(["3"]),
        content: new Resources({LF: 1620, Ox: 1980})
    }),
    FuelTank.create({
        name: 'Kerbodyne S3-7200 Tank',
        cost: 6500,
        mass: 40.5,
        size: new Set(["3"]),
        content: new Resources({LF: 3240, Ox: 3960})
    }),
    FuelTank.create({
        name: 'Kerbodyne S3-S4 Adapter Tank',
        cost: 6400,
        mass: 36,
        size: new Set(["3", "4"]),
        content: new Resources({LF: 2880, Ox: 3520})
    }),
    FuelTank.create({
        name: 'Kerbodyne S4-128 Fuel Tank',
        cost: 12_800,
        mass: 72,
        size: new Set(["4"]),
        content: new Resources({LF: 5760, Ox: 7040})
    }),
    FuelTank.create({
        name: 'Kerbodyne S4-256 Fuel Tank',
        cost: 25_600,
        mass: 144,
        size: new Set(["4"]),
        content: new Resources({LF: 11_520, Ox: 14_080})
    }),
    FuelTank.create({
        name: 'Kerbodyne S4-512 Fuel Tank',
        cost: 51_200,
        mass: 288,
        size: new Set(["4"]),
        content: new Resources({LF: 23_040, Ox: 28_160})
    }),
    FuelTank.create({
        name: 'Kerbodyne S4-64 Fuel Tank',
        cost: 6400,
        mass: 36,
        size: new Set(["4"]),
        content: new Resources({LF: 2880, Ox: 3520})
    }),
    FuelTank.create({
        name: 'Large Holding Tank',
        cost: 3000,
        mass: 2 + 15,
        size: new Set(["2"]),
        content: new Resources({Ore: 1500})
    }),
    FuelTank.create({
        name: 'Mk0 Liquid Fuel Tank',
        cost: 200,
        mass: 0.275,
        size: new Set(["0"]),
        content: new Resources({LF: 50})
    }),
    FuelTank.create({
        name: 'Mk1 Liquid Fuel Tank',
        cost: 550,
        mass: 2.25,
        size: new Set(["1"]),
        content: new Resources({LF: 400})
    }),
    FuelTank.create({
        name: 'Mk2 Bicoupler',
        cost: 860,
        mass: 2.29,
        size: new Set(["1", "Mk2"]),
        content: new Resources({LF: 180, Ox: 220})
    }),
    FuelTank.create({
        name: 'Mk2 Liquid Fuel Fuselage',
        cost: 1450,
        mass: 4.57,
        size: new Set(["Mk2"]),
        content: new Resources({LF: 800})
    }),
    FuelTank.create({
        name: 'Mk2 Liquid Fuel Fuselage Short',
        cost: 750,
        mass: 2.29,
        size: new Set(["Mk2"]),
        content: new Resources({LF: 400})
    }),
    FuelTank.create({
        name: 'Mk2 Monopropellant Tank',
        cost: 750,
        mass: 1.89,
        size: new Set(["Mk2"]),
        content: new Resources({Mono: 400})
    }),
    FuelTank.create({
        name: 'Mk2 Rocket Fuel Fuselage',
        cost: 1450,
        mass: 4.57,
        size: new Set(["Mk2"]),
        content: new Resources({LF: 360, Ox: 440})
    }),
    FuelTank.create({
        name: 'Mk2 Rocket Fuel Fuselage Short',
        cost: 750,
        mass: 2.29,
        size: new Set(["Mk2"]),
        content: new Resources({LF: 180, Ox: 220})
    }),
    FuelTank.create({
        name: 'Mk2 to 1.25m Adapter',
        cost: 550,
        mass: 2.29,
        size: new Set(["Mk2", "1"]),
        content: new Resources({LF: 180, Ox: 220})
    }),
    FuelTank.create({
        name: 'Mk2 to 1.25m Adapter Long',
        cost: 1050,
        mass: 4.57,
        size: new Set(["Mk2", "1"]),
        content: new Resources({LF: 360, Ox: 440})
    }),
    FuelTank.create({
        name: 'Mk3 Liquid Fuel Fuselage',
        cost: 8600,
        mass: 28.57,
        size: new Set(["Mk3"]),
        content: new Resources({LF: 5000})
    }),
    FuelTank.create({
        name: 'Mk3 Liquid Fuel Fuselage Long',
        cost: 17_200,
        mass: 57.14,
        size: new Set(["Mk3"]),
        content: new Resources({LF: 10_000})
    }),
    FuelTank.create({
        name: 'Mk3 Liquid Fuel Fuselage Short',
        cost: 4300,
        mass: 14.29,
        size: new Set(["Mk3"]),
        content: new Resources({LF: 2500})
    }),
    FuelTank.create({
        name: 'Mk3 Monopropellant Tank',
        cost: 5040,
        mass: 9.8,
        size: new Set(["Mk3"]),
        content: new Resources({Mono: 2100})
    }),
    FuelTank.create({
        name: 'Mk3 Rocket Fuel Fuselage',
        cost: 5000,
        mass: 28.57,
        size: new Set(["Mk3"]),
        content: new Resources({LF: 2250, Ox: 2750})
    }),
    FuelTank.create({
        name: 'Mk3 Rocket Fuel Fuselage Long',
        cost: 10_000,
        mass: 57.14,
        size: new Set(["Mk3"]),
        content: new Resources({LF: 4500, Ox: 5500})
    }),
    FuelTank.create({
        name: 'Mk3 Rocket Fuel Fuselage Short',
        cost: 2500,
        mass: 14.29,
        size: new Set(["Mk3"]),
        content: new Resources({LF: 1125, Ox: 1375})
    }),
    FuelTank.create({
        name: 'Mk3 to 2.5m Adapter',
        cost: 2500,
        mass: 14.29,
        size: new Set(["Mk3", "2"]),
        content: new Resources({LF: 1125, Ox: 1375})
    }),
    FuelTank.create({
        name: 'Mk3 to 3.75m Adapter',
        cost: 2500,
        mass: 14.29,
        size: new Set(["Mk3", "3"]),
        content: new Resources({LF: 1125, Ox: 1375})
    }),
    FuelTank.create({
        name: 'Mk3 to Mk2 Adapter',
        cost: 2200,
        mass: 11.43,
        size: new Set(["Mk3", "Mk2"]),
        content: new Resources({LF: 900, Ox: 1100})
    }),
    FuelTank.create({
        name: 'NCS Adapter',
        cost: 320,
        mass: 0.5,
        size: new Set(["0", "1"]),
        content: new Resources({LF: 80})
    }),
    FuelTank.create({
        name: 'Oscar-B Fuel Tank',
        cost: 70,
        mass: 0.225,
        size: new Set(["0"]),
        content: new Resources({LF: 18, Ox: 22})
    }),
    FuelTank.create({
        name: 'PB-X150 Xenon Container',
        cost: 3680,
        mass: 0.096,
        size: new Set(["0"]),
        content: new Resources({Xe: 720})
    }),
    FuelTank.create({
        name: 'PB-X50R Xenon Container',
        cost: 2220,
        mass: 0.054,
        size: new Set(["R"]),
        content: new Resources({Xe: 405})
    }),
    FuelTank.create({
        name: 'PB-X750 Xenon Container',
        cost: 24_300,
        mass: 0.76,
        size: new Set(["1"]),
        content: new Resources({Xe: 5700})
    }),
    FuelTank.create({
        name: 'R-11 "Baguette" External Tank',
        cost: 50,
        mass: 0.3038,
        size: new Set(["R"]),
        content: new Resources({LF: 24.3, Ox: 29.7})
    }),
    FuelTank.create({
        name: 'R-12 "Doughnut" External Tank',
        cost: 147,
        mass: 0.3375,
        size: new Set(["1"]),
        content: new Resources({LF: 27, Ox: 33})
    }),
    FuelTank.create({
        name: 'R-4 "Dumpling" External Tank',
        cost: 50,
        mass: 0.1238,
        size: new Set(["R"]),
        content: new Resources({LF: 9.9, Ox: 12.1})
    }),
    FuelTank.create({
        name: 'Radial Holding Tank',
        cost: 300,
        mass: 0.125 + .75,
        size: new Set(["R"]),
        content: new Resources({Ore: 75})
    }),
    FuelTank.create({
        name: 'Rockomax Jumbo-64 Fuel Tank',
        cost: 5750,
        mass: 36,
        size: new Set(["2"]),
        content: new Resources({LF: 2880, Ox: 3520})
    }),
    FuelTank.create({
        name: 'Rockomax X200-16 Fuel Tank',
        cost: 1550,
        mass: 9,
        size: new Set(["2"]),
        content: new Resources({LF: 720, Ox: 880})
    }),
    FuelTank.create({
        name: 'Rockomax X200-32 Fuel Tank',
        cost: 3000,
        mass: 18,
        size: new Set(["2"]),
        content: new Resources({LF: 1440, Ox: 1760})
    }),
    FuelTank.create({
        name: 'Rockomax X200-8 Fuel Tank',
        cost: 800,
        mass: 4.5,
        size: new Set(["2"]),
        content: new Resources({LF: 360, Ox: 440})
    }),
    FuelTank.create({
        name: 'Small Holding Tank',
        cost: 1000,
        mass: 0.5 + 3.00,
        size: new Set(["1"]),
        content: new Resources({Ore: 300})
    }),
    FuelTank.create({
        name: 'Stratus-V Cylindrified Monopropellant Tank',
        cost: 250,
        mass: 0.23,
        size: new Set(["R"]),
        content: new Resources({Mono: 50})
    }),
    FuelTank.create({
        name: 'Stratus-V Minified Monopropellant Tank',
        cost: 30,
        mass: 0.04,
        size: new Set(["R"]),
        content: new Resources({Mono: 7.5})
    }),
    FuelTank.create({
        name: 'Stratus-V Roundified Monopropellant Tank',
        cost: 200,
        mass: 0.1,
        size: new Set(["R"]),
        content: new Resources({Mono: 20})
    }),
]


function fuelTanksWithMods_(activeMods: Set<string> = new Set()): Array<FuelTank> {
    let parts: Array<FuelTank> = [...fuelTanks]
    // if(activeMods.has("NFT")) {
    //     parts = combineWithOverride(parts, nearFuture)
    // }
    // if(activeMods.has("FFT")) {
    //     parts = combineWithOverride(parts, farFuture)
    // }
    return parts
}

let fuelTanksCache: null | {activeMods: Set<string>, parts: Array<FuelTank>} = null
export function fuelTanksWithMods(activeMods: Set<string> = new Set()): Array<FuelTank> {
    if(fuelTanksCache == null || !setEq(fuelTanksCache.activeMods, activeMods)) {
        fuelTanksCache = {
            activeMods: new Set(activeMods),
            parts: fuelTanksWithMods_(activeMods),
        }
    }
    return fuelTanksCache.parts
}
