import Part, {Resources} from "./kspParts";
import {combineWithOverride, setEq} from "./utils";

export class FuelTank extends Part {}

export const _fuelTanks = [
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

export const _nearFuture = [
    FuelTank.create({
        name: 'PB-XR9 Xenon Tank',
        cost: 33_863,
        mass: 1.0,
        size: new Set(["R"]),
        content: new Resources({Xe: 7500}),
    }),
    FuelTank.create({
        name: 'PB-XA06 Xenon Tank',
        cost: 25_714,
        mass: 0.8,
        size: new Set(["1"]),
        content: new Resources({Xe: 6000}),
    }),
    FuelTank.create({
        name: 'PB-XA12 Xenon Tank',
        cost: 51_429,
        mass: 1.6,
        size: new Set(["1"]),
        content: new Resources({Xe: 12_000}),
    }),
    FuelTank.create({
        name: 'PB-XA24 Xenon Tank',
        cost: 102_857,
        mass: 3.2,
        size: new Set(["1"]),
        content: new Resources({Xe: 24_000}),
    }),
    FuelTank.create({
        name: 'PB-Z02 Xenon Tank',
        cost: 205_714,
        mass: 6.4,
        size: new Set(["2"]),
        content: new Resources({Xe: 48_000}),
    }),
    FuelTank.create({
        name: 'PB-Z04 Xenon Tank',
        cost: 411_429,
        mass: 12.8,
        size: new Set(["2"]),
        content: new Resources({Xe: 96_000}),
    }),
    FuelTank.create({
        name: 'PB-Z08 Xenon Tank',
        cost: 822_857,
        mass: 25.6,
        size: new Set(["2"]),
        content: new Resources({Xe: 192_000}),
    }),
    FuelTank.create({
        name: 'A101 Argon Tank',
        cost: 199,
        mass: 0.0343,
        size: new Set(["R"]),
        content: new Resources({Ar: 14_400}),
    }),
    FuelTank.create({
        name: 'A102 Argon Tank',
        cost: 882,
        mass: 0.1522,
        size: new Set(["R"]),
        content: new Resources({Ar: 64_000}),
    }),
    FuelTank.create({
        name: 'ARK-MI-112 Argon Tank',
        cost: 1456,
        mass: 0.2684,
        size: new Set(["0"]),
        content: new Resources({Ar: 112_000}),
    }),
    FuelTank.create({
        name: 'ARK-MI-28 Argon Tank',
        cost: 364,
        mass: 0.0666,
        size: new Set(["0"]),
        content: new Resources({Ar: 28_000}),
    }),
    FuelTank.create({
        name: 'ARK-MI-56 Argon Tank',
        cost: 728,
        mass: 0.1332,
        size: new Set(["0"]),
        content: new Resources({Ar: 56_000}),
    }),
    FuelTank.create({
        name: 'ARH-025M Argon Tank',
        cost: 4160,
        mass: 0.7612,
        size: new Set(["1"]),
        content: new Resources({Ar: 320_000}),
    }),
    FuelTank.create({
        name: 'ARH-05M Argon Tank',
        cost: 8320,
        mass: 1.5223,
        size: new Set(["1"]),
        content: new Resources({Ar: 640_000}),
    }),
    FuelTank.create({
        name: 'ARH-1M Argon Tank',
        cost: 16_640,
        mass: 3.0447,
        size: new Set(["1"]),
        content: new Resources({Ar: 1_280_000}),
    }),
    FuelTank.create({
        name: 'ARG-10M Argon Tank',
        cost: 133_120,
        mass: 24.3576,
        size: new Set(["2"]),
        content: new Resources({Ar: 10_240_000}),
    }),
    FuelTank.create({
        name: 'ARG-2M Argon Tank',
        cost: 33_280,
        mass: 6.0894,
        size: new Set(["2"]),
        content: new Resources({Ar: 2_560_000}),
    }),
    FuelTank.create({
        name: 'ARG-5M Argon Tank',
        cost: 66_560,
        mass: 12.1788,
        size: new Set(["2"]),
        content: new Resources({Ar: 5_120_000}),
    }),
    FuelTank.create({
        name: 'LFR-01 Lithium Tank',
        cost: 232,
        mass: 0.0655,
        size: new Set(["R"]),
        content: new Resources({Li: 92}),
    }),
    FuelTank.create({
        name: 'LFR-08 Lithium Tank',
        cost: 2_218,
        mass: 0.6266,
        size: new Set(["R"]),
        content: new Resources({Li: 880}),
    }),
    FuelTank.create({
        name: 'LFT-C01 Lithium Tank',
        cost: 243,
        mass: 0.0684,
        size: new Set(["0"]),
        content: new Resources({Li: 96}),
    }),
    FuelTank.create({
        name: 'LFT-C02 Lithium Tank',
        cost: 485,
        mass: 0.1368,
        size: new Set(["0"]),
        content: new Resources({Li: 192}),
    }),
    FuelTank.create({
        name: 'LFT-C03 Lithium Tank',
        cost: 970,
        mass: 0.2741,
        size: new Set(["0"]),
        content: new Resources({Li: 385}),
    }),
    FuelTank.create({
        name: 'LFT-B1 Lithium Tank',
        cost: 2_772,
        mass: 0.7832,
        size: new Set(["1"]),
        content: new Resources({Li: 1100}),
    }),
    FuelTank.create({
        name: 'LFT-B2 Lithium Tank',
        cost: 5544,
        mass: 1.5664,
        size: new Set(["1"]),
        content: new Resources({Li: 2200}),
    }),
    FuelTank.create({
        name: 'LFT-B4 Lithium Tank',
        cost: 11_088,
        mass: 3.1328,
        size: new Set(["1"]),
        content: new Resources({Li: 4400}),
    }),
    FuelTank.create({
        name: 'LFT-A10 Lithium Tank',
        cost: 22_176,
        mass: 6.2656,
        size: new Set(["2"]),
        content: new Resources({Li: 8800}),
    }),
    FuelTank.create({
        name: 'LFT-A20 Lithium Tank',
        cost: 44_352,
        mass: 12.5312,
        size: new Set(["2"]),
        content: new Resources({Li: 17_600}),
    }),
    FuelTank.create({
        name: 'LFT-A40 Lithium Tank',
        cost: 88_705,
        mass: 25.0624,
        size: new Set(["2"]),
        content: new Resources({Li: 35_200}),
    }),
    FuelTank.create({
        name: 'H250-16 Cryogenic Tank [LH2]',
        cost: 2476,
        mass: 1.02,
        size: new Set(["2"]),
        content: new Resources({LH2: 12_000}),
    }),
    FuelTank.create({
        name: 'H250-16 Cryogenic Tank [LCH4]',
        cost: 5507,
        mass: 3.972,
        size: new Set(["2"]),
        content: new Resources({LCH4: 8000}),
    }),

    // TODO: others
]

export const _farFuture = [
    FuelTank.create({
        name: 'A-CY1-25 Antimatter storage container',
        cost: 187_500,
        mass: 0.5,
        size: new Set(["2"]),
        content: new Resources({Anti: 12_500}),
    }),
    FuelTank.create({
        name: 'A-CY1-25XL Antimatter storage container',
        cost: 375_000,
        mass: 1.0,
        size: new Set(["2"]),
        content: new Resources({Anti: 25_000}),
    }),
    FuelTank.create({
        name: 'A-CY1-5A Antimatter storage container',
        cost: 562_500,
        mass: 1.125,
        size: new Set(["4"]),
        content: new Resources({Anti: 37_500}),
    }),
    FuelTank.create({
        name: 'A-CY1-5B Antimatter storage container',
        cost: 1_125_000,
        mass: 2.25,
        size: new Set(["4"]),
        content: new Resources({Anti: 75_000}),
    }),
    FuelTank.create({
        name: 'A-CY1-5C Antimatter storage container',
        cost: 2_250_000,
        mass: 4.5,
        size: new Set(["4"]),
        content: new Resources({Anti: 150_000}),
    }),
    FuelTank.create({
        name: 'A-CY1-5D Antimatter storage container',
        cost: 4_500_000,
        mass: 9.0,
        size: new Set(["4"]),
        content: new Resources({Anti: 300_000}),
    }),
    FuelTank.create({
        name: 'A-R7NG Antiproton Storage ring',
        cost: 25_000,
        mass: 2.0,
        size: new Set(["5"]),
        content: new Resources({Anti: 0.1}),
    }),
    FuelTank.create({
        name: 'NTR-001 Radial Fissionables Tank [NSW]',
        cost: 76_000,
        mass: 12.6,
        size: new Set(["R"]),
        content: new Resources({NSW: 8000}),
    }),
    FuelTank.create({
        name: 'NTR-001 Radial Fissionables Tank [Frag]',
        cost: 40_800,
        mass: 0.346,
        size: new Set(["R"]),
        content: new Resources({Frag: 160}),
    }),
    FuelTank.create({
        name: 'NTR-002 Radial Fissionables Tank [NSW]',
        cost: 38_000,
        mass: 6.3,
        size: new Set(["R"]),
        content: new Resources({NSW: 4000}),
    }),
    FuelTank.create({
        name: 'NTR-002 Radial Fissionables Tank [Frag]',
        cost: 20_400,
        mass: 0.173,
        size: new Set(["R"]),
        content: new Resources({Frag: 80}),
    }),
    FuelTank.create({
        name: 'NTR-003 Radial Fissionables Tank [NSW]',
        cost: 19_000,
        mass: 3.15,
        size: new Set(["R"]),
        content: new Resources({NSW: 2000}),
    }),
    FuelTank.create({
        name: 'NTR-003 Radial Fissionables Tank [Frag]',
        cost: 10_200,
        mass: 0.086,
        size: new Set(["R"]),
        content: new Resources({Frag: 40}),
    }),
    FuelTank.create({
        name: 'NTS-001 Fissionables Tank [NSW]',
        cost: 304_000,
        mass: 50.4,
        size: new Set(["2"]),
        content: new Resources({NSW: 32_000}),
    }),
    FuelTank.create({
        name: 'NTS-001 Fissionables Tank [Frag]',
        cost: 163_200,
        mass: 1.382,
        size: new Set(["2"]),
        content: new Resources({Frag: 640}),
    }),
    FuelTank.create({
        name: 'NTS-002 Fissionables Tank [NSW]',
        cost: 152_000,
        mass: 25.2,
        size: new Set(["2"]),
        content: new Resources({NSW: 16_000}),
    }),
    FuelTank.create({
        name: 'NTS-002 Fissionables Tank [Frag]',
        cost: 81_600,
        mass: 0.691,
        size: new Set(["2"]),
        content: new Resources({Frag: 320}),
    }),
    FuelTank.create({
        name: 'NTS-003 Fissionables Tank [NSW]',
        cost: 76_000,
        mass: 12.6,
        size: new Set(["2"]),
        content: new Resources({NSW: 8000}),
    }),
    FuelTank.create({
        name: 'NTS-003 Fissionables Tank [Frag]',
        cost: 40_800,
        mass: 0.346,
        size: new Set(["2"]),
        content: new Resources({Frag: 160}),
    }),
    FuelTank.create({
        name: 'NTS-501 Fissionables Tank',
        cost: 798_000,
        mass: 132.300,
        size: new Set(["4"]),
        content: new Resources({NSW: 84_000}),
    }),
    FuelTank.create({
        name: 'NTS-502 Fissionables Tank',
        cost: 399_000,
        mass: 66.150,
        size: new Set(["4"]),
        content: new Resources({NSW: 42_000}),
    }),
    /* DO NOT include the MF-0, MF-1 and MF-2
     * These can only be transferred manually, so we don't want to take these
     * into account when calculating burns
     */
    FuelTank.create({
        name: 'OP 6x2 Nuclear Pulse Unit Tank',
        cost: 247_450,
        mass: 84.0,
        size: new Set(["4"]),
        content: new Resources({NUK: 1400}),
    }),
    FuelTank.create({
        name: 'OP 6x4 Nuclear Pulse Unit Tank',
        cost: 494_900,
        mass: 168.0,
        size: new Set(["4"]),
        content: new Resources({NUK: 2800}),
    }),
    FuelTank.create({
        name: 'OP 6x8 Nuclear Pulse Unit Tank',
        cost: 989_800,
        mass: 336.0,
        size: new Set(["4"]),
        content: new Resources({NUK: 5600}),
    }),
    FuelTank.create({
        name: 'PW x4 Nuclear Pellet Storage Container',
        cost: 201_600,
        mass: 19.2,
        size: new Set(["4"]),
        content: new Resources({FIP: 14_400}),
    }),
    FuelTank.create({
        name: 'PW x8 Nuclear Pellet Storage Container',
        cost: 403_200,
        mass: 33.5,
        size: new Set(["4"]),
        content: new Resources({FIP: 28_800}),
    }),
    FuelTank.create({
        name: 'ST-412 Fusion Fuel Tank [D]',
        cost: 607.20,
        mass: 0.234,
        size: new Set(["2"]),
        content: new Resources({D: 1200}),
    }),
    FuelTank.create({
        name: 'ST-412 Fusion Fuel Tank [He3]',
        cost: 6696,
        mass: 0.085,
        size: new Set(["2"]),
        content: new Resources({He3: 1200}),
    }),
    FuelTank.create({
        name: 'ST-824 Fusion Fuel Tank [D]',
        cost: 5692.5,
        mass: 2.355,
        size: new Set(["2"]),
        content: new Resources({D: 11_250}),
    }),
    FuelTank.create({
        name: 'ST-824 Fusion Fuel Tank [He3]',
        cost: 62_755,
        mass: 0.797,
        size: new Set(["2"]),
        content: new Resources({He3: 11_250}),
    }),
    FuelTank.create({
        name: 'ST-4L3 Fusion Fuel Tank [D]',
        cost: 1012,
        mass: 0.39,
        size: new Set(["3"]),
        content: new Resources({D: 2000}),
    }),
    FuelTank.create({
        name: 'ST-4L3 Fusion Fuel Tank [He3]',
        cost: 11_160,
        mass: 0.142,
        size: new Set(["3"]),
        content: new Resources({He3: 2000}),
    }),
    // TODO: others
]


function fuelTanksWithMods_(activeMods: Set<string> = new Set()): Array<FuelTank> {
    let parts: Array<FuelTank> = [..._fuelTanks]
    if(activeMods.has("NFT")) {
        parts = combineWithOverride(parts, _nearFuture)
    }
    if(activeMods.has("FFT")) {
        parts = combineWithOverride(parts, _farFuture)
    }
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
