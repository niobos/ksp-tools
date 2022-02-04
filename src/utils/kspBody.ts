import {Data} from "dataclass";


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
export function bodiesHierFind(bodyName: string): string[] | null {
    /* Returns the hierarchical tree to the body, starting from Kerbol
     */
    if(bodyName === "Kerbol") return [bodyName];
    if(planets.includes(bodyName)) return ["Kerbol", bodyName];
    for(const system in bodiesHier) {
        if(bodiesHier[system].includes(bodyName)) {
            const planet = system.substring(0, system.length - 7);  // strip " system"
            return ["Kerbol", planet, bodyName];
        }
    }
    return null;
}

export default class Body extends Data {
    mass?: number  // kg
    radius?: number  // m
    solarDay?: number  // s
    atmosphere?: number  // m
    terrain?: number  // m
    soi?: number  // m
    scienceAtmosphereBorder?: number  // m
    scienceSpaceBorder?: number  // m
    wikiUrl?: string

    get gravity(): number | null {
        if(this.mass == null) return null;
        return 6.67430e-11 * this.mass;
    }
    static massFromGravity(gravity: number | null): number | null {
        if(gravity == null) return null;
        return gravity / 6.67430e-11;
    }

    get surface_gravity(): number | null {
        if(this.gravity == null || this.radius == null) return null;
        return this.gravity / this.radius / this.radius;
    }
}

export const bodies = {
    'Kerbol': Body.create({mass: 1.7565459e28, radius: 261_600_000, solarDay: undefined, atmosphere: 600_000, soi: Infinity, scienceSpaceBorder: 1e9, scienceAtmosphereBorder: 18e3}),
    'Moho': Body.create({mass: 2.5263314e21, radius: 250_000, solarDay: 2_665_723.4, atmosphere: 0, soi: 9_646_663, scienceSpaceBorder: 80e3}),
    'Eve': Body.create({mass: 1.2243980e23, radius: 700_000, solarDay: 81_661.857, atmosphere: 90_000, soi: 85_109_365, scienceSpaceBorder: 400e3, scienceAtmosphereBorder: 22e3}),
    'Gilly': Body.create({mass: 1.2420363e17, radius: 13_000, solarDay: 28_255, atmosphere: 0, soi: 126_123.27, scienceSpaceBorder: 6e3}),
    'Kerbin': Body.create({mass: 5.2915158e22, radius: 600_000, solarDay: 21_600, atmosphere: 70_000, terrain: 6764.1, soi: 84_159_286, scienceSpaceBorder: 250e3, scienceAtmosphereBorder: 18e3, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Kerbin"}),
    'Mun': Body.create({mass: 9.7599066e20, radius: 200_000, solarDay: 138_984.38, atmosphere: 0, terrain: 5029, soi: 2_429_559.1, scienceSpaceBorder: 60e3, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Mun"}),
    'Minmus': Body.create({mass: 2.6457580e19, radius: 60_000, solarDay: 40_400, atmosphere: 0, terrain: 5700, soi: 2_247_428.4, scienceSpaceBorder: 30e3, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Minmus"}),
    'Duna': Body.create({mass: 4.5154270e21, radius: 320_000, solarDay: 65_766.707, atmosphere: 50_000, terrain: 8264, soi: 47_921_949, scienceSpaceBorder: 140e3, scienceAtmosphereBorder: 12e3, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Duna"}),
    'Ike': Body.create({mass: 2.7821615e20, radius: 130_000, solarDay: 65_517.862, atmosphere: 0, soi: 1_049_598.9, scienceSpaceBorder: 50e3, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Ike"}),
    'Dres': Body.create({mass: 3.2190937e20, radius: 138_000, solarDay: 34_825.305, atmosphere: 0, terrain: 5700, soi: 32_832_840, scienceSpaceBorder: 25e3, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Dres"}),
    'Jool': Body.create({mass: 4.2332127e24, radius: 6_000_000, solarDay: 36_000, atmosphere: 200_000, soi: 2_455_985_200, scienceSpaceBorder: 4e6, scienceAtmosphereBorder: 120e3}),
    'Laythe': Body.create({mass: 2.9397311e22, radius: 500_000, solarDay: 52_980.879, atmosphere: 50_000, soi: 3_723_645.8, scienceSpaceBorder: 200e3, scienceAtmosphereBorder: 10e3}),
    'Vall': Body.create({mass: 3.1087655e21, radius: 300_000, solarDay: 105_962.09, atmosphere: 0, soi: 2_406_401.4, scienceSpaceBorder: 90e3}),
    'Tylo': Body.create({mass: 4.2332127e22, radius: 600_000, solarDay: 211_926.36, atmosphere: 0, soi: 10_856_518, scienceSpaceBorder: 250e3}),
    'Bop': Body.create({mass: 3.7261090e19, radius: 65_000, solarDay: 544_507.43, atmosphere: 0, soi: 1_221_060.9, scienceSpaceBorder: 25e3}),
    'Pol': Body.create({mass: 1.0813507e19, radius: 44_000, solarDay: 901_902.62, atmosphere: 0, soi: 1_042_138.9, scienceSpaceBorder: 22e3}),
    'Eeloo': Body.create({mass: 1.1149224e21, radius: 210_000, solarDay: 19_462.412, atmosphere: 0, soi: 119_082_940, scienceSpaceBorder: 60e3}),
};