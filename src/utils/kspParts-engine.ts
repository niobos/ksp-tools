import Part, {Resources, Size} from "./kspParts";

export class Engine extends Part {
    gimbal: number = 0;  // degrees
    thrust: [number, number];  // atm, vac
    isp: [number, number];  // atm, vac
    throttleControl: boolean = true;
}

export const engines = {
    '24-77 "Twitch"': Engine.create({
        cost: 230,
        mass: 0.08,
        size: new Set([Size.RADIAL]),
        gimbal: 8,
        thrust: [15.172, 16],
        isp: [275, 290],
        consumption: Resources.create({lf: 0.506, ox: 0.619}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/24-77_%22Twitch%22_Liquid_Fuel_Engine"
    }),
    '48-7S "Spark"': Engine.create({
        cost: 240,
        mass: 0.13,
        size: new Set([Size.TINY]),
        gimbal: 3,
        thrust: [16.563, 20],
        isp: [265, 320],
        consumption: Resources.create({lf: 0.574, ox: 0.701}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/48-7S_%22Spark%22_Liquid_Fuel_Engine"
    }),
    'BACC "Thumper"': Engine.create({
        cost: 850,
        mass: 7.65,
        size: new Set([Size.SMALL, Size.RADIAL]),
        gimbal: 0,
        thrust: [250, 300],
        isp: [175, 210],
        consumption: Resources.create({lf: 19.423, ox: 820}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/BACC_%22Thumper%22_Solid_Fuel_Booster"
    }),
    'CR-7 R.A.P.I.E.R. (closed cycle)': Engine.create({
        cost: 6000,
        mass: 2.0,
        size: new Set([Size.SMALL]),
        gimbal: 3,
        thrust: [162.295, 180.0],
        isp: [275, 305],
        consumption: Resources.create({lf: 5.416, ox: 6.62}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/CR-7_R.A.P.I.E.R._Engine"
    }),
    'CR-7 R.A.P.I.E.R. (air breathing)': Engine.create({
        cost: 6000,
        mass: 2.0,
        size: new Set([Size.SMALL]),
        gimbal: 3,
        thrust: [465.642, 0],
        isp: [3200, 0],
        consumption: Resources.create({lf: 0.669, air: 4.015}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/CR-7_R.A.P.I.E.R._Engine"
    }),
    'F3S0 "Shrimp"': Engine.create({
        cost: 150,
        mass: 0.825,
        size: new Set([Size.TINY, Size.RADIAL]),
        gimbal: 0,
        thrust: [26.512, 30.0],
        isp: [190, 215],
        consumption: Resources.create({sf: 1.897}),
        content: Resources.create({sf: 90.0}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/F3S0_%22Shrimp%22_Solid_Fuel_Booster"
    }),
    'FM1 "Mite"': Engine.create({
        cost: 75,
        mass: 0.375,
        size: new Set([Size.TINY, Size.RADIAL]),
        gimbal: 0,
        thrust: [11.012, 12.5],
        isp: [185, 210],
        consumption: Resources.create({sf: 0.809}),
        content: Resources.create({sf: 40}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/FM1_%22Mite%22_Solid_Fuel_Booster"
    }),
    'IX-6315 "Dawn"': Engine.create({
        cost: 8000,
        mass: 0.25,
        size: new Set([Size.TINY]),
        gimbal: 0,
        thrust: [0.048, 2.0],
        isp: [100, 4200],
        consumption: Resources.create({xe: 0.486, el: 8.74}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/IX-6315_%22Dawn%22_Electric_Propulsion_System"
    }),
    'J-20 "Juno"': Engine.create({
        cost: 450,
        mass: 0.25,
        size: new Set([Size.TINY]),
        gimbal: 0,
        thrust: [20.6, 0],
        isp: [6400, 0],
        consumption: Resources.create({lf: 0.064, air: 1.402, el: -1}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/J-20_%22Juno%22_Basic_Jet_Engine"
    }),
    'J-33 "Wheesley"': Engine.create({
        cost: 1400,
        mass: 1.5,
        size: new Set([Size.SMALL]),
        gimbal: 0,
        thrust: [120, 0],
        isp: [10500, 0],
        consumption: Resources.create({lf: 0.233, air: 29.601, el: -4}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/J-33_%22Wheesley%22_Turbofan_Engine"
    }),
    'J-404 "Panther" (dry)': Engine.create({
        cost: 2000,
        mass: 1.2,
        size: new Set([Size.SMALL]),
        gimbal: 10,
        thrust: [107.885, 0],
        isp: [9000, 0],
        consumption: Resources.create({lf: 0.193, air: 7.705, el: -3}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/J-404_%22Panther%22_Afterburning_Turbofan"
    }),  // TO CHECK
    'J-404 "Panther" (afterburning)': Engine.create({
        cost: 2000,
        mass: 1.2,
        size: new Set([Size.SMALL]),
        gimbal: 10,
        thrust: [219.476, 0],
        isp: [4000, 0],
        consumption: Resources.create({lf: 0.663, air: 7.954, el: -5}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/J-404_%22Panther%22_Afterburning_Turbofan"
    }),  // TO CHECK
    'J-90 "Goliath"': Engine.create({
        cost: 2600,
        mass: 4.517,
        size: new Set([Size.RADIAL]),
        gimbal: 0,
        thrust: [360, 0],
        isp: [12600, 0],
        consumption: Resources.create({lf: 0.583, air: 132.272, el: -16}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/J-90_%22Goliath%22_Turbofan_Engine"
    }),  // TODO: has air intake
    'J-X4 "Whiplash"': Engine.create({
        cost: 2250,
        mass: 1.8,
        size: new Set([Size.SMALL]),
        gimbal: 1,
        thrust: [386.657, 0],
        isp: [4000, 0],
        consumption: Resources.create({lf: 0.663, air: 5.303, el: -5}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/J-X4_%22Whiplash%22_Turbo_Ramjet_Engine"
    }),
    'Kerbodyne KE-1 "Mastodon"': Engine.create({
        cost: 22000,
        mass: 5.0,
        size: new Set([Size.SMALL, Size.MEDIUM, Size.LARGE]),
        gimbal: 5,
        thrust: [1303.448, 1350.0],
        isp: [280, 290],
        consumption: Resources.create({lf: 42.723, ox: 52.217, el: -3}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Kerbodyne_KE-1_%22Mastodon%22_Liquid_Fuel_Engine"
    }),
    'Kerbodyne KR-2L+ "Rhino"': Engine.create({
        cost: 25000,
        mass: 9.0,
        size: new Set([Size.EXTRA_LARGE]),
        gimbal: 4,
        thrust: [1205.882, 2000.0],
        isp: [205, 340],
        consumption: Resources.create({lf: 53.985, ox: 65.982, el: -12}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Kerbodyne_KR-2L%2B_%22Rhino%22_Liquid_Fuel_Engine"
    }),
    'LFB KR-1x2 "Twin-Boar" (w/ fuel)': Engine.create({
        cost: 17000,
        mass: 42.5,
        size: new Set([Size.LARGE, Size.RADIAL]),
        gimbal: 1.5,
        thrust: [1866.667, 2000],
        isp: [280, 300],
        consumption: Resources.create({lf: 61.183, ox: 74.779}),
        content: Resources.create({lf: 2880, ox: 3520}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LFB_KR-1x2_%22Twin-Boar%22_Liquid_Fuel_Engine"
    }),
    'LFB KR-1x2 "Twin-Boar" (w/o fuel)': Engine.create({
        cost: 17000,
        mass: 42.5,
        size: new Set([Size.LARGE, Size.RADIAL]),
        gimbal: 1.5,
        thrust: [1866.667, 2000],
        isp: [280, 300],
        consumption: Resources.create({lf: 61.183, ox: 74.779}),
        content: Resources.create({lf: 2880, ox: 3520}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LFB_KR-1x2_%22Twin-Boar%22_Liquid_Fuel_Engine"
    }).emptied(),
    'LV-1 "Ant"': Engine.create({
        cost: 110,
        mass: 0.02,
        size: new Set([Size.TINY, Size.RADIAL]),
        gimbal: 0,
        thrust: [0.508, 2],
        isp: [80, 315],
        consumption: Resources.create({lf: 0.058, ox: 0.071}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-1_%22Ant%22_Liquid_Fuel_Engine"
    }),
    'LV-1R "Spider"': Engine.create({
        cost: 120,
        mass: 0.02,
        size: new Set([Size.RADIAL]),
        gimbal: 10,
        thrust: [1.793, 2.0],
        isp: [260, 290],
        consumption: Resources.create({lf: 0.063, ox: 0.077}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-1R_%22Spider%22_Liquid_Fuel_Engine"
    }),
    'LV-909 "Terrier"': Engine.create({
        cost: 390,
        mass: 0.5,
        size: new Set([Size.SMALL]),
        gimbal: 4,
        thrust: [14.783, 60.0],
        isp: [85, 345],
        consumption: Resources.create({lf: 1.596, ox: 1.951}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-909_%22Terrier%22_Liquid_Fuel_Engine"
    }),
    'LV-N "Nerv"': Engine.create({
        cost: 10000,
        mass: 3.0,
        size: new Set([Size.SMALL]),
        gimbal: 0,
        thrust: [13.875, 60.0],
        isp: [185, 800],
        consumption: Resources.create({lf: 1.53, el: -5}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-N_%22Nerv%22_Atomic_Rocket_Motor"
    }),
    'LV-T30 "Reliant"': Engine.create({
        cost: 1100,
        mass: 1.25,
        size: new Set([Size.SMALL]),
        gimbal: 0,
        thrust: [205.161, 240.0],
        isp: [265, 310],
        consumption: Resources.create({lf: 7.105, ox: 8.684, el: -7}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-T30_%22Reliant%22_Liquid_Fuel_Engine"
    }),
    'LV-T45 "Swivel"': Engine.create({
        cost: 1200,
        mass: 1.5,
        size: new Set([Size.SMALL]),
        gimbal: 3,
        thrust: [167.969, 215],
        isp: [250, 320],
        consumption: Resources.create({lf: 6.166, ox: 7.536, el: -6}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-T45_%22Swivel%22_Liquid_Fuel_Engine"
    }),
    'LV-T91 "Cheetah"': Engine.create({
        cost: 1000,
        mass: 1.0,
        size: new Set([Size.MEDIUM]),
        gimbal: 3,
        thrust: [54.348, 125.0],
        isp: [150, 345],
        consumption: Resources.create({lf: 3.325, ox: 4.064, el: -3}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-T91_%22Cheetah%22_Liquid_Fuel_Engine"
    }),
    'LV-TX87 "Bobcat"': Engine.create({
        cost: 2000,
        mass: 2.0,
        size: new Set([Size.MEDIUM]),
        gimbal: 5,
        thrust: [374.194, 400],
        isp: [290, 310],
        consumption: Resources.create({lf: 11.842, ox: 14.473, el: -3}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/LV-TX87_%22Bobcat%22_Liquid_Fuel_Engine"
    }),
    'Mk-55 "Thud"': Engine.create({
        cost: 820,
        mass: 0.9,
        size: new Set([Size.RADIAL]),
        gimbal: 8,
        thrust: [108.197, 120],
        isp: [275, 305],
        consumption: Resources.create({lf: 3.611, ox: 4.413}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mk-55_%22Thud%22_Liquid_Fuel_Engine"
    }),
    'O-10 "Puff"': Engine.create({
        cost: 150,
        mass: 0.09,
        size: new Set([Size.RADIAL]),
        gimbal: 6,
        thrust: [9.6, 20],
        isp: [120, 250],
        consumption: Resources.create({mono: 2.039}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/O-10_%22Puff%22_MonoPropellant_Fuel_Engine"
    }),
    'RE-I2 "Skiff"': Engine.create({
        cost: 1500,
        mass: 1.0,
        size: new Set([Size.LARGE]),
        gimbal: 2,
        thrust: [240.909, 300],
        isp: [265, 330],
        consumption: Resources.create({lf: 8.343, ox: 10.197, el: -3}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RE-I2_%22Skiff%22_Liquid_Fuel_Engine"
    }),
    'RE-I5 "Skipper"': Engine.create({
        cost: 5300,
        mass: 3.0,
        size: new Set([Size.LARGE]),
        gimbal: 2,
        thrust: [568.75, 650],
        isp: [280, 320],
        consumption: Resources.create({lf: 18.642, ox: 22.784, el: -10}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RE-I5_%22Skipper%22_Liquid_Fuel_Engine"
    }),
    'RE-J10 "Wolfhound"': Engine.create({
        cost: 1680,
        mass: 2.5,
        size: new Set([Size.LARGE]),
        gimbal: 3,
        thrust: [63.714, 375.0],
        isp: [70, 412],
        consumption: Resources.create({lf: 8.353, ox: 10.21, el: -8}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RE-J10_%22Wolfhound%22_Liquid_Fuel_Engine"
    }),
    'RE-L10 "Poodle"': Engine.create({
        cost: 1300,
        mass: 1.75,
        size: new Set([Size.LARGE]),
        gimbal: 5,
        thrust: [64.286, 250.0],
        isp: [90, 350],
        consumption: Resources.create({lf: 6.555, ox: 8.012, el: -8}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RE-L10_%22Poodle%22_Liquid_Fuel_Engine"
    }),
    'RE-M3 "Mainsail"': Engine.create({
        cost: 13000,
        mass: 6.0,
        size: new Set([Size.LARGE]),
        gimbal: 2,
        thrust: [1379.032, 1500],
        isp: [285, 310],
        consumption: Resources.create({lf: 44.407, ox: 54.275, el: -12}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RE-M3_%22Mainsail%22_Liquid_Fuel_Engine"
    }),
    'RK-7 "Kodiak"': Engine.create({
        cost: 1300,
        mass: 1.25,
        size: new Set([Size.MEDIUM]),
        gimbal: 0,
        thrust: [208.525, 240],
        isp: [265, 305],
        consumption: Resources.create({lf: 7.222, ox: 8.826, el: -3}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RK-7_%22Kodiak%22_Liquid_Fueled_Engine"
    }),
    'RT-10 "Hammer"': Engine.create({
        cost: 400,
        mass: 3.5625,
        size: new Set([Size.SMALL, Size.RADIAL]),
        gimbal: 0,
        thrust: [197.897, 227.0],
        isp: [170, 195],
        consumption: Resources.create({sf: 15.827}),
        content: Resources.create({sf: 375}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RT-10_%22Hammer%22_Solid_Fuel_Booster"
    }),
    'RT-5 "Flea"': Engine.create({
        cost: 200,
        mass: 1.5,
        size: new Set([Size.SMALL, Size.RADIAL]),
        gimbal: 0,
        thrust: [162.909, 192.0],
        isp: [140, 165],
        consumption: Resources.create({sf: 15.821}),
        content: Resources.create({sf: 140}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RT-5_%22Flea%22_Solid_Fuel_Booster"
    }),
    'RV-1 "Cub"': Engine.create({
        cost: 1000,
        mass: 0.18,
        size: new Set([Size.RADIAL]),
        gimbal: 22.5,
        thrust: [33.75, 40],
        isp: [270, 320],
        consumption: Resources.create({lf: 1.147, ox: 1.402}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RV-1_%22Cub%22_Vernier_Engine"
    }),
    'S1 SRB-KD25k "Kickback"': Engine.create({
        cost: 2700,
        mass: 24.0,
        size: new Set([Size.SMALL, Size.RADIAL]),
        gimbal: 0,
        thrust: [593.864, 670],
        isp: [195, 220],
        consumption: Resources.create({lf: 41.407, ox: 2600}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/S1_SRB-KD25k_%22Kickback%22_Solid_Fuel_Booster"
    }),
    'S2-17 "Thoroughbred"': Engine.create({
        cost: 9000,
        mass: 70.0,
        size: new Set([Size.LARGE, Size.RADIAL]),
        gimbal: 0,
        thrust: [1515.217, 1700],
        isp: [205, 230],
        consumption: Resources.create({sf: 100.494}),
        content: Resources.create({sf: 8000}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/S2-17_%22Thoroughbred%22_Solid_Fuel_Booster"
    }),
    'S2-33 "Clydesdale"': Engine.create({
        cost: 18500,
        mass: 144,
        size: new Set([Size.LARGE, Size.RADIAL]),
        gimbal: 1,
        thrust: [2948.936, 3300],
        isp: [210, 235],
        consumption: Resources.create({sf: 190.926}),
        content: Resources.create({sf: 16400}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/S2-33_%22Clydesdale%22_Solid_Fuel_Booster"
    }),
    'S3 KS-25 "Vector"': Engine.create({
        cost: 18000,
        mass: 4,
        size: new Set([Size.SMALL, Size.RADIAL]),
        gimbal: 10.5,
        thrust: [936.508, 1000],
        isp: [295, 315],
        consumption: Resources.create({lf: 29.135, ox: 35.609, el: -3}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/S3_KS-25_%22Vector%22_Liquid_Fuel_Engine"
    }),
    'S3 KS-25x4 "Mammoth"': Engine.create({
        cost: 39000,
        mass: 15,
        size: new Set([Size.EXTRA_LARGE]),
        gimbal: 2,
        thrust: [3746.032, 4000],
        isp: [295, 315],
        consumption: Resources.create({lf: 116.539, ox: 142.437, el: -12}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/S3_KS-25x4_%22Mammoth%22_Liquid_Fuel_Engine"
    }),
    'Separatron I': Engine.create({
        cost: 75,
        mass: 0.0725,
        size: new Set([Size.RADIAL]),
        gimbal: 0,
        thrust: [13.792, 18],
        isp: [118, 154],
        consumption: Resources.create({sf: 1.589}),
        content: Resources.create({sf: 8}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Sepratron_I"
    }),
    'T-1 Aerospike "Dart"': Engine.create({
        cost: 3850,
        mass: 1.0,
        size: new Set([Size.SMALL, Size.RADIAL]),
        gimbal: 0,
        thrust: [153.529, 180],
        isp: [290, 340],
        consumption: Resources.create({lf: 4.859, ox: 5.938, el: -5}),
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/T-1_Toroidal_Aerospike_%22Dart%22_Liquid_Fuel_Engine"
    }),
    'THK "Pollux"': Engine.create({
        cost: 6000,
        mass: 51.5,
        size: new Set([Size.MEDIUM, Size.RADIAL]),
        gimbal: 0,
        thrust: [1155.556, 1300],
        isp: [200, 225],
        consumption: Resources.create({sf: 78.556}),
        content: Resources.create({sf: 5800}),
        throttleControl: false,
        wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/THK_%22Pollux%22_Solid_Fuel_Booster"
    }),
};