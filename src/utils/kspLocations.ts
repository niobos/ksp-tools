import {Location} from "./location";

function degToRad(deg: number): number {
    return deg / 180 * Math.PI;
}

function dmsToRad(deg: number, min: number, sec: number): number {
    return degToRad(deg + min/60 + sec/3600);
}

export const groundstations = {
    'Kerbal Space Center': Location.create({
        latitude: -dmsToRad(0, 6, 9),
        longitude: -dmsToRad(74, 34, 31),
        altitude: 68.41,
    }),
    'Woomerang Launch Site': Location.create({
        latitude: dmsToRad(45, 7, 24),
        longitude: dmsToRad(136, 6, 36),
        altitude: 739,
    }),
    'Dessert Launch Site': Location.create({
        latitude: -dmsToRad(6, 33, 37),
        longitude: -dmsToRad(143, 57, 0),
        altitude: 824,
    }),
    'Island Airfield': Location.create({
        latitude: -dmsToRad(1, 32,27),
        longitude: -dmsToRad(71, 54, 35),
        altitude: 117,
    }),
    'Inland Kerbal Space Center': Location.create({
        latitude: dmsToRad(20, 40, 0),
        longitude: -dmsToRad(146, 28, 0),
        altitude: 422,
    }),
    'Glacier Lake Launch Site': Location.create({
        latitude: degToRad(73.56),
        longitude: degToRad(84.27),
    }),
    'Cove Launch Site': Location.create({
        latitude: degToRad(3.70),
        longitude: degToRad(-72.20),
    }),
    'Mahi Mahi Launch Site': Location.create({
        latitude: degToRad(-49.80),
        longitude: degToRad(-120.77),
    }),
    'Crater Launch Site': Location.create({
        latitude: degToRad(8.39),
        longitude: degToRad(-179.68),
    }),
    'Crater Rim': Location.create({latitude: degToRad(9.45), longitude: degToRad(-172.110278)}),
    'Nye Island': Location.create({latitude: degToRad(5.363611), longitude: degToRad(108.548056)}),
    'Harvester Massif': Location.create({latitude: degToRad(-11.95), longitude: degToRad(33.740278)}),
    'North Station One': Location.create({latitude: degToRad(63.095), longitude: degToRad(-90.079722)}),
    'Mesa South': Location.create({latitude: degToRad(-59.589722), longitude: degToRad(-25.861667)}),
}
