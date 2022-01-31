

export const planets = ['Moho', 'Eve', 'Kerbin', 'Duna', 'Dres', 'Jool', 'Eeloo'];
export const bodiesHier = {
    'Kerbol system': 'Kerbol',
    'Moho system': 'Moho',
    'Eve system': ['Eve', 'Gilly'],
    'Kerbin system': ['Kerbin', 'Mun', 'Minmus'],
    'Duna system': ['Duna', 'Ike'],
    'Dres system': 'Dres',
    'Jool system': ['Jool', 'Laythe', 'Vall', 'Tylo', 'Bop', 'Pol'],
    'Eeloo system': 'Eeloo',
};
export function bodiesHierFind(bodyName) {
    /* Returns the hierarchical tree to the body, starting from Kerbol
     */
    if(bodyName === "Kerbol") return [bodyName];
    if(planets.includes(bodyName)) return ["Kerbol", bodyName];
    for(const system in bodiesHier) {
        if(bodiesHier[system].includes(bodyName)) {
            const planet = system.substr(0, system.length - 7);  // strip " system"
            return ["Kerbol", planet, bodyName];
        }
    }
    return null;
}

export default class Body {
    constructor(
        mass_kg,
        radius_m,
        solar_day_s,
        atmosphere_m,
        soi_m,
        science_space_border,
        science_atmosphere_border,
    ) {
        this.mass_kg = mass_kg;
        this.radius_m = radius_m;
        this.solar_day_s = solar_day_s;
        this.atmosphere_m = atmosphere_m;
        this.soi_m = soi_m;
    }

    get gravity() {
        return 6.67430e-11 * this.mass_kg;
    }
    set gravity(value) {
        this.mass_kg = value / 6.67430e-11;
    }

    get surface_gravity() {
        return this.gravity / this.radius_m / this.radius_m;
    }

    clone() {
        return new ksp.Body(this.mass_kg, this.radius_m, this.solar_day_s, this.atmosphere_m, this.soi_m);
    }
}

export const bodies = {
    'Kerbol': new Body(1.7565459e28, 261_600_000, undefined, 600_000, Infinity, 1e9, 18e3),
    'Moho': new Body(2.5263314e21, 250_000, 2_665_723.4, 0, 9_646_663, 80e3, undefined),
    'Eve': new Body(1.2243980e23, 700_000, 81_661.857, 90_000, 85_109_365, 400e3, 22e3),
    'Gilly': new Body(1.2420363e17, 13_000, 28_255, 0, 126_123.27, 6e3, undefined),
    'Kerbin': new Body(5.2915158e22, 600_000, 21_600, 70_000, 84_159_286, 250e3, 18e3),
    'Mun': new Body(9.7599066e20, 200_000, 138_984.38, 0, 2_429_559.1, 60e3, undefined),
    'Minmus': new Body(2.6457580e19, 60_000,40_400, 0, 2_247_428.4, 30e3, undefined),
    'Duna': new Body(4.5154270e21, 320_000, 65_766.707, 50_000, 47_921_949, 140e3, 12e3),
    'Ike': new Body(2.7821615e20, 130_000, 65_517.862, 0, 1_049_598.9, 50e3, undefined),
    'Dres': new Body(3.2190937e20, 138_000, 34_825.305, 0, 32_832_840, 25e3, undefined),
    'Jool': new Body(4.2332127e24, 6_000_000, 36_000, 200_000, 2_455_985_200, 4e6, 120e3),
    'Laythe': new Body(2.9397311e22, 500_000, 52_980.879, 50_000, 3_723_645.8, 200e3, 10e3),
    'Vall': new Body(3.1087655e21, 300_000, 105_962.09, 0, 2_406_401.4, 90e3, undefined),
    'Tylo': new Body(4.2332127e22, 600_000, 211_926.36, 0, 10_856_518, 250e3, undefined),
    'Bop': new Body(3.7261090e19, 65_000, 544_507.43, 0, 1_221_060.9, 25e3, undefined),
    'Pol': new Body(1.0813507e19, 44_000, 901_902.62, 0, 1_042_138.9, 22e3, undefined),
    'Eeloo': new Body(1.1149224e21, 210_000, 19_462.412, 0, 119_082_940, 60e3, undefined),
};