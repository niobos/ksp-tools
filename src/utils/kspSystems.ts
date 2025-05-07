import Orbit from "./orbit";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
// https://stackoverflow.com/a/43001581

export const GRAVITATIONAL_CONSTANT = 6.67430e-11

export class Body {
    readonly name: string
    readonly childrenNames: string[]
    readonly soi: number  // m
    readonly atmosphereHeight: number = 0  // m
    readonly atmospherePressure: number = 0  // Pa
    readonly solarDay?: number  // s
    readonly terrainMaxHeight?: number  // m

    constructor(
        public readonly parentName: string,
        public readonly mass: number,  // kg
        public readonly radius: number,  // m
        public readonly orbit: Orbit,
        other_properties: Omit<Partial<Body>, 'parentName' | 'mass' | 'radius' | 'orbit'> = {},
    ) {
        this.childrenNames = []
        for(const prop in other_properties) {
            this[prop] = other_properties[prop]
        }
    }
    static FromObject(o: any): Body {
        return new Body(
            o.parentName,
            o.mass,
            o.radius,
            o.orbit == null ? null : Orbit.FromObject(o.orbit),
            {
                name: o.name,
                childrenNames: o.childrenNames,
                soi: o.soi,
                atmosphereHeight: o.atmosphereHeight,
                atmospherePressure: o.atmospherePressure,
                solarDay: o.solarDay,
                terrainMaxHeight: o.terrainMaxHeight,
            },
        )
    }

    copy(changes: Partial<Body> = {}): Body {
        // Return a new body
        const b = new Body(
            this.parentName,
            this.mass,
            this.radius,
            this.orbit,
            {
                soi: this.soi,
                atmosphereHeight: this.atmosphereHeight,
                atmospherePressure: this.atmospherePressure,
                solarDay: this.solarDay,
                terrainMaxHeight: this.terrainMaxHeight,
            },
        )
        for(const prop in changes) {
            b[prop] = changes[prop]
        }
        return b
    }

    static Deserialize(s): Body {
        return new Body(null, s.mass, s.radius, null,
            {atmosphereHeight: s.atmosphereHeight, soi: s.soi})
    }
    serialize() {
        return {
            mass: this.mass,
            radius: this.radius,
            atmosphereHeight: this.atmosphereHeight,
            soi: this.soi,
        }
    }

    get gravity(): number | null {
        if(this.mass == null) return null
        return GRAVITATIONAL_CONSTANT * this.mass
    }
    static massFromGravity(gravity: number | null): number | null {
        if(gravity == null) return null
        return gravity / GRAVITATIONAL_CONSTANT
    }
    static massFromGASL(gASL: number, radius: number): number {
        return gASL * radius * radius / GRAVITATIONAL_CONSTANT
    }

    get surface_gravity(): number | null {
        if(this.gravity == null || this.radius == null) return null
        return this.gravity / this.radius / this.radius
    }
}

export class KspSystem {
    readonly rootName: string
    get root(): Body { return this.bodies[this.rootName] }

    constructor(
        readonly name: string,
        public readonly bodies: {[name: string]: Body},
        public readonly defaultBodyName: string,
    ) {
        if(bodies[defaultBodyName] == null) {
            throw new Error("Default body not found")
        }
        for(let bodyName in this.bodies) {
            const body = this.bodies[bodyName]
            const writableBody = body as Writeable<Body>

            writableBody.name = bodyName
            writableBody.childrenNames = []
        }
        for(let bodyName in this.bodies) {
            const body = this.bodies[bodyName]
            const writableBody = body as Writeable<Body>

            if(body.parentName != null) {
                if(this.bodies[body.parentName] == null) {
                    throw new Error("Parent body not found")
                } else {
                    const parent = this.bodies[body.parentName] as Writeable<Body>
                    parent.childrenNames.push(bodyName)
                    writableBody.orbit = Orbit.FromOrbitWithUpdatedOrbitalElements(body.orbit, {gravity: parent.gravity})

                    if(body.soi == null) {
                        // https://en.wikipedia.org/wiki/Sphere_of_influence_%28astrodynamics%29
                        writableBody.soi = body.orbit.semiMajorAxis * Math.pow(
                            body.mass / parent.mass,
                            2/5)
                    }
                }
            } else {
                this.rootName = bodyName
                if(body.soi == null) {
                    writableBody.soi = Infinity
                }
            }
        }
    }

    static FromObject(o: any): KspSystem {
        const bodies = {}
        for(const bodyName in o.bodies) {
            const bodyInstance = Body.FromObject(o.bodies[bodyName])
            bodies[bodyInstance.name] = bodyInstance
        }
        return new KspSystem(
            o.name,
            bodies,
            o.defaultBodyName,
        )
    }

    get defaultBody(): Body { return this.bodies[this.defaultBodyName] }

    *recurseChildrenNames(bodyName: string): Generator<string> {
        for(const childName of this.bodies[bodyName].childrenNames) {
            yield childName
            yield* this.recurseChildrenNames(childName)
        }
    }

    hierarchicalLocation(bodyName: string): string[] {
        const hierarchy = [bodyName]
        while(this.bodies[bodyName].parentName != null) {
            bodyName = this.bodies[bodyName].parentName
            hierarchy.unshift(bodyName)
        }
        return hierarchy
    }
}

const kspSystems: {[name: string]: KspSystem} = {}
export default kspSystems
function addSystem(system: KspSystem) {
    if(kspSystems[system.name] != null) {
        throw `Duplicate system name ${system.name}`
    }
    kspSystems[system.name] = system
}

addSystem(new KspSystem("Stock",
    {
        "Kerbol": new Body(null, 1.7565459e28, 261_600_000,
            null,
            {atmosphereHeight: 600_000, atmospherePressure: 16_000}),

        "Moho": new Body("Kerbol", 2.5263314e21, 250_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 5_263_138_304, e: 0.2, argp: 15/180*Math.PI, inc: 7/180*Math.PI, lon_an: 70/180*Math.PI},
                {ma0: 3.14}),
            {solarDay: 2_665_723.4, atmosphereHeight: 0, terrainMaxHeight: 6817}),

        "Eve": new Body("Kerbol", 1.2243980e23, 700_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 9_832_684_544, e: 0.01, argp: 0, inc: 2.1/180*Math.PI, lon_an: 15/180*Math.PI},
                {ma0: 3.14}),
            {solarDay: 81_661.857, atmosphereHeight: 90_000, atmospherePressure: 506_625, terrainMaxHeight: 7526}),
        "Gilly": new Body("Eve", 1.2420363e17, 13_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 31_500_000, e: 0.55, argp: 10/180*Math.PI, inc: 12/180*Math.PI, lon_an: 80/180*Math.PI},
                {ma0: 0.9}),
            {solarDay: 28_255, atmosphereHeight: 0, terrainMaxHeight: 6401}),

        "Kerbin": new Body("Kerbol", 5.2915158e22, 600_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 13_599_840_256, e: 0, argp: 0, inc: 0, lon_an: 0},
                {ma0: 3.14}),
            {solarDay: 21_600, atmosphereHeight: 70_000, atmospherePressure: 101_325, terrainMaxHeight: 6764.1}),
        'Mun': new Body('Kerbin', 9.7599066e20, 200_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 12_000_000, e: 0, argp: 0, inc: 0, lon_an: 0},
                {ma0: 1.7}),
            {solarDay: 138_984.38, atmosphereHeight: 0, terrainMaxHeight: 7061}),
        'Minmus': new Body('Kerbin', 2.6457580e19, 60_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 47_000_000, e: 0, argp: 38/180*Math.PI, inc: 6/180*Math.PI, lon_an: 78/180*Math.PI},
                {ma0: 0.9}),
            {solarDay: 40_400, atmosphereHeight: 0, terrainMaxHeight: 5700}),

        'Duna': new Body("Kerbol", 4.5154270e21, 320_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 20_726_155_264, e: 0.051, argp: 0, inc: 0.06/180*Math.PI, lon_an: 135.5/180*Math.PI},
                {ma0: 3.14}),
            {solarDay: 65_766.707, atmosphereHeight: 50_000, atmospherePressure: 6_755, terrainMaxHeight: 8264}),
        'Ike': new Body('Duna', 2.7821615e20, 130_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 3_200_000, e: 0.03, argp: 0, inc: 0.2/180*Math.PI, lon_an: 0},
                {ma0: 1.7}),
            {solarDay: 65_517.862, atmosphereHeight: 0, terrainMaxHeight: 12738}),

        'Dres': new Body("Kerbol", 3.2190937e20, 138_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 40_839_348_203, e: 0.145, argp: 90/180*Math.PI, inc: 5/180*Math.PI, lon_an: 280/180*Math.PI},
                {ma0: 3.14}),
            {solarDay: 34_825.305, atmosphereHeight: 0, terrainMaxHeight: 5700}),

        'Jool': new Body("Kerbol", 4.2332127e24, 6_000_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 68_773_560_320, e: 0.05, argp: 0, inc: 1.304/180*Math.PI, lon_an: 52/180*Math.PI},
                {ma0: 0.1}),
            {solarDay: 36_000, atmosphereHeight: 200_000, atmospherePressure: 1_519_880, terrainMaxHeight: 0}),
        'Laythe': new Body('Jool', 2.9397311e22, 500_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 27_184_000, e: 0, argp: 0, inc: 0, lon_an: 0},
                {ma0: 3.14}),
            {solarDay: 52_980.879, atmosphereHeight: 50_000, atmospherePressure: 60_795, terrainMaxHeight: 6079}),
        'Vall': new Body('Jool', 3.1087655e21, 300_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 43_152_000, e: 0, argp: 0, inc: 0, lon_an: 0},
                {ma0: 0.9}),
            {solarDay: 105_962.09, atmosphereHeight: 0, terrainMaxHeight: 7985}),
        'Tylo': new Body('Jool', 4.2332127e22, 600_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 68_500_000, e: 0, argp: 0, inc: 0.025/180*Math.PI, lon_an: 0},
                {ma0: 3.14}),
            {solarDay: 211_926.36, atmosphereHeight: 0, terrainMaxHeight: 12904}),
        'Bop': new Body('Jool', 3.7261090e19, 65_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 128_500_000, e: 0.235, argp: 25/180*Math.PI, inc: 15/180*Math.PI, lon_an: 10/180*Math.PI},
                {ma0: 0.9}),
            {solarDay: 544_507.43, atmosphereHeight: 0, terrainMaxHeight: 21757}),
        'Pol': new Body('Jool', 1.0813507e19, 44_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 179_890_000, e: 0.171, argp: 15/180*Math.PI, inc: 4.25/180*Math.PI, lon_an: 2/180*Math.PI},
                {ma0: 0.9}),
            {solarDay: 901_902.62, atmosphereHeight: 0, terrainMaxHeight: 4891}),

        'Eeloo': new Body("Kerbol", 1.1149224e21, 210_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 90_118_820_000, e: 0.26, argp: 260/180*Math.PI, inc: 6.15/180*Math.PI, lon_an: 50/180*Math.PI},
                {ma0: 3.14}),
            {solarDay: 19_462.412, atmosphereHeight: 0, terrainMaxHeight: 3900}),
    },
    "Kerbin",
))

function copyFrom(systemName: string, planetName: string): {[name: string]: Body} {
    return {
        [planetName]: kspSystems[systemName].bodies[planetName].copy()
    }
}

addSystem(new KspSystem("Outer Planets",
    {
        ...copyFrom("Stock", "Kerbol"),
        ...copyFrom("Stock", "Moho"),
        ...copyFrom("Stock", "Eve"),
        ...copyFrom("Stock", "Gilly"),
        ...copyFrom("Stock", "Kerbin"),
        ...copyFrom("Stock", "Mun"),
        ...copyFrom("Stock", "Minmus"),
        ...copyFrom("Stock", "Duna"),
        ...copyFrom("Stock", "Ike"),
        ...copyFrom("Stock", "Dres"),
        ...copyFrom("Stock", "Jool"),
        ...copyFrom("Stock", "Laythe"),
        ...copyFrom("Stock", "Vall"),
        ...copyFrom("Stock", "Tylo"),
        ...copyFrom("Stock", "Bop"),
        ...copyFrom("Stock", "Pol"),
        // Not Eeloo
        /* from https://forum.kerbalspaceprogram.com/topic/184789-131-112x-outer-planets-mod-v2211-31st-aug-2024/
         * and https://github.com/Poodmund/Outer-Planets-Mod/tree/master/GameData/OPM/KopernicusConfigs/OuterPlanets
         */
        'Sarnus': new Body("Kerbol", Body.massFromGASL(0.298, 5_300_000), 5_300_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 125_798_522_368, e: 0.0534, argp: 0/180*Math.PI, inc: 2.02/180*Math.PI, lon_an: 184/180*Math.PI},
                {ma0: 2.88114666938782, t0: 359.279999999964}),
            {solarDay: 28_500, atmosphereHeight: 580_000, atmospherePressure: 1418.55*100}),
        'Hale': new Body("Sarnus", Body.massFromGASL(0.0023, 6_000), 6_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 10_488_231, e: 0, argp: 0/180*Math.PI, inc: 1/180*Math.PI, lon_an: 55/180*Math.PI},
                {ma0: 0, t0: 0}),
            {soi: 41_000}),
        'Ovok': new Body("Sarnus", Body.massFromGASL(0.002, 26_000), 26000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 12_169_413, e: 0.01, argp: 0/180*Math.PI, inc: 1.5/180*Math.PI, lon_an: 55/180*Math.PI},
                {ma0: 1.72, t0: 751.7}),
            {atmosphereHeight: 0}),
        'Eeloo': new Body("Sarnus", 1.1149224e21, 210_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 19_105_978, e: 0.0034, argp: 260/180*Math.PI, inc: 2.3/180*Math.PI, lon_an: 55/180*Math.PI},
                {ma0: 3.14}),
            {atmosphereHeight: 0, terrainMaxHeight: 3900}),
        'Slate': new Body("Sarnus", Body.massFromGASL(0.692, 540_000), 540000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 42_592_946, e: 0.04, argp: 0/180*Math.PI, inc: 2.3/180*Math.PI, lon_an: 55/180*Math.PI},
                {ma0: 1.1, t0: 1343.91}),
            {atmosphereHeight: 0}),
        'Tekto': new Body("Sarnus", Body.massFromGASL(0.2503, 280_000), 280_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 97_355_304, e: 0.028, argp: 0/180*Math.PI, inc: 9.4/180*Math.PI, lon_an: 55/180*Math.PI},
                {ma0: 2.1, t0: 1275.12}),
            {atmosphereHeight: 95_000, atmospherePressure: 124.62975*100}),

        'Urlum': new Body("Kerbol", Body.massFromGASL(0.257, 2_177_000), 2_177_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 254_317_012_787, e: 0.045214674, argp: 0/180*Math.PI, inc: 0.64/180*Math.PI, lon_an: 61/180*Math.PI},
                {ma0: 5.59607362747192, t0: 422.539999999906}),
            {solarDay: 41_000, atmosphereHeight: 325_000, atmospherePressure: 709.275*100}),
        'Tal': new Body("Urlum", Body.massFromGASL(0.045, 22_000), 22_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 3_109_163, e: 0, argp: 0/180*Math.PI, inc: 1.9/180*Math.PI, lon_an: 40/180*Math.PI},
                {ma0: 0, t0: 1179.579}),
            {atmosphereHeight: 0}),
        'Polta': new Body("Urlum", Body.massFromGASL(0.19, 220_000), 220000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 11_727_895, e: 0.0015, argp: 60/180*Math.PI, inc: 2.45/180*Math.PI, lon_an: 40/180*Math.PI},
                {ma0: 1.5209, t0: 878.1399}),
            {atmosphereHeight: 0}),
        'Priax': new Body("Urlum", Body.massFromGASL(0.063, 74_000), 74_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 11_727_895, e: 0.0015, argp: 0/180*Math.PI, inc: 2.5/180*Math.PI, lon_an: 40/180*Math.PI},
                {ma0: 1.5209, t0: 878.1399}),
            {atmosphereHeight: 0}),
        'Wal': new Body("Urlum", Body.massFromGASL(0.37, 370_000), 370_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 67_553_668, e: 0.023, argp: 0/180*Math.PI, inc: 1.9/180*Math.PI, lon_an: 40/180*Math.PI},
                {ma0: 2.9615, t0: 1078.179}),
            {atmosphereHeight: 0}),

        'Neidon': new Body("Kerbol", Body.massFromGASL(0.314, 2_145_000), 2_145_000,
            Orbit.FromOrbitalElements(1  /* filled in automatically from parent */,
                {sma: 409_355_191_706, e: 0.0127567, argp: 0/180*Math.PI, inc: 1.27/180*Math.PI, lon_an: 259/180*Math.PI},
                {ma0: 2.27167344093323, t0: 99.6799999999973}),
            {solarDay: 40_250, atmosphereHeight: 260_000, atmospherePressure: 607.95*100}),
        'Thatmo': new Body("Neidon", Body.massFromGASL(0.232, 286_000), 286_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 32_300_895, e: 0.00043, argp: 0/180*Math.PI, inc: 161.1/180*Math.PI, lon_an: 66/180*Math.PI},
                {ma0: 2.04731106758118, t0: 1953406.32967385}),
            {atmosphereHeight: 35_000, atmospherePressure: 1.01325*100}),
        'Nissee': new Body("Neidon", Body.massFromGASL(0.045, 30_000), 30_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 487_743_514, e: 0.72, argp: 0/180*Math.PI, inc: 29.56/180*Math.PI, lon_an: 66/180*Math.PI},
                {ma0: 2.04731106758118, t0: 1953406.32967385}),
            {atmosphereHeight: 0}),

        'Plock': new Body("Kerbol", Body.massFromGASL(0.148, 189_000), 189_000,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 535_833_706_086, e: 0.26, argp: 50/180*Math.PI, inc: 6.15/180*Math.PI, lon_an: 260/180*Math.PI},
                {ma0: 0, t0: 213}),
            {atmosphereHeight: 0}),
        'Karen': new Body("Plock", Body.massFromGASL(0.066, 85_050), 85_050,
            Orbit.FromOrbitalElements(1 /* filled in automatically from parent */,
                {sma: 2_457_800, e: 0, argp: 0/180*Math.PI, inc: 0/180*Math.PI, lon_an: 260/180*Math.PI},
                {ma0: 0, t0: 213}),
            {atmosphereHeight: 0}),
    },
    "Kerbin",
))
