import {Data} from "dataclass";

export class Resources extends Data {
    static price = {
        'lf': 0.8,
        'ox': 0.16,
        'sf': 0.6,
        'mono': 1.2,
        'xe': 4.0,
        'el': 0,
        'ore': 0.02,
    };
    static mass = {
        'lf': 0.005,
        'ox': 0.005,
        'sf': 0.0075,
        'mono': 0.004,
        'xe': 0.0001,
        'el': 0,
        'ore': 0.010,
    };

    lf: number = 0;
    ox: number = 0;
    air: number = 0;
    mono: number = 0;
    sf: number = 0;
    xe: number = 0;
    el: number = 0;
    ore: number = 0;

    get mass() {
        let m = 0;
        for(let resource in Resources.mass) {
            m += this[resource] * Resources.mass[resource];
        }
        return m;
    }

    get cost() {
        let m = 0;
        for(let resource in Resources.price) {
            m += this[resource] * Resources.price[resource];
        }
        return m;
    }

    scaled(factor: number): Resources {
        return Resources.create({
            lf: this.lf * factor,
            ox: this.ox * factor,
            air: this.air * factor,
            mono: this.mono * factor,
            sf: this.sf * factor,
            xe: this.xe * factor,
            el: this.el * factor,
            ore: this.ore * factor,
        })
    }
    add(other: Resources): Resources {
        return Resources.create({
            lf: this.lf + other.lf,
            ox: this.ox + other.ox,
            air: this.air + other.air,
            mono: this.mono + other.mono,
            sf: this.sf + other.sf,
            xe: this.xe + other.xe,
            el: this.el + other.el,
            ore: this.ore + other.ore,
        })
    }
    sub(other: Resources): Resources {
        return Resources.create({
            lf: this.lf - other.lf,
            ox: this.ox - other.ox,
            air: this.air - other.air,
            mono: this.mono - other.mono,
            sf: this.sf - other.sf,
            xe: this.xe - other.xe,
            el: this.el - other.el,
            ore: this.ore - other.ore,
        })
    }

    consumedAtRatio(consumption: Resources): number {
        /* Consume `this` resources at `consumption` rate.
         * Calculates how many times `consumption` fits in `this` for the resource that is most critical
         * and returns that number.
         */
        let number = Infinity;
        if(consumption.lf > 0) number = Math.min(number, this.lf / consumption.lf)
        if(consumption.ox > 0) number = Math.min(number, this.ox / consumption.ox)
        if(consumption.air > 0) number = Math.min(number, this.air / consumption.air)
        if(consumption.mono > 0) number = Math.min(number, this.mono / consumption.mono)
        if(consumption.sf > 0) number = Math.min(number, this.sf / consumption.sf)
        if(consumption.xe > 0) number = Math.min(number, this.xe / consumption.xe)
        if(consumption.el > 0) number = Math.min(number, this.el / consumption.el)
        if(consumption.ore > 0) number = Math.min(number, this.ore / consumption.ore)

        if(number == Infinity) return null
        return number
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
    cost: number;
    mass: number;
    size: Set<Size>;
    content: Resources = Resources.create();
    consumption: Resources = Resources.create();
    wikiUrl: string = undefined;
    techTreeNode?: TechTreeNode;

    emptied() {
        let {cost, mass, content} = this;
        for(const resource in Resources.price) {
            cost -= this.content[resource] * Resources.price[resource];
            mass -= this.content[resource] * Resources.mass[resource];
            content = content.copy({[resource]: 0});
        }
        // @ts-ignore
        return this.copy({
            cost,
            mass,
            content,
        });
    }
}
