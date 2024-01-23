import Orbit from "../utils/orbit";
import Vector from "../utils/vector";
import {randomNormal, randomBool} from "../utils/random";

type Angle = number
type Seconds = number

export type Burn = {
    t: Seconds
    ta: Angle
    dvPrn: Vector
}
export type Leg = {
    burn: Burn
    nextOrbit: Orbit
}

export type Trajectory = {
    sourceOrbitTa: Angle
    destOrbitTa: Angle
    dtInSourceOrbitPeriod: number  // use Source Orbit Period as unit to make this dimensionless
}
export type CalculatedTrajectory = Trajectory & {
    legs: Leg[]
    dv: number
}

export type SolverInput = {
    requestId?: any
    sourceOrbit: Orbit
    destOrbit: Orbit
    candidates?: Trajectory[]
    populationSize?: number
    iterations?: number
}
export type SolverOutput = {
    requestId?: any
    sortedResult: CalculatedTrajectory[]
}

export function seedTrajectories(populationSize: number): Trajectory[] {
    const num = Math.pow(populationSize, 1/3)
    const out: Trajectory[] = []
    for(let i = 0; i < num; i++) {
        for(let j = 0; j < num; j++) {
            for (let k = 0; k < num; k++) {
                out.push({
                    sourceOrbitTa: i / num * 2 * Math.PI,
                    destOrbitTa: j / num * 2 * Math.PI,
                    dtInSourceOrbitPeriod: 1/20 * 100 * (k+1) / num,  // range from 1/10 to 10x of a half period
                })
            }
        }
    }
    return out
}

function calcTrajectory(
    sourceOrbit: Orbit,
    destOrbit: Orbit,
    t: Trajectory | CalculatedTrajectory
): CalculatedTrajectory | null {
    if((t as CalculatedTrajectory).dv != null) return t as CalculatedTrajectory

    const p1 = sourceOrbit.positionAtTa(t.sourceOrbitTa)
    const v1 = sourceOrbit.velocityAtTa(t.sourceOrbitTa)
    const p2 = destOrbit.positionAtTa(t.destOrbitTa)
    const v2 = destOrbit.velocityAtTa(t.destOrbitTa)
    const dt = sourceOrbit.period * t.dtInSourceOrbitPeriod

    try {
        const {orbit: transferOrbit, arc, v1: transferV1} = Orbit.FromLambert(
            sourceOrbit.gravity, p1, p2, dt,
        )
        // TODO: do we want to check both prograde & retrograde?

        const dv1 = transferV1.sub(v1)
        const p1TransferPerifocal = transferOrbit.globalToPerifocal(p1)
        const transferTa1 = Math.atan2(p1TransferPerifocal.y, p1TransferPerifocal.x)
        const transferTa2 = transferTa1 + arc;
        const transferV2 = transferOrbit.velocityAtTa(transferTa2)
        const dv2 = v2.sub(transferV2)

        const legs: Leg[] = []
        const t0 = sourceOrbit.tAtTa(t.sourceOrbitTa);
        legs.push({
            burn: {
                ta: t.sourceOrbitTa,
                t: t0,
                dvPrn: sourceOrbit.globalToPrn(dv1, t.sourceOrbitTa),
            },
            nextOrbit: transferOrbit,
        })
        legs.push({
            burn: {
                ta: transferTa2,
                t: t0 + dt,
                dvPrn: transferOrbit.globalToPrn(dv2, transferTa2)
            },
            nextOrbit: destOrbit,
        })

        return Object.assign({}, t, {
            legs,
            dv: dv1.norm + dv2.norm
        })
    } catch(e) {
        return null
    }
}

function fitness(trajectory: CalculatedTrajectory): number {
    const f = 1000 / trajectory.dv  // 1000 is useless, but makes reading the numbers during debugging easier
    if(isNaN(f)) return 0
    return f
}

function weightedPick(options: CalculatedTrajectory[], fitnesSum: number): number {
    const pick = Math.random() * fitnesSum
    let sum = 0
    for(let i = 0; i < options.length; i++) {
        sum += fitness(options[i])
        if(sum >= pick) return i;
    }
    debugger  // unreachable
}

function xor(...args: boolean[]): boolean {
    let o = false
    for(let b of args) {
        o = b ? !o : o
    }
    return o
}

function crossOver(parent1: Trajectory, parent2: Trajectory): Trajectory {
    return {
        sourceOrbitTa: (randomBool() ? parent1 : parent2).sourceOrbitTa,
        destOrbitTa: (randomBool() ? parent1 : parent2).destOrbitTa,
        dtInSourceOrbitPeriod: (randomBool() ? parent1 : parent2).dtInSourceOrbitPeriod,
    }
}

function mutate(trajectory: Trajectory): Trajectory {
    const o = Object.assign({}, trajectory)
    const mutationChance = 0.05
    const TWO_PI = 2 * Math.PI
    if(Math.random() < mutationChance) o.sourceOrbitTa = (o.sourceOrbitTa + randomNormal()*0.1) % TWO_PI  // ±0.1 rad = ±6º
    if(Math.random() < mutationChance) o.destOrbitTa = (o.destOrbitTa + randomNormal()*0.1) % TWO_PI  // ±0.1 rad = ±6º
    if(Math.random() < mutationChance) o.dtInSourceOrbitPeriod *= 1 + (2*randomNormal()-1)*.10  // ±10%
    return o
}

self.onmessage = (m) => {
    // const startTime = +(new Date())
    const input: SolverInput = m.data
    input.sourceOrbit = Orbit.FromObject(input.sourceOrbit)
    input.destOrbit = Orbit.FromObject(input.destOrbit)
    if(input.populationSize == null) input.populationSize = 1000
    if(input.iterations == null) input.iterations = 1
    // console.log(`Starting ${input.requestId}`)

    let candidates: CalculatedTrajectory[]
    let calculations = 0
    let iteration = 0
    if(input.candidates == null || input.candidates.length == 0) {
        candidates = seedTrajectories(input.populationSize).map(t => {
            calculations++
            return calcTrajectory(input.sourceOrbit, input.destOrbit, t)
        })
            .filter(c => c != null)
            .sort((a, b) => a.dv - b.dv)  // in-place
        iteration++
    } else {
        candidates = input.candidates as CalculatedTrajectory[]
    }

    while(iteration++ < input.iterations) {
        const nextGeneration: Trajectory[] = [
            candidates[0]  // always keep best candidate
        ]

        let fitnessSum = 0
        for(let candidate of candidates) {
            fitnessSum += fitness(candidate)
        }

        while(nextGeneration.length < input.populationSize) {
            const parent1Idx = weightedPick(candidates, fitnessSum)
            const parent2Idx = weightedPick(candidates, fitnessSum)

            const parent1 = candidates[parent1Idx];
            const parent2 = candidates[parent2Idx];
            let child = crossOver(parent1, parent2)
            child = mutate(child)
            nextGeneration.push(child)
        }
        candidates = nextGeneration.map(t => {
            calculations++
            return calcTrajectory(input.sourceOrbit, input.destOrbit, t)
        })
            .filter(c => c != null)
            .sort((a, b) => a.dv - b.dv)  // in-place
    }

    const out: SolverOutput = {
        requestId: input.requestId,
        sortedResult: candidates,
    }
    self.postMessage(out)
    // const duration = (+(new Date()) - startTime)
    // console.log(`Worker did ${input.iterations} iterations for ${candidates.length} candidates, ` +
    //     `${calculations} calculations in ${duration}ms => ${duration / calculations}ms per trajectory`)
}
