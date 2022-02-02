import Part, {Resources, Size} from "./kspParts";

export default class Antenna extends Part {
    power: number
    relay: boolean
    txSpeed: number  // Mit/sec
    // consumption is per Mit
    combinableExponent: number = 0.75

    static combined(antennas: Antenna[], forRelay: boolean = false): Antenna {
        // https://wiki.kerbalspaceprogram.com/wiki/CommNet#Combining_antennae
        let maxPower = 0;
        let sumPower = 0;
        let sumPowerCombi = 0;
        let sumCost = 0;
        let sumMass = 0;
        for(const antenna of antennas) {
            sumCost += antenna.cost;
            sumMass += antenna.mass;
            if(forRelay && !antenna.relay) continue;
            if(antenna.power > maxPower) maxPower = antenna.power;
            sumPower += antenna.power;
            sumPowerCombi += antenna.power * antenna.combinableExponent;
        }
        const avgCombinabilityExp = sumPowerCombi / sumPower;
        const combinedPower = maxPower * Math.pow(sumPower / maxPower, avgCombinabilityExp);

        return Antenna.create({
            cost: sumCost,
            mass: sumMass,
            power: combinedPower,
            relay: forRelay,
            // TODO: how does speed change when combining antennas?
            // TODO: how does consumption change when combining antennas?
        });
    }
}
export const antennas = {
    'KSC DSN Tier 1': Antenna.create({power: 2e9, combinableExponent: 0}),
    'KSC DSN Tier 2': Antenna.create({power: 50e9, combinableExponent: 0}),
    'KSC DSN Tier 3': Antenna.create({power: 250e9, combinableExponent: 0}),
    'Kerbin non-DSN': Antenna.create({power: 36e3, combinableExponent: 0}),
    'pod built-in': Antenna.create({power: 5e3}),
    'Communotron 16': Antenna.create({cost: 300, mass: 0.005, size: new Set([Size.TINY]), power: 500e3, relay: false, txSpeed: 3.33, consumption: Resources.create({el: 6}), combinableExponent: 1.0}),
    'Communotron 16-S': Antenna.create({cost: 300, mass: 0.015, size: new Set([Size.RADIAL]), power: 500e3, relay: false, txSpeed: 3.33, consumption: Resources.create({el: 6}), combinableExponent: 0.0}),
    'Communotron DTS-M1': Antenna.create({cost: 900, mass: 0.05, size: new Set([Size.RADIAL]), power: 2e9, relay: false, txSpeed: 5.71, consumption: Resources.create({el: 6})}),
    'Communotron HG-55': Antenna.create({cost: 1200, mass: 0.075, size: new Set([Size.RADIAL]), power: 15e9, relay: false, txSpeed: 20.0, consumption: Resources.create({el: 6.67})}),
    'Communotron 88-88': Antenna.create({cost: 1500, mass: 0.1, size: new Set([Size.TINY]), power: 100e9, relay: false, txSpeed: 20.0, consumption: Resources.create({el: 10})}),
    'HG-5': Antenna.create({cost: 600, mass: 0.07, size: new Set([Size.TINY]), power: 5e6, relay: true, txSpeed: 5.71, consumption: Resources.create({el: 9})}),
    'RA-2': Antenna.create({cost: 800, mass: 0.15, size: new Set([Size.TINY]), power: 2e9, relay: true, txSpeed: 2.86, consumption: Resources.create({el: 24})}),
    'RA-15': Antenna.create({cost: 2400, mass: 0.3, size: new Set([Size.TINY]), power: 15e9, relay: true, txSpeed: 5.71, consumption: Resources.create({el: 12})}),
    'RA-100': Antenna.create({cost: 3000, mass: 0.65, size: new Set([Size.TINY]), power: 100e9, relay: true, txSpeed: 11.43, consumption: Resources.create({el: 6})}),
};
