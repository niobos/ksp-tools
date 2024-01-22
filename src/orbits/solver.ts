import Vector from "../utils/vector";
import Orbit from "../utils/orbit";

export type Burn = {
    t: number
    prnDv: Vector
}
export type Leg = {
    ta: number,
    burn: Burn,
    nextOrbit: Orbit,
}
export type Solution = {
    name: string
    legs: Leg[]
}

export default function solve(
    sourceOrbit: Orbit,
    targetOrbit: Orbit,
    t0: number = 0,
): Solution[] {
    const solutions: Solution[] =  []

    solutions.push({
        name: 'Dummy',
        legs: [
            {
                ta: 1,
                burn: {t: 5, prnDv: new Vector(5, 5, 5)},
                nextOrbit: Orbit.FromOrbitalElements(1, {sma: 1})
            }
        ],
    })

    return solutions
}

