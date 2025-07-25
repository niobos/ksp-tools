import {Data} from "./data/data";
import {objectFilter, objectMap} from "./utils";

export const resourceInfo: Record<string, {name: string, cost: number, mass: number}> = {
    LF: {name: "Liquid Fuel", cost: 0.8, mass: 0.005},
    Ox: {name: "Oxidizer", cost: 0.16, mass: 0.005},
    SF: {name: "Solid Fuel", cost: 0.6, mass: 0.0075},
    Mono: {name: "Monopropellant", cost: 1.2, mass: 0.004},
    Xe: {name: "Xenon", cost: 4.0, mass: 0.0001},
    El: {name: "Electric Charge", cost: 0, mass: 0},
    Ore: {name: "Ore", cost: 0.02, mass: 0.010},
    Air: {name: "Air", cost: 0, mass: 0},
    Abl: {name: "Ablator", cost: 0.5, mass: 0.001},

    Ar: {name: "Argon", cost: (140620 - 33100) / 10240000, mass: 18.27 / 10240000},
    LH2: {name: "Liquid Hydrogen", cost: (199310.4 - 135806.4) / 1728000, mass: (146.915 - 24.486) / 1728000},
    LCH4: {name: "Liquid Methane", cost: (647294.4 - 128894.4) / 1152000, mass: (572.02 - 81.717) / 1152000},
    Li: {name: "Lithium", cost: (96205 - 74821) / 35200, mass: 18.80 / 35200},
    EnrU: {name: "Enriched Uranium", cost: 830400 / 960, mass: 10.53 / 960},
    DeplU: {name: "Depleted Uranium", cost: 830400 / 960, mass: 10.53 / 960},
    SC: {name: "Stored Charge", cost: 0, mass: 0},

    Anti: {name: "Antimatter", cost: 3000000/300000, mass: 3/300_000},
    NSW: {name: "Nuclear Salt Water", cost: 336000/84000, mass: 88.20/84000},
    NUK: {name: "Nuclear Pulse Units", cost: 980000/5600, mass: 280/5600},
    FIP: {name: "Fission Pellets", cost: 345600/28800, mass: 28.80/28800},
    Frag: {name: "Fissionable Particles", cost: (163200-131200)/640, mass: (1.382-0.461)/640},
    D: {name: "Deuterium", cost: (379500-187500)/750000, mass: (146.16-24.36)/750000},
    He3: {name: "Helium-3", cost: (4185000-60000)/750000, mass: (53.1-8.85)/750000},
}

export function resourceInfoWithMods(
    activeMods: Set<string> | 'ALL' = new Set()
): Record<string, {name: string, cost: number, mass: number}> {
    /* Note: this assumes that mods do not *change* a resource, but only add resources */
    const mods: Record<string, Array<keyof typeof resourceInfo>> = {
        stock: ['LF', 'Ox', 'SF', 'Mono', 'Xe', 'El', 'Ore', 'Air', 'Abl'],
        NFT: ['Ar', 'LH2', 'LCH4', 'Li', 'EnrU', 'DeplU', 'SC'],
        FFT: ['EnrU', 'Anti', 'NSW', 'NUK', 'FIP', 'Frag', 'D', 'He3'],
    }
    return objectFilter(resourceInfo,
        resName => {
            if(activeMods == 'ALL') return true
            if(mods['stock'].indexOf(resName) > -1) return true
            for(let modName in mods) {
                if(activeMods.has(modName) && mods[modName].indexOf(resName) > -1) return true
            }
            return false
        })
}

export class Resources {
    readonly amount: Record<string, number>

    constructor(amount: Record<string, number> = {}) {
        this.amount = Object.assign({}, amount)
    }
    copy(changed_amount: Record<string, number> = {}): Resources {
        const changed = new Resources(this.amount)
        for (const [key, value] of Object.entries(changed_amount)) {
            changed.amount[key] = value
        }
        return changed
    }

    static FromMass(mass: Record<string, number>, resourceInfo: Record<string, {mass: number}>): Resources {
        return new Resources(objectMap(mass,
            (m, res) => {
                const resourceMass = resourceInfo[res].mass;
                if(resourceMass == 0) return 0
                return m / resourceMass
            }
        ))
    }

    mass(resourceInfo: Record<string, {mass: number}>): Record<string, number> {
        return objectMap(this.amount,
            (amount, resource) => amount * resourceInfo[resource].mass)
    }
    cost(resourceInfo: Record<string, {cost: number}>): Record<string, number> {
        return objectMap(this.amount,
            (amount, resource) => amount * resourceInfo[resource].cost)
    }
    totalMass(resourceInfo: Record<string, {mass: number}>): number {
        return Object.values(this.mass(resourceInfo))
            .reduce((acc, mass) => acc + mass, 0)
    }
    totalCost(resourceInfo: Record<string, {cost: number}>): number {
        return Object.values(this.cost(resourceInfo))
            .reduce((acc, mass) => acc + mass, 0)
    }

    selectiveMass(
        resourceInfo: Record<string, {mass: number}>,
        filter: (resource: string, amount: number) => boolean
    ): number {
        const masses = this.mass(resourceInfo)
        return Object.keys(masses).reduce((acc, resource) => {
            const amount = masses[resource]
            if(filter(resource, amount)) return acc + amount
            return acc
        }, 0)
    }
    selectiveCost(
        resourceInfo: Record<string, {cost: number}>,
        filter: (resource: string, amount: number) => boolean
    ): number {
        const costs = this.cost(resourceInfo)
        return Object.keys(costs).reduce((acc, resource) => {
            const amount = costs[resource]
            if(filter(resource, amount)) return acc + amount
            return acc
        }, 0)
    }

    scaled(factor: number): Resources {
        return new Resources(
            objectMap(this.amount, (v) => factor*v)
        )
    }
    add(other: Resources): Resources {
        const allKeys = new Set([...Object.keys(this.amount), ...Object.keys(other.amount)])
        const out = {}
        for(const key of allKeys) {
            out[key] = (this.amount[key] ?? 0) + (other.amount[key] ?? 0)
        }
        return new Resources(out)
    }
    sub(other: Resources): Resources {
        const allKeys = new Set([...Object.keys(this.amount), ...Object.keys(other.amount)])
        const out = {}
        for(const key of allKeys) {
            out[key] = (this.amount[key] ?? 0) - (other.amount[key] ?? 0)
        }
        return new Resources(out)
    }
    consumedAtRatio(rate: Resources): number {
        /* Consume `this` resources at `rate`.
         * Calculates how many times `rate` fits in `this` for the resource that is most critical
         * and returns that number.
         */
        return Object.keys(this.amount).reduce(
            (acc, key) => {
                if( (rate.amount[key] ?? 0) <= 0) return acc
                return Math.min(acc, this.amount[key] / rate.amount[key])
            },
            Infinity,
        )
    }
}

export class Size {
    // https://wiki.kerbalspaceprogram.com/wiki/Radial_size
    static readonly TINY = new Size('TINY', 'T', 'Tiny (.625m)');
    static readonly SMALL = new Size('SMALL', 'S/Mk1', 'Small/Mk1 (1.25m)');
    static readonly MEDIUM = new Size('MEDIUM', 'M', 'Medium (1.875m)');
    static readonly LARGE = new Size('LARGE', 'L', 'Large (2.5m)');
    static readonly EXTRA_LARGE = new Size('EXTRA_LARGE', 'XL', 'Extra Large (3.75m)');
    static readonly HUGE = new Size('HUGE', 'H', 'Huge (5m)');
    static readonly MK2 = new Size('MK2', 'Mk2', 'Mk2');
    static readonly MK3 = new Size('MK3', 'Mk3', 'Mk3 (3.75m)');
    static readonly RADIAL = new Size('RADIAL', 'R', 'Radial mounted');

    private constructor(
        public readonly key: string,
        public readonly shortDescription: string,
        public readonly longDescription: string
    ) {}
}

export const sizes = {
    "0": "0.625m",
    "1": "1.25m/Mk1",
    "1.5": "1.875m",
    "2": "2.5m",
    "3": "3.75m",
    "4": "5m",
    "5": "7.5m",
    "Mk2": "Mk2",
    "Mk3": "Mk3",
    "R": "Radial",
}
export function sizesWithMods(activeMods: 'ALL' | Set<string>): Record<string, string> {
    /* Note: this assumes that mods do not *change* a resource, but only add resources */
    const mods: Record<string, Array<keyof typeof sizes>> = {
        stock: ["0", "1", "2", "3", "Mk2", "Mk3", "R"],
        MH: ["1.5", "4"],
        NFT: ["1.5", "4", "5"],
        FFT: ["4", "5"],
    }
    return objectFilter(sizes,
        sizeName => {
            if(activeMods == 'ALL') return true
            if(mods['stock'].indexOf(sizeName) > -1) return true
            for(let modName in mods) {
                if(activeMods.has(modName) && mods[modName].indexOf(sizeName) > -1) return true
            }
            return false
        })
}

export class AllDependencies {
    constructor(public deps: TechTreeNode[]) {}
}
export class AnyDependency {
    constructor(public deps: TechTreeNode[]) {}
}
export class TechTreeNode extends Data {
    name: string
    level: number
    dependencies: AllDependencies | AnyDependency | null = null

    static readonly Start = TechTreeNode.create({name: "Start", level: 1});

    static readonly BasicRocketry = TechTreeNode.create({name: "Basic Rocketry", level: 2, dependencies: new AnyDependency([TechTreeNode.Start])});
    static readonly Engineering101 = TechTreeNode.create({name: "Engineering 101", level: 2, dependencies: new AnyDependency([TechTreeNode.Start])});

    static readonly GeneralRocketry = TechTreeNode.create({name: "General Rocketry", level: 3, dependencies: new AnyDependency([TechTreeNode.BasicRocketry])});
    static readonly Stability = TechTreeNode.create({name: "Stability", level: 3, dependencies: new AnyDependency([TechTreeNode.Engineering101, TechTreeNode.BasicRocketry])});
    static readonly Survivability = TechTreeNode.create({name: "Survivability", level: 3, dependencies: new AnyDependency([TechTreeNode.Engineering101])});

    static readonly AdvancedRocketry = TechTreeNode.create({name: "Advanced Rocketry", level: 4, dependencies: new AnyDependency([TechTreeNode.GeneralRocketry])});
    static readonly GeneralConstruction = TechTreeNode.create({name: "General Construction", level: 4, dependencies: new AnyDependency([TechTreeNode.Stability, TechTreeNode.GeneralRocketry])});
    static readonly Aviation = TechTreeNode.create({name: "Aviation", level: 4, dependencies: new AnyDependency([TechTreeNode.Stability])});
    static readonly FlightControl = TechTreeNode.create({name: "Flight Control", level: 4, dependencies: new AnyDependency([TechTreeNode.Survivability, TechTreeNode.Stability])});
    static readonly BasicScience = TechTreeNode.create({name: "Basic Science", level: 4, dependencies: new AnyDependency([TechTreeNode.Survivability])});

    static readonly HeavyRocketry = TechTreeNode.create({name: "Heavy Rocketry", level: 5, dependencies: new AnyDependency([TechTreeNode.AdvancedRocketry])});
    static readonly PropulsionSystems = TechTreeNode.create({name: "Propulsion Systems", level: 5, dependencies: new AnyDependency([TechTreeNode.AdvancedRocketry])});
    static readonly FuelSystems = TechTreeNode.create({name: "Fuel Systems", level: 5, dependencies: new AnyDependency([TechTreeNode.AdvancedRocketry, TechTreeNode.GeneralConstruction])});
    static readonly AdvancedConstruction = TechTreeNode.create({name: "Advanced Construction", level: 5, dependencies: new AnyDependency([TechTreeNode.GeneralConstruction])});
    static readonly Aerodynamics = TechTreeNode.create({name: "Aerodynamics", level: 5, dependencies: new AnyDependency([TechTreeNode.Aviation, TechTreeNode.GeneralConstruction])});
    static readonly Landing = TechTreeNode.create({name: "Landing", level: 5, dependencies: new AnyDependency([TechTreeNode.FlightControl, TechTreeNode.Aviation])});
    static readonly AdvancedFlightControl = TechTreeNode.create({name: "Advanced Flight Control", level: 5, dependencies: new AnyDependency([TechTreeNode.FlightControl])});
    static readonly SpaceExploration = TechTreeNode.create({name: "Space Exploration", level: 5, dependencies: new AnyDependency([TechTreeNode.BasicScience])});
    static readonly Miniaturization = TechTreeNode.create({name: "Miniaturization", level: 5, dependencies: new AnyDependency([TechTreeNode.BasicScience])});
    static readonly Electrics = TechTreeNode.create({name: "Electrics", level: 5, dependencies: new AnyDependency([TechTreeNode.BasicScience])});

    static readonly HeavierRocketry = TechTreeNode.create({name: "Heavier Rocketry", level: 6, dependencies: new AnyDependency([TechTreeNode.HeavyRocketry])});
    static readonly PrecisionPropulsion = TechTreeNode.create({name: "Precision Propulsion", level: 6, dependencies: new AnyDependency([TechTreeNode.PropulsionSystems])});
    static readonly AdvancedFuelSystems = TechTreeNode.create({name: "Advanced Fuel Systems", level: 6, dependencies: new AnyDependency([TechTreeNode.PropulsionSystems, TechTreeNode.FuelSystems])});
    static readonly SpecializedConstruction = TechTreeNode.create({name: "Specialized Construction", level: 6, dependencies: new AnyDependency([TechTreeNode.AdvancedConstruction])});
    static readonly Actuators = TechTreeNode.create({name: "Actuators", level: 6, dependencies: new AnyDependency([TechTreeNode.AdvancedConstruction])});
    static readonly SupersonicFlight = TechTreeNode.create({name: "Supersonic Flight", level: 6, dependencies: new AnyDependency([TechTreeNode.Aerodynamics])});
    static readonly AdvancedAerodynamics = TechTreeNode.create({name: "Advanced Aerodynamics", level: 6, dependencies: new AnyDependency([TechTreeNode.Aerodynamics])});
    static readonly AdvancedLanding = TechTreeNode.create({name: "Advanced Landing", level: 6, dependencies: new AnyDependency([TechTreeNode.Landing])});
    static readonly SpecializedControl = TechTreeNode.create({name: "Specialized Control", level: 6, dependencies: new AnyDependency([TechTreeNode.AdvancedFlightControl])});
    static readonly CommandModules = TechTreeNode.create({name: "Command Modules", level: 6, dependencies: new AnyDependency([TechTreeNode.SpaceExploration, TechTreeNode.AdvancedFlightControl])});
    static readonly AdvancedExploration = TechTreeNode.create({name: "Advanced Exploration", level: 6, dependencies: new AnyDependency([TechTreeNode.SpaceExploration])});
    static readonly PrecisionEngineering = TechTreeNode.create({name: "Precision Engineering", level: 6, dependencies: new AnyDependency([TechTreeNode.Miniaturization, TechTreeNode.Electrics])});
    static readonly AdvancedElectrics = TechTreeNode.create({name: "Advanced Electrics", level: 6, dependencies: new AnyDependency([TechTreeNode.Electrics])});

    static readonly NuclearPropulsion = TechTreeNode.create({name: "Nuclear Propulsion", level: 7, dependencies: new AllDependencies([TechTreeNode.AdvancedFuelSystems, TechTreeNode.HeavierRocketry])});
    static readonly LargeVolumeContainment = TechTreeNode.create({name: "Large Volume Containment", level: 7, dependencies: new AnyDependency([TechTreeNode.AdvancedFuelSystems, TechTreeNode.SpecializedConstruction])});
    static readonly AdvancedMetalWorks = TechTreeNode.create({name: "Advanced MetalWorks", level: 7, dependencies: new AnyDependency([TechTreeNode.SpecializedConstruction])});
    static readonly Composites = TechTreeNode.create({name: "Composites", level: 7, dependencies: new AnyDependency([TechTreeNode.SpecializedConstruction])});
    static readonly HighAltitudeFlight = TechTreeNode.create({name: "High Altitude Flight", level: 7, dependencies: new AnyDependency([TechTreeNode.SupersonicFlight])});
    static readonly HeavyAerodynamics = TechTreeNode.create({name: "Heavy Aerodynamics", level: 7, dependencies: new AnyDependency([TechTreeNode.AdvancedAerodynamics])});
    static readonly HeavyLanding = TechTreeNode.create({name: "Heavy Landing", level: 7, dependencies: new AnyDependency([TechTreeNode.AdvancedLanding])});
    static readonly FieldScience = TechTreeNode.create({name: "Field Science", level: 7, dependencies: new AnyDependency([TechTreeNode.AdvancedLanding, TechTreeNode.AdvancedExploration])});
    static readonly ScanningTech = TechTreeNode.create({name: "Scanning Tech", level: 7, dependencies: new AnyDependency([TechTreeNode.AdvancedExploration, TechTreeNode.PrecisionEngineering])});
    static readonly UnmannedTech = TechTreeNode.create({name: "Unmanned Tech", level: 7, dependencies: new AnyDependency([TechTreeNode.PrecisionEngineering])});
    static readonly Electronics = TechTreeNode.create({name: "Electronics", level: 7, dependencies: new AnyDependency([TechTreeNode.PrecisionEngineering, TechTreeNode.AdvancedElectrics])});
    static readonly HighPowerElectrics = TechTreeNode.create({name: "High-Power Electrics", level: 7, dependencies: new AnyDependency([TechTreeNode.AdvancedElectrics])});

    static readonly VeryHeavyRocketry = TechTreeNode.create({name: "Very Heavy Rocketry", level: 8, dependencies: new AnyDependency([TechTreeNode.LargeVolumeContainment, TechTreeNode.HeavierRocketry])});
    static readonly HighPerformanceFuelSystems = TechTreeNode.create({name: "High-Performance Fuel Systems", level: 8, dependencies: new AnyDependency([TechTreeNode.LargeVolumeContainment])});
    static readonly MetaMaterials = TechTreeNode.create({name: "Meta-Materials", level: 8, dependencies: new AnyDependency([TechTreeNode.Composites])});
    static readonly HypersonicFlight = TechTreeNode.create({name: "Hypersonic Flight", level: 8, dependencies: new AnyDependency([TechTreeNode.HighAltitudeFlight])});
    static readonly ExperimentalAerodynamics = TechTreeNode.create({name: "Experimental Aerodynamics", level: 8, dependencies: new AnyDependency([TechTreeNode.HeavyAerodynamics])});
    static readonly AdvancedMotors = TechTreeNode.create({name: "Advanced Motors", level: 8, dependencies: new AnyDependency([TechTreeNode.FieldScience])});
    static readonly AdvancedScienceTech = TechTreeNode.create({name: "Advanced Science Tech", level: 8, dependencies: new AnyDependency([TechTreeNode.ScanningTech, TechTreeNode.FieldScience])});
    static readonly IonPropulsion = TechTreeNode.create({name: "Ion Propulsion", level: 8, dependencies: new AllDependencies([TechTreeNode.ScanningTech, TechTreeNode.UnmannedTech])});
    static readonly AdvancedUnmannedTech = TechTreeNode.create({name: "Advanced Unmanned Tech", level: 8, dependencies: new AnyDependency([TechTreeNode.UnmannedTech])});
    static readonly Automation = TechTreeNode.create({name: "Automation", level: 8, dependencies: new AnyDependency([TechTreeNode.UnmannedTech, TechTreeNode.Electronics])});
    static readonly SpecializedElectrics = TechTreeNode.create({name: "Specialized Electrics", level: 8, dependencies: new AnyDependency([TechTreeNode.HighPowerElectrics])});
    static readonly Nanolathing = TechTreeNode.create({name: "Nanolathing", level: 8, dependencies: new AnyDependency([TechTreeNode.AdvancedMetalWorks])});  // empty

    static readonly AerospaceTech = TechTreeNode.create({name: "Aerospace Tech", level: 9, dependencies: new AnyDependency([TechTreeNode.HypersonicFlight])});
    static readonly ExperimentalScience = TechTreeNode.create({name: "Experimental Science", level: 9, dependencies: new AnyDependency([TechTreeNode.AdvancedScienceTech])});
    static readonly LargeProbes = TechTreeNode.create({name: "Large Probes", level: 9, dependencies: new AnyDependency([TechTreeNode.AdvancedUnmannedTech, TechTreeNode.Automation])});
    static readonly ExperimentalElectrics = TechTreeNode.create({name: "Experimental Electrics", level: 9, dependencies: new AnyDependency([TechTreeNode.SpecializedElectrics])});
    static readonly ExperimentalMotors = TechTreeNode.create({name: "Experimental Motors", level: 9, dependencies: new AnyDependency([TechTreeNode.AdvancedMotors])});  // empty
}

export default class Part extends Data {
    name: string
    cost: number
    mass: number
    size: Set<string>
    content: Resources = new Resources()
    capacity: Resources = null
    consumption: Resources = new Resources()
    wikiUrl: string = undefined
    techTreeNode?: TechTreeNode

    _postCreate() {
        if(this.capacity == null) this.capacity = this.content.copy()
    }

    emptied(resourceInfo: Record<string, {cost: number, mass: number}>) {
        // @ts-ignore
        return this.copy({
            cost: this.cost - this.content.totalCost(resourceInfo),
            mass: this.mass - this.content.totalMass(resourceInfo),
            content: new Resources(),
        });
    }
}
