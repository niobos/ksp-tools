import Orbit, {Radians} from "../utils/orbit";
import Vector from "../utils/vector";

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
export type CalculatedTrajectory = {
    name: string
    legs: Leg[]
    dv: number
}

export type SolverInput = {
    requestId?: any
    sourceOrbit: Orbit
    destOrbit: Orbit
}
export type SolverOutput = {
    requestId?: any
    result: CalculatedTrajectory[]
}

function matchRelativeInclination(source: Orbit, dest: Orbit): null | {
    anTa: Radians, anBurn: Vector,
    dnTa: Radians, dnBurn: Vector,
    bestTa: Radians, bestBurn: Vector,
} {
    /* Match dest's inclination.
     * Returns both the needed burn at the Ascending Node and Descending Node.
     * Also returns a `best` variant, equal to the node with the lowest ∆v
     * Returns null if the orbits are coplanar
     */
    const nodes = source.nodesVs(dest)
    if(nodes.relativeInclination == 0) {
        return null
    }

    const anBurn = source.dvPrnForInclinationChange(nodes.ascendingNodeTa, nodes.relativeInclination)
    const dnBurn = source.dvPrnForInclinationChange(nodes.descendingNodeTa, -nodes.relativeInclination)
    const best = {bestTa: null, bestBurn: null}
    if(anBurn.norm <= dnBurn.norm) {
        best.bestTa = nodes.ascendingNodeTa
        best.bestBurn = anBurn
    } else {
        best.bestTa = nodes.descendingNodeTa
        best.bestBurn = dnBurn
    }
    return {
        anTa: nodes.ascendingNodeTa, anBurn,
        dnTa: nodes.descendingNodeTa, dnBurn,
        ...best,
    }
}

function doBurn(source: Orbit, ta: Radians, burn: Vector): Orbit {
    return Orbit.FromStateVector(
        source.gravity,
        source.positionAtTa(ta),
        source.velocityAtTa(ta).add(burn),
    )
}

const coplanarStrategies: Array<(s: Orbit, d: Orbit) => CalculatedTrajectory[]> = []

coplanarStrategies.push((sourceOrbit: Orbit, destOrbit: Orbit) => {
    const legs: Leg[] = []

    // At periapsis, burn to match distance at TA=π
    const posSourceApoapsis = sourceOrbit.positionAtTa(Math.PI)
    const sourceApoapsisInDestPerifocal = destOrbit.globalToPerifocal(posSourceApoapsis)
    const destTaOfSourceApoapsis = Math.atan2(sourceApoapsisInDestPerifocal.y, sourceApoapsisInDestPerifocal.x)
    const destDistanceAtSourceApoapsis = destOrbit.distanceAtTa(destTaOfSourceApoapsis)
    const dvApoPushPrograde = Orbit.dvPForApsis(
        sourceOrbit.gravity,
        sourceOrbit.distanceAtPeriapsis,
        sourceOrbit.distanceAtApoapsis,
        destDistanceAtSourceApoapsis,
    )
    const dvApoPushPrn = new Vector(dvApoPushPrograde, 0, 0);
    const dvApoPush = sourceOrbit.prnToGlobal(dvApoPushPrn, 0)
    const transferOrbit = Orbit.FromStateVector(
        sourceOrbit.gravity,
        sourceOrbit.positionAtTa(0),  // periapsis
        sourceOrbit.velocityAtTa(0).add(dvApoPush),
        0,
    )
    const transferTa1 = transferOrbit.taAtT(0)
    legs.push({
        burn: {dvPrn: dvApoPushPrn, ta: 0, t: null},
        nextOrbit: transferOrbit,
    })

    // 180º later, match speed to dest orbit
    const transferTa2 = transferTa1 + Math.PI
    const vTransfer = transferOrbit.velocityAtTa(transferTa2)
    const vDest = destOrbit.velocityAtTa(destTaOfSourceApoapsis)
    const dv = vDest.sub(vTransfer)
    const shouldDestOrbit = doBurn(transferOrbit, transferTa2, dv)
    legs.push({
        burn: {ta: Math.PI, t: null, dvPrn: transferOrbit.globalToPrn(dv, transferTa2)},
        nextOrbit: shouldDestOrbit,
    })

    const ct = {
        name: "ap, v2",
        legs: legs,
        dv: legs.reduce((sum, leg) => sum + leg.burn.dvPrn.norm, 0),
    }
    return [ct]
})

const strategies: Array<(s: Orbit, d: Orbit) => CalculatedTrajectory[]> = []

for(let coplanarStrategy of coplanarStrategies) {
    /* We can convert a coplanar strategy into a full strategy
     * by correcting inclination before/after the coplanar strategy
     */
    strategies.push((src: Orbit, dst: Orbit): CalculatedTrajectory[] => {
        const inclBurn = matchRelativeInclination(src, dst)
        if(inclBurn == null) return coplanarStrategy(src, dst)

        const {bestTa, bestBurn} = inclBurn
        const nextOrbit = doBurn(src, bestTa, bestBurn)
        const incChangeLeg = {
            burn: {ta: bestTa, dvPrn: src.globalToPrn(bestBurn, bestTa), t: null},
            nextOrbit,
        }

        const coplanarTrajectories = coplanarStrategy(nextOrbit, dst)
        const trajectories: CalculatedTrajectory[] = []
        for(let coplanarTrajectory of coplanarTrajectories) {
            trajectories.push({
                name: `incl, ${coplanarTrajectory.name}`,
                legs: [incChangeLeg, ...coplanarTrajectory.legs],
                dv: bestBurn.norm + coplanarTrajectory.dv,
            })
        }
        return trajectories
    })

    strategies.push((src: Orbit, dst: Orbit): CalculatedTrajectory[] => {
        const inclBurn = matchRelativeInclination(dst, src)
        if(inclBurn == null) return []  // same strategies were already returned in "do Incl first", so swallow them

        const {bestTa: bestTaRev, bestBurn: bestBurnRev} = inclBurn
        const dstCoplanar = doBurn(dst, bestTaRev, bestBurnRev)

        const coplanarTrajectories = coplanarStrategy(src, dstCoplanar)
        const trajectories: CalculatedTrajectory[] = []
        for(let coplanarTrajectory of coplanarTrajectories) {
            const lastTransferOrbit = coplanarTrajectory.legs[coplanarTrajectory.legs.length-1].nextOrbit
            const {bestTa, bestBurn} = matchRelativeInclination(lastTransferOrbit, dst)
            const bestBurnPrn = lastTransferOrbit.globalToPrn(bestBurn, bestTa)
            const shouldDstOrbit = doBurn(lastTransferOrbit, bestTa, bestBurn)
            const incChangeLeg = {
                burn: {t: null, ta: bestTa, dvPrn: bestBurnPrn},
                nextOrbit: shouldDstOrbit,
            }

            trajectories.push({
                name: `${coplanarTrajectory.name}, incl`,
                legs: [...coplanarTrajectory.legs, incChangeLeg],
                dv: coplanarTrajectory.dv + bestBurn.norm,
            })
        }
        return trajectories
    })
}


let mostRecentRequestId = null
function doNextStrategy(requestId: any, sourceOrbit: Orbit, destOrbit: Orbit, strategyIdx: number = 0) {
    if(requestId != mostRecentRequestId) return
    if(strategyIdx >= strategies.length) return

    const strategy = strategies[strategyIdx]
    const trajectories = strategy(sourceOrbit, destOrbit)

    const out: SolverOutput = {
        requestId: requestId,
        result: trajectories,
    }
    self.postMessage(out)

    // do next strategy after setTimeout(0), so we have the chance to do the onmessage() processing
    setTimeout(() => doNextStrategy(requestId, sourceOrbit, destOrbit, strategyIdx+1), 0)
}

self.onmessage = (m) => {
    if(m.data.type == 'webpackOk') return

    const input: SolverInput = m.data
    input.sourceOrbit = Orbit.FromObject(input.sourceOrbit)
    input.destOrbit = Orbit.FromObject(input.destOrbit)
    mostRecentRequestId = input.requestId

    doNextStrategy(input.requestId, input.sourceOrbit, input.destOrbit, 0)
}
