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

const coplanarStrategies: Array<(s: Orbit, d: Orbit) => CalculatedTrajectory[]> = [
    // Order strategies fast to slow, so we can present partial results while slower strategies calculate
]

// https://space.stackexchange.com/questions/19910/optimal-change-of-argument-of-periapsis
// https://space.stackexchange.com/questions/16931/is-the-ideal-transfer-between-two-arbitrary-planar-orbits-always-a-bi-tangential

function coplanarApsisV2(sourceOrbit: Orbit, destOrbit: Orbit, apsis: "apoapsis" | "periapsis"): CalculatedTrajectory {
    /* At `apsis`, burn to match distance at other side;
     * 180º later, burn to match destOrbit's velocity
     */
    const name = `${apsis.substring(0, 2)}, v2`
    const legs: Leg[] = []

    const srcTaStart = apsis == "periapsis" ? 0 : Math.PI
    const positionStart = sourceOrbit.positionAtTa(srcTaStart)
    const positionSrcEnd = sourceOrbit.positionAtTa(srcTaStart + Math.PI)
    const directionEndDestPerifocal = destOrbit.globalToPerifocal(positionSrcEnd)
    const destTaEnd = Math.atan2(directionEndDestPerifocal.y, directionEndDestPerifocal.x)
    const distanceEnd = destOrbit.distanceAtTa(destTaEnd)

    const dvApoPushPrograde = Orbit.dvPForApsis(
        sourceOrbit.gravity,
        positionStart.norm,
        positionSrcEnd.norm,
        distanceEnd,
    )
    const dvApoPushPrn = new Vector(dvApoPushPrograde, 0, 0);
    const dvApoPush = sourceOrbit.prnToGlobal(dvApoPushPrn, srcTaStart)
    const transferOrbit = Orbit.FromStateVector(
        sourceOrbit.gravity,
        positionStart,
        sourceOrbit.velocityAtTa(srcTaStart).add(dvApoPush),
        0,
    )
    const transferTa1 = transferOrbit.taAtT(0)
    legs.push({
        burn: {dvPrn: dvApoPushPrn, ta: srcTaStart, t: null},
        nextOrbit: transferOrbit,
    })

    // 180º later, match speed to dest orbit
    const transferTa2 = transferTa1 + Math.PI
    const vTransfer = transferOrbit.velocityAtTa(transferTa2)
    const vDest = destOrbit.velocityAtTa(destTaEnd)
    const dv = vDest.sub(vTransfer)
    const shouldDestOrbit = doBurn(transferOrbit, transferTa2, dv)
    legs.push({
        burn: {ta: Math.PI, t: null, dvPrn: transferOrbit.globalToPrn(dv, transferTa2)},
        nextOrbit: shouldDestOrbit,
    })

    const ct = {
        name,
        legs: legs,
        dv: legs.reduce((sum, leg) => sum + leg.burn.dvPrn.norm, 0),
    }
    return ct
}
coplanarStrategies.push((sourceOrbit: Orbit, destOrbit: Orbit) => {
    return [
        coplanarApsisV2(sourceOrbit, destOrbit, "apoapsis"),
        coplanarApsisV2(sourceOrbit, destOrbit, "periapsis"),
    ]
})


const strategies: Array<(s: Orbit, d: Orbit) => CalculatedTrajectory[]> = [
    // Order strategies fast to slow, so we can present partial results while slower strategies calculate
]

for(let coplanarStrategy of coplanarStrategies) {
    /* We can convert a coplanar strategy into a full strategy
     * by correcting inclination before/after the coplanar strategy
     */
    strategies.push((src: Orbit, dst: Orbit): CalculatedTrajectory[] => {
        const inclBurn = matchRelativeInclination(src, dst)
        if(inclBurn == null) return coplanarStrategy(src, dst)

        const correctInclination = (ta, burn, name): CalculatedTrajectory[] => {
            const nextOrbit = doBurn(src, ta, burn)
            const incChangeLeg = {
                burn: {ta: ta, dvPrn: src.globalToPrn(burn, ta), t: null},
                nextOrbit,
            }

            const trajectories: CalculatedTrajectory[] = []
            const coplanarTrajectories = coplanarStrategy(nextOrbit, dst)
            for(let coplanarTrajectory of coplanarTrajectories) {
                trajectories.push({
                    name: name(coplanarTrajectory.name),
                    legs: [incChangeLeg, ...coplanarTrajectory.legs],
                    dv: burn.norm + coplanarTrajectory.dv,
                })
            }
            return trajectories
        }
        return [
            ...correctInclination(inclBurn.anTa, inclBurn.anBurn, (cpName) => `inclAn, ${cpName}`),
            ...correctInclination(inclBurn.dnTa, inclBurn.dnBurn, (cpName) => `inclDn, ${cpName}`),
        ]
    })

    strategies.push((src: Orbit, dst: Orbit): CalculatedTrajectory[] => {
        const inclBurn = matchRelativeInclination(dst, src)
        if(inclBurn == null) return []  // same strategies were already returned in "do Incl first" (above), so swallow them
        const {anTa: taRev, anBurn: burnRev} = inclBurn
        const dstCoplanar = doBurn(dst, taRev, burnRev)
        // The True anomaly and burn may be different between AN and DN, but the resulting rotated orbit is the same

        const coplanarTrajectories = coplanarStrategy(src, dstCoplanar)
        const trajectories: CalculatedTrajectory[] = []
        for(let coplanarTrajectory of coplanarTrajectories) {
            const lastTransferOrbit = coplanarTrajectory.legs[coplanarTrajectory.legs.length-1].nextOrbit

            const inclBurn = matchRelativeInclination(lastTransferOrbit, dst)
            const correctInclination = (ta, burn, name) => {
                const burnPrn = lastTransferOrbit.globalToPrn(burn, ta)
                const shouldDstOrbit = doBurn(lastTransferOrbit, ta, burn)
                const incChangeLeg = {
                    burn: {t: null, ta: ta, dvPrn: burnPrn},
                    nextOrbit: shouldDstOrbit,
                }

                return {
                    name,
                    legs: [...coplanarTrajectory.legs, incChangeLeg],
                    dv: coplanarTrajectory.dv + burn.norm,
                }
            }
            trajectories.push(correctInclination(inclBurn.anTa, inclBurn.anBurn, `${coplanarTrajectory.name}, inclAn`))
            trajectories.push(correctInclination(inclBurn.dnTa, inclBurn.dnBurn, `${coplanarTrajectory.name}, inclDn`))
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
