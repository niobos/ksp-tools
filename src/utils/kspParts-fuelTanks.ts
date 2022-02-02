import Part, {Resources, Size} from "./kspParts";

export class FuelTank extends Part {}

export const fuelTanks = {
    '2.5m to Mk2 Adapter': FuelTank.create({
        cost: 800,
        mass: 4.57,
        size: new Set([Size.LARGE, Size.MK2]),
        content: Resources.create({lf: 360, ox: 440})
    }),
    'C7 Brand Adapter (2.5m to 1.25m)': FuelTank.create({
        cost: 800,
        mass: 4.57,
        size: new Set([Size.SMALL, Size.LARGE]),
        content: Resources.create({lf: 360, ox: 440})
    }),
    'FL-A150 Fuel Tank Adapter': FuelTank.create({
        cost: 160,
        mass: 0.9,
        size: new Set([Size.TINY, Size.MEDIUM]),
        content: Resources.create({lf: 72, ox: 88})
    }),
    'FL-A151L Fuel Tank Adapter': FuelTank.create({
        cost: 600,
        mass: 3.375,
        size: new Set([Size.SMALL, Size.MEDIUM]),
        content: Resources.create({lf: 270, ox: 330})
    }),
    'FL-A151S Fuel Tank Adapter': FuelTank.create({
        cost: 160,
        mass: 0.9,
        size: new Set([Size.SMALL, Size.MEDIUM]),
        content: Resources.create({lf: 72, ox: 88})
    }),
    'FL-A215 Fuel Tank Adapter': FuelTank.create({
        cost: 1200,
        mass: 6.75,
        size: new Set([Size.MEDIUM, Size.LARGE]),
        content: Resources.create({lf: 540, ox: 660})
    }),
    'FL-C1000 Fuel Tank': FuelTank.create({
        cost: 1400,
        mass: 6.78,
        size: new Set([Size.MEDIUM]),
        content: Resources.create({lf: 540, ox: 660})
    }),  // includes separator SRB
    'FL-R1 RCS Fuel Tank': FuelTank.create({
        cost: 1800,
        mass: 3.4,
        size: new Set([Size.LARGE]),
        content: Resources.create({mono: 750})
    }),  // TODO: check size
    'FL-R10 RCS Fuel Tank': FuelTank.create({
        cost: 200,
        mass: 0.1,
        size: new Set([Size.TINY]),
        content: Resources.create({mono: 20})
    }),  // TODO: check size
    'FL-R25 RCS Fuel Tank': FuelTank.create({
        cost: 330,
        mass: 0.56,
        size: new Set([Size.SMALL]),
        content: Resources.create({mono: 120})
    }),  // TODO: check size
    'FL-R5 RCS Fuel Tank': FuelTank.create({
        cost: 960,
        mass: 1.85,
        size: new Set([Size.MEDIUM]),
        content: Resources.create({mono: 400})
    }),  // TODO: check size
    'FL-T100 Fuel Tank': FuelTank.create({
        cost: 150,
        mass: 0.5625,
        size: new Set([Size.SMALL, Size.RADIAL]),
        content: Resources.create({lf: 45, ox: 55})
    }),
    'FL-T200 Fuel Tank': FuelTank.create({
        cost: 275,
        mass: 1.125,
        size: new Set([Size.SMALL, Size.RADIAL]),
        content: Resources.create({lf: 90, ox: 110})
    }),
    'FL-T400 Fuel Tank': FuelTank.create({
        cost: 500,
        mass: 2.25,
        size: new Set([Size.SMALL, Size.RADIAL]),
        content: Resources.create({lf: 180, ox: 220})
    }),
    'FL-T800 Fuel Tank': FuelTank.create({
        cost: 800,
        mass: 4.5,
        size: new Set([Size.SMALL, Size.RADIAL]),
        content: Resources.create({lf: 360, ox: 440})
    }),
    'FL-TX1800 Fuel Tank': FuelTank.create({
        cost: 1800,
        mass: 10.125,
        size: new Set([Size.MEDIUM]),
        content: Resources.create({lf: 810, ox: 990})
    }),
    'FL-TX220 Fuel Tank': FuelTank.create({
        cost: 220,
        mass: 1.2375,
        size: new Set([Size.MEDIUM]),
        content: Resources.create({lf: 99, ox: 121})
    }),
    'FL-TX440 Fuel Tank': FuelTank.create({
        cost: 440,
        mass: 2.475,
        size: new Set([Size.MEDIUM]),
        content: Resources.create({lf: 198, ox: 242})
    }),
    'FL-TX900 Fuel Tank': FuelTank.create({
        cost: 900,
        mass: 5.0625,
        size: new Set([Size.MEDIUM]),
        content: Resources.create({lf: 405, ox: 495})
    }),
    'Kerbodyne ADTP-2-3': FuelTank.create({
        cost: 1623,
        mass: 16.875,
        size: new Set([Size.LARGE, Size.EXTRA_LARGE]),
        content: Resources.create({lf: 1350, ox: 1650})
    }),
    'kerbodyne Engine Cluster Adapter Tank': FuelTank.create({
        cost: 9000,
        mass: 50.625,
        size: new Set([Size.HUGE, Size.SMALL]),
        content: Resources.create({lf: 4050, ox: 4950})
    }),
    'Kerbodyne S3-14400 Tank': FuelTank.create({
        cost: 13_000,
        mass: 81,
        size: new Set([Size.EXTRA_LARGE]),
        content: Resources.create({lf: 6480, ox: 7920})
    }),
    'Kerbodyne S3-3600 Tank': FuelTank.create({
        cost: 3250,
        mass: 20.25,
        size: new Set([Size.EXTRA_LARGE]),
        content: Resources.create({lf: 1620, ox: 1980})
    }),
    'Kerbodyne S3-7200 Tank': FuelTank.create({
        cost: 6500,
        mass: 40.5,
        size: new Set([Size.EXTRA_LARGE]),
        content: Resources.create({lf: 3240, ox: 3960})
    }),
    'Kerbodyne S3-S4 Adapter Tank': FuelTank.create({
        cost: 6400,
        mass: 36,
        size: new Set([Size.EXTRA_LARGE, Size.HUGE]),
        content: Resources.create({lf: 2880, ox: 3520})
    }),
    'Kerbodyne S4-128 Fuel Tank': FuelTank.create({
        cost: 12_800,
        mass: 72,
        size: new Set([Size.HUGE]),
        content: Resources.create({lf: 5760, ox: 7040})
    }),
    'Kerbodyne S4-256 Fuel Tank': FuelTank.create({
        cost: 25_600,
        mass: 144,
        size: new Set([Size.HUGE]),
        content: Resources.create({lf: 11_520, ox: 14_080})
    }),
    'Kerbodyne S4-512 Fuel Tank': FuelTank.create({
        cost: 51_200,
        mass: 288,
        size: new Set([Size.HUGE]),
        content: Resources.create({lf: 23_040, ox: 28_160})
    }),
    'Kerbodyne S4-64 Fuel Tank': FuelTank.create({
        cost: 6400,
        mass: 36,
        size: new Set([Size.HUGE]),
        content: Resources.create({lf: 2880, ox: 3520})
    }),
    'Large Holding Tank': FuelTank.create({
        cost: 3000,
        mass: 2 + 15,
        size: new Set([Size.LARGE]),
        content: Resources.create({ore: 1500})
    }),
    'Mk0 Liquid Fuel Tank': FuelTank.create({
        cost: 200,
        mass: 0.275,
        size: new Set([Size.TINY]),
        content: Resources.create({lf: 50})
    }),
    'Mk1 Liquid Fuel Tank': FuelTank.create({
        cost: 550,
        mass: 2.25,
        size: new Set([Size.SMALL]),
        content: Resources.create({lf: 400})
    }),
    'Mk2 Bicoupler': FuelTank.create({
        cost: 860,
        mass: 2.29,
        size: new Set([Size.SMALL, Size.MK2]),
        content: Resources.create({lf: 180, ox: 220})
    }),
    'Mk2 Liquid Fuel Fuselage': FuelTank.create({
        cost: 1450,
        mass: 4.57,
        size: new Set([Size.MK2]),
        content: Resources.create({lf: 800})
    }),
    'Mk2 Liquid Fuel Fuselage Short': FuelTank.create({
        cost: 750,
        mass: 2.29,
        size: new Set([Size.MK2]),
        content: Resources.create({lf: 400})
    }),
    'Mk2 Monopropellant Tank': FuelTank.create({
        cost: 750,
        mass: 1.89,
        size: new Set([Size.MK2]),
        content: Resources.create({mono: 400})
    }),
    'Mk2 Rocket Fuel Fuselage': FuelTank.create({
        cost: 1450,
        mass: 4.57,
        size: new Set([Size.MK2]),
        content: Resources.create({lf: 360, ox: 440})
    }),
    'Mk2 Rocket Fuel Fuselage Short': FuelTank.create({
        cost: 750,
        mass: 2.29,
        size: new Set([Size.MK2]),
        content: Resources.create({lf: 180, ox: 220})
    }),
    'Mk2 to 1.25m Adapter': FuelTank.create({
        cost: 550,
        mass: 2.29,
        size: new Set([Size.MK2, Size.SMALL]),
        content: Resources.create({lf: 180, ox: 220})
    }),
    'Mk2 to 1.25m Adapter Long': FuelTank.create({
        cost: 1050,
        mass: 4.57,
        size: new Set([Size.MK2, Size.SMALL]),
        content: Resources.create({lf: 360, ox: 440})
    }),
    'Mk3 Liquid Fuel Fuselage': FuelTank.create({
        cost: 8600,
        mass: 28.57,
        size: new Set([Size.MK3]),
        content: Resources.create({lf: 5000})
    }),
    'Mk3 Liquid Fuel Fuselage Long': FuelTank.create({
        cost: 17_200,
        mass: 57.14,
        size: new Set([Size.MK3]),
        content: Resources.create({lf: 10_000})
    }),
    'Mk3 Liquid Fuel Fuselage Short': FuelTank.create({
        cost: 4300,
        mass: 14.29,
        size: new Set([Size.MK3]),
        content: Resources.create({lf: 2500})
    }),
    'Mk3 Monopropellant Tank': FuelTank.create({
        cost: 5040,
        mass: 9.8,
        size: new Set([Size.MK3]),
        content: Resources.create({mono: 2100})
    }),
    'Mk3 Rocket Fuel Fuselage': FuelTank.create({
        cost: 5000,
        mass: 28.57,
        size: new Set([Size.MK3]),
        content: Resources.create({lf: 2250, ox: 2750})
    }),
    'Mk3 Rocket Fuel Fuselage Long': FuelTank.create({
        cost: 10_000,
        mass: 57.14,
        size: new Set([Size.MK3]),
        content: Resources.create({lf: 4500, ox: 5500})
    }),
    'Mk3 Rocket Fuel Fuselage Short': FuelTank.create({
        cost: 2500,
        mass: 14.29,
        size: new Set([Size.MK3]),
        content: Resources.create({lf: 1125, ox: 1375})
    }),
    'Mk3 to 2.5m Adapter': FuelTank.create({
        cost: 2500,
        mass: 14.29,
        size: new Set([Size.MK3, Size.LARGE]),
        content: Resources.create({lf: 1125, ox: 1375})
    }),
    'Mk3 to 3.75m Adapter': FuelTank.create({
        cost: 2500,
        mass: 14.29,
        size: new Set([Size.MK3, Size.EXTRA_LARGE]),
        content: Resources.create({lf: 1125, ox: 1375})
    }),
    'Mk3 to Mk2 Adapter': FuelTank.create({
        cost: 2200,
        mass: 11.43,
        size: new Set([Size.MK3, Size.MK2]),
        content: Resources.create({lf: 900, ox: 1100})
    }),
    'NCS Adapter': FuelTank.create({
        cost: 320,
        mass: 0.5,
        size: new Set([Size.TINY, Size.SMALL]),
        content: Resources.create({lf: 80})
    }),
    'Oscar-B Fuel Tank': FuelTank.create({
        cost: 70,
        mass: 0.225,
        size: new Set([Size.TINY]),
        content: Resources.create({lf: 18, ox: 22})
    }),
    'PB-X150 Xenon Container': FuelTank.create({
        cost: 3680,
        mass: 0.096,
        size: new Set([Size.TINY]),
        content: Resources.create({xe: 720})
    }),
    'PB-X50R Xenon Container': FuelTank.create({
        cost: 2220,
        mass: 0.054,
        size: new Set([Size.RADIAL]),
        content: Resources.create({xe: 405})
    }),
    'PB-X750 Xenon Container': FuelTank.create({
        cost: 24_300,
        mass: 0.76,
        size: new Set([Size.SMALL]),
        content: Resources.create({xe: 5700})
    }),
    'R-11 "Baguette" External Tank': FuelTank.create({
        cost: 50,
        mass: 0.3038,
        size: new Set([Size.RADIAL]),
        content: Resources.create({lf: 24.3, ox: 29.7})
    }),
    'R-12 "Doughnut" External Tank': FuelTank.create({
        cost: 147,
        mass: 0.3375,
        size: new Set([Size.SMALL]),
        content: Resources.create({lf: 27, ox: 33})
    }),
    'R-4 "Dumpling" External Tank': FuelTank.create({
        cost: 50,
        mass: 0.1238,
        size: new Set([Size.RADIAL]),
        content: Resources.create({lf: 9.9, ox: 12.1})
    }),
    'Radial Holding Tank': FuelTank.create({
        cost: 300,
        mass: 0.125 + .75,
        size: new Set([Size.RADIAL]),
        content: Resources.create({ore: 75})
    }),
    'Rockomax Jumbo-64 Fuel Tank': FuelTank.create({
        cost: 5750,
        mass: 36,
        size: new Set([Size.LARGE]),
        content: Resources.create({lf: 2880, ox: 3520})
    }),
    'Rockomax X200-16 Fuel Tank': FuelTank.create({
        cost: 1550,
        mass: 9,
        size: new Set([Size.LARGE]),
        content: Resources.create({lf: 720, ox: 880})
    }),
    'Rockomax X200-32 Fuel Tank': FuelTank.create({
        cost: 3000,
        mass: 18,
        size: new Set([Size.LARGE]),
        content: Resources.create({lf: 1440, ox: 1760})
    }),
    'Rockomax X200-8 Fuel Tank': FuelTank.create({
        cost: 800,
        mass: 4.5,
        size: new Set([Size.LARGE]),
        content: Resources.create({lf: 360, ox: 440})
    }),
    'Small Holding Tank': FuelTank.create({
        cost: 1000,
        mass: 0.5 + 3.00,
        size: new Set([Size.SMALL]),
        content: Resources.create({ore: 300})
    }),
    'Stratus-V Cylindrified Monopropellant Tank': FuelTank.create({
        cost: 250,
        mass: 0.23,
        size: new Set([Size.RADIAL]),
        content: Resources.create({mono: 50})
    }),
    'Stratus-V Minified Monopropellant Tank': FuelTank.create({
        cost: 30,
        mass: 0.04,
        size: new Set([Size.RADIAL]),
        content: Resources.create({mono: 7.5})
    }),
    'Stratus-V Roundified Monopropellant Tank': FuelTank.create({
        cost: 200,
        mass: 0.1,
        size: new Set([Size.RADIAL]),
        content: Resources.create({mono: 20})
    }),
};