import * as React from 'react'
import Orbit from "./orbit";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
// https://stackoverflow.com/a/43001581

export const GRAVITATIONAL_CONSTANT = 6.67430e-11

export class Body {
    readonly name: string
    readonly children: string[]
    readonly atmosphereHeight: number = 0  // m
    readonly atmospherePressure: number = 0  // Pa
    readonly solarDay?: number  // s
    readonly terrainMaxHeight?: number  // m

    constructor(
        public readonly parent: string,
        public readonly mass: number,  // kg
        public readonly radius: number,  // m
        public readonly soi: number,  // m
        public readonly orbit: Orbit,
        other_properties: Omit<Partial<Body>, 'parent' | 'mass' | 'radius' | 'soi'>,
    ) {
        this.children = []
        for(const prop in other_properties) {
            this[prop] = other_properties[prop]
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

    get surface_gravity(): number | null {
        if(this.gravity == null || this.radius == null) return null
        return this.gravity / this.radius / this.radius
    }
}

class KspSystem {
    constructor(
        public readonly bodies: {[name: string]: Body},
        public readonly defaultBody: string,
    ) {
        if(bodies[defaultBody] == null) {
            throw new Error("Default body not found")
        }
        for(let bodyName in this.bodies) {
            const body = this.bodies[bodyName]
            const writableBody = body as Writeable<Body>

            writableBody.name = bodyName

            if(body.parent != null) {
                if(this.bodies[body.parent] == null) {
                    throw new Error("Parent body not found")
                } else {
                    const parent = this.bodies[body.parent] as Writeable<Body>
                    parent.children.push(bodyName)
                    writableBody.orbit = Orbit.FromOrbitWithUpdatedOrbitalElements(body.orbit, {gravity: parent.gravity})
                }
            }
        }
    }

    *recurseChildrenNames(bodyName: string): Generator<string> {
        for(const childName of this.bodies[bodyName].children) {
            yield childName
            yield* this.recurseChildrenNames(childName)
        }
    }
}

export interface SystemSelectProps {
    value: string
    onChange: (value: string) => void
}

export function SystemSelect(props: SystemSelectProps){
    const options = []
    const systemNames = Object.keys(kspSystems).sort()
    for(const systemName of systemNames) {
        options.push(<option key={systemName} value={systemName}>{systemName}</option>)
    }
    return <select value={props.value} onChange={e => props.onChange(e.target.value)}>
        {options}
    </select>
}

export interface HierarchicalBodySelectProps {
    systemName: string
    value: string
    onChange: (value: string) => void
    customValue?: string
}

export function HierarchicalBodySelect(props: HierarchicalBodySelectProps) {
    const options = []

    let i = 0
    if(props.customValue != null) {
        options.push(<option key={i++} value="" disabled>{props.customValue}</option>)
    }

    // optgroup's don't nest, so we can only do 1 level
    // start by finding the parent
    const system = kspSystems[props.systemName]
    let parentName = system.defaultBody
    while(system.bodies[parentName].parent != null) {
        parentName = system.bodies[parentName].parent
    }
    options.push(<option key={i++} value={parentName}>{parentName}</option>)
    for(let childName of system.bodies[parentName].children) {
        const descendants = [
            <option key={i++} value={childName}>{childName}</option>,
        ]

        for(const descendantName of system.recurseChildrenNames(childName)) {
            descendants.push(<option key={i++} value={descendantName}>{descendantName}</option>)
        }

        options.push(<optgroup key={i++} label={`${childName} system`}>{descendants}</optgroup>)
    }

    return <select value={props.value} onChange={e => props.onChange(e.target.value)}>
        {options}
    </select>
}

const kspSystems: {[name: string]: KspSystem} = {
    "Stock": new KspSystem(
        {
            "Kerbol": new Body(null, 1.7565459e28, 261_600_000, Infinity,
                null,
                {atmosphereHeight: 600_000, atmospherePressure: 16_000}),
            "Moho": new Body("Kerbol", 2.5263314e21, 250_000, 9_646_663,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 5_263_138_304, e: 0.2, argp: 15/180*Math.PI, inc: 7/180*Math.PI, lon_an: 70/180*Math.PI},
                    {ma0: 3.14}),
                {solarDay: 2_665_723.4, atmosphereHeight: 0, terrainMaxHeight: 6817}),
            "Eve": new Body("Kerbol", 1.2243980e23, 700_000, 85_109_365,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 9_832_684_544, e: 0.01, argp: 0, inc: 2.1/180*Math.PI, lon_an: 15/180*Math.PI},
                    {ma0: 3.14}),
                {solarDay: 81_661.857, atmosphereHeight: 90_000, atmospherePressure: 506_625, terrainMaxHeight: 7526}),
            "Gilly": new Body("Eve", 1.2420363e17, 13_000, 126_123.27,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 31_500_000, e: 0.55, argp: 10/180*Math.PI, inc: 12/180*Math.PI, lon_an: 80/180*Math.PI},
                    {ma0: 0.9}),
                {solarDay: 28_255, atmosphereHeight: 0, terrainMaxHeight: 6401}),
            "Kerbin": new Body("Kerbol", 5.2915158e22, 600_000, 84_159_286,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 13_599_840_256, e: 0, argp: 0, inc: 0, lon_an: 0},
                    {ma0: 3.14}),
                {solarDay: 21_600, atmosphereHeight: 70_000, atmospherePressure: 101_325, terrainMaxHeight: 6764.1}),
            'Mun': new Body('Kerbin', 9.7599066e20, 200_000, 2_429_559.1,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 12_000_000, e: 0, argp: 0, inc: 0, lon_an: 0},
                    {ma0: 1.7}),
                {solarDay: 138_984.38, atmosphereHeight: 0, terrainMaxHeight: 7061}),
            'Minmus': new Body('Kerbin', 2.6457580e19, 60_000, 2_247_428.4,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 47_000_000, e: 0, argp: 38/180*Math.PI, inc: 6/180*Math.PI, lon_an: 78/180*Math.PI},
                    {ma0: 0.9}),
                {solarDay: 40_400, atmosphereHeight: 0, terrainMaxHeight: 5700}),
            'Duna': new Body("Kerbol", 4.5154270e21, 320_000, 47_921_949,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 20_726_155_264, e: 0.051, argp: 0, inc: 0.06/180*Math.PI, lon_an: 135.5/180*Math.PI},
                    {ma0: 3.14}),
                {solarDay: 65_766.707, atmosphereHeight: 50_000, atmospherePressure: 6_755, terrainMaxHeight: 8264}),
            'Ike': new Body('Duna', 2.7821615e20, 130_000, 1_049_598.9,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 3_200_000, e: 0.03, argp: 0, inc: 0.2/180*Math.PI, lon_an: 0},
                    {ma0: 1.7}),
                {solarDay: 65_517.862, atmosphereHeight: 0, terrainMaxHeight: 12738}),
            'Dres': new Body("Kerbol", 3.2190937e20, 138_000, 32_832_840,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 40_839_348_203, e: 0.145, argp: 90/180*Math.PI, inc: 5/180*Math.PI, lon_an: 280/180*Math.PI},
                    {ma0: 3.14}),
                {solarDay: 34_825.305, atmosphereHeight: 0, terrainMaxHeight: 5700}),
            'Jool': new Body("Kerbol", 4.2332127e24, 6_000_000, 2_455_985_200,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 68_773_560_320, e: 0.05, argp: 0, inc: 1.304/180*Math.PI, lon_an: 52/180*Math.PI},
                    {ma0: 0.1}),
                {solarDay: 36_000, atmosphereHeight: 200_000, atmospherePressure: 1_519_880, terrainMaxHeight: 0}),
            'Laythe': new Body('Jool', 2.9397311e22, 500_000, 3_723_645.8,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 27_184_000, e: 0, argp: 0, inc: 0, lon_an: 0},
                    {ma0: 3.14}),
                {solarDay: 52_980.879, atmosphereHeight: 50_000, atmospherePressure: 60_795, terrainMaxHeight: 6079}),
            'Vall': new Body('Jool', 3.1087655e21, 300_000, 2_406_401.4,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 43_152_000, e: 0, argp: 0, inc: 0, lon_an: 0},
                    {ma0: 0.9}),
                {solarDay: 105_962.09, atmosphereHeight: 0, terrainMaxHeight: 7985}),
            'Tylo': new Body('Jool', 4.2332127e22, 600_000, 10_856_518,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 68_500_000, e: 0, argp: 0, inc: 0.025/180*Math.PI, lon_an: 0},
                    {ma0: 3.14}),
                {solarDay: 211_926.36, atmosphereHeight: 0, terrainMaxHeight: 12904}),
            'Bop': new Body('Jool', 3.7261090e19, 65_000, 1_221_060.9,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 128_500_000, e: 0.235, argp: 25/180*Math.PI, inc: 15/180*Math.PI, lon_an: 10/180*Math.PI},
                    {ma0: 0.9}),
                {solarDay: 544_507.43, atmosphereHeight: 0, terrainMaxHeight: 21757}),
            'Pol': new Body('Jool', 1.0813507e19, 44_000, 1_042_138.9,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 179_890_000, e: 0.171, argp: 15/180*Math.PI, inc: 4.25/180*Math.PI, lon_an: 2/180*Math.PI},
                    {ma0: 0.9}),
                {solarDay: 901_902.62, atmosphereHeight: 0, terrainMaxHeight: 4891}),
            'Eeloo': new Body("Kerbol", 1.1149224e21, 210_000, 119_082_940,
                Orbit.FromOrbitalElements(null /* filled in automatically from parent */,
                    {sma: 90_118_820_000, e: 0.26, argp: 260/180*Math.PI, inc: 6.15/180*Math.PI, lon_an: 50/180*Math.PI},
                    {ma0: 3.14}),
                {solarDay: 19_462.412, atmosphereHeight: 0, terrainMaxHeight: 3900}),
        },
        "Kerbin",
    ),
}
export default kspSystems
