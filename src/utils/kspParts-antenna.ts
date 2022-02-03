import Part, {Resources, Size} from "./kspParts";

export default class Antenna extends Part {
    power: number
    relay: boolean | null  // null for ground stations
    txSpeed: number  // Mit/sec
    // consumption is per Mit
    combinableExponent: number = 0.75

    static combinedPower(antennas: Antenna[], forRelay: boolean = false): number {
        // https://wiki.kerbalspaceprogram.com/wiki/CommNet#Combining_antennae
        let maxPower = 0;
        let sumPower = 0;
        let sumPowerCombi = 0;
        for(const antenna of antennas) {
            if(forRelay && !antenna.relay) continue;
            if(antenna.power > maxPower) maxPower = antenna.power;
            sumPower += antenna.power;
            sumPowerCombi += antenna.power * antenna.combinableExponent;
        }
        const avgCombinabilityExp = sumPowerCombi / sumPower;
        return maxPower * Math.pow(sumPower / maxPower, avgCombinabilityExp);
    }

    static maxRange(powerA: number, powerB: number): number {
        return Math.sqrt(powerA * powerB)
    }

    static signalStrength(powerA: number, powerB: number, distance: number) {
        // https://wiki.kerbalspaceprogram.com/wiki/CommNet#Signal_strength
        const rel_dist = 1 - distance / this.maxRange(powerA, powerB);
        if (rel_dist <= 0) return 0;
        return (3 - 2 * rel_dist) * rel_dist * rel_dist;
    }
}
export const antennas = {
    'KSC DSN Tier 1': Antenna.create({power: 2e9,  relay: null, combinableExponent: 0, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Tracking_Station#Levels"}),
    'KSC DSN Tier 2': Antenna.create({power: 50e9, relay: null, combinableExponent: 0, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Tracking_Station#Levels"}),
    'KSC DSN Tier 3': Antenna.create({power: 250e9, relay: null, combinableExponent: 0, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Tracking_Station#Levels"}),
    'Kerbin non-DSN': Antenna.create({power: 36e3, relay: null, combinableExponent: 0, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/CommNet#Difficulty_Settings_meanings"}),
    'pod built-in': Antenna.create({power: 5e3, relay: false}),
    'MPO Probe built-in': Antenna.create({power: 2e9, relay: true, txSpeed: 2.86, consumption: Resources.create({el: 24}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/MPO_Probe"}),
    'Communotron 16': Antenna.create({cost: 300, mass: 0.005, size: new Set([Size.TINY]), power: 500e3, relay: false, txSpeed: 3.33, consumption: Resources.create({el: 6}), combinableExponent: 1.0, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Communotron_16"}),
    'Communotron 16-S': Antenna.create({cost: 300, mass: 0.015, size: new Set([Size.RADIAL]), power: 500e3, relay: false, txSpeed: 3.33, consumption: Resources.create({el: 6}), combinableExponent: 0.0, wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Communotron_16-S"}),
    'Communotron DTS-M1': Antenna.create({cost: 900, mass: 0.05, size: new Set([Size.RADIAL]), power: 2e9, relay: false, txSpeed: 5.71, consumption: Resources.create({el: 6}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Communotron_DTS-M1"}),
    'Communotron HG-55': Antenna.create({cost: 1200, mass: 0.075, size: new Set([Size.RADIAL]), power: 15e9, relay: false, txSpeed: 20.0, consumption: Resources.create({el: 6.67}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Communotron_HG-55"}),
    'Communotron 88-88': Antenna.create({cost: 1500, mass: 0.1, size: new Set([Size.TINY]), power: 100e9, relay: false, txSpeed: 20.0, consumption: Resources.create({el: 10}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/Communotron_88-88"}),
    'HG-5': Antenna.create({cost: 600, mass: 0.07, size: new Set([Size.TINY]), power: 5e6, relay: true, txSpeed: 5.71, consumption: Resources.create({el: 9}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/HG-5_High_Gain_Antenna"}),
    'RA-2': Antenna.create({cost: 800, mass: 0.15, size: new Set([Size.TINY]), power: 2e9, relay: true, txSpeed: 2.86, consumption: Resources.create({el: 24}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RA-2_Relay_Antenna"}),
    'RA-15': Antenna.create({cost: 2400, mass: 0.3, size: new Set([Size.TINY]), power: 15e9, relay: true, txSpeed: 5.71, consumption: Resources.create({el: 12}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RA-15_Relay_Antenna"}),
    'RA-100': Antenna.create({cost: 3000, mass: 0.65, size: new Set([Size.TINY]), power: 100e9, relay: true, txSpeed: 11.43, consumption: Resources.create({el: 6}), wikiUrl: "https://wiki.kerbalspaceprogram.com/wiki/RA-100_Relay_Antenna"}),
};
