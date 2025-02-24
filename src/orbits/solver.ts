import Orbit, {Meter, MeterPerSecond, Radians} from "../utils/orbit";
import Vector from "../utils/vector";
import {findMinimumNelderMead} from "../utils/optimize";

type Angle = number
type Seconds = number

export type Burn = {
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

function searchOptimalBurnForDistanceCoplanar(
    o: Orbit,
    burnTa: Radians,
    distanceTa: Radians,
    targetDistance: Meter
): {
    burn: Vector<MeterPerSecond>,
    transferOrbit: Orbit,
    v1Transfer: Vector<MeterPerSecond>,
    ta2Transfer: Radians,  // True anomalies of the start/end of the tranfer orbit
} {
    /* Naively searches for a P+R burn at burnTa that brings the distance
     * at distanceTa (vs the original periapsis) to targetDistance.
     * Note that the most optimal burn may induce a retrogade orbit
     */
    const p1 = o.positionAtTa(burnTa)
    const v1 = o.velocityAtTa(burnTa)
    const dir2 = o.positionAtTa(distanceTa)

    // What would v1 be for an orbit with apsis p1 and targetDistance?
    const guessOrbit = Orbit.FromOrbitalElements(o.gravity,
        Orbit.smaEFromApsides(p1.norm, targetDistance)
    )
    const s1guess = guessOrbit.speedAtTa(p1.norm < targetDistance ? 0 : Math.PI)
    const v1dir = p1.rotated(o.specificAngularMomentumVector, Math.PI/2)
    const v1guess = v1dir.mul(s1guess/v1dir.norm)
    const dvGuess = v1guess.sub(v1)
    const dvGuessPrn = o.globalToPrn(dvGuess, burnTa)

    const distanceAfterPrBurn = (x: [number, number]) => {
        const burnPrn = new Vector(x[0], x[1], 0)
        const burn = o.prnToGlobal(burnPrn, burnTa)
        const v1t = v1.add(burn)
        const transferOrbit = Orbit.FromStateVector(o.gravity, p1, v1t)
        const dir2perifocal = transferOrbit.globalToPerifocal(dir2)
        const taTransfer = Math.atan2(dir2perifocal.y, dir2perifocal.x)
        const d2 = transferOrbit.distanceAtTa(taTransfer)
        const distanceError = (d2 > 0 ? d2 : Infinity) - targetDistance  // watch out for hyperbolic orbits
        const cost = distanceError*distanceError + x[0]*x[0] + x[1]*x[1]
        //console.log(`${x[0]}, ${x[1]} => ${d2} instead of ${targetDistance} => cost=${cost}`)
        return {
            cost: cost,
            // Also take ∆v in to account for cost
            burn, burnPrn,
            transferOrbit,
            v1: v1t,
            ta2: taTransfer,
            d2,
        }
    }
    const bestBurn = findMinimumNelderMead(
        distanceAfterPrBurn,
        [dvGuessPrn.x, dvGuessPrn.y],
        {
            cmpFx: (a, b) => a.cost - b.cost,
            terminateFxDelta: (fxmin, fxmax) => fxmax.cost - fxmin.cost < 1e-8,
        },
    )
    //console.log('done', bestBurn)

    return {
        burn: bestBurn.fx.burn,
        transferOrbit: bestBurn.fx.transferOrbit,
        v1Transfer: bestBurn.fx.v1,
        ta2Transfer: bestBurn.fx.ta2,
    }
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
        burn: {dvPrn: dvApoPushPrn, ta: srcTaStart},
        nextOrbit: transferOrbit,
    })

    // 180º later, match speed to dest orbit
    const transferTa2 = transferTa1 + Math.PI
    const vTransfer = transferOrbit.velocityAtTa(transferTa2)
    const vDest = destOrbit.velocityAtTa(destTaEnd)
    const dv = vDest.sub(vTransfer)
    const shouldDestOrbit = doBurn(transferOrbit, transferTa2, dv)
    legs.push({
        burn: {ta: Math.PI, dvPrn: transferOrbit.globalToPrn(dv, transferTa2)},
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
    strategies.push((src: Orbit, dst: Orbit): CalculatedTrajectory[] => { // Correct inclination first
        const inclBurn = matchRelativeInclination(src, dst)
        if(inclBurn == null) return coplanarStrategy(src, dst)

        const correctInclination = (ta, burn, name): CalculatedTrajectory[] => {
            const nextOrbit = doBurn(src, ta, burn)
            const incChangeLeg: Leg = {
                burn: {ta: ta, dvPrn: src.globalToPrn(burn, ta)},
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

    strategies.push((src: Orbit, dst: Orbit): CalculatedTrajectory[] => {  // correct inclination last
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

    strategies.push((src: Orbit, dst: Orbit): CalculatedTrajectory[] => {  // Correct inclination at SoI edge
        // TODO
        return []
    })
}

function nodeToNode(src: Orbit, dst: Orbit, startNode: "ascending" | "descending"): CalculatedTrajectory[] {
    /* At (relative) Ascending Node, burn to match the distance of the destination
     * orbit at the other side.
     */
    const nodes = src.nodesVs(dst)
    const ta1s = startNode == "ascending" ? nodes.ascendingNodeTa : nodes.descendingNodeTa
    const ta2s = startNode == "ascending" ? nodes.descendingNodeTa : nodes.ascendingNodeTa
    const ta2d = startNode == "ascending" ? nodes.descendingNodeOtherTa : nodes.ascendingNodeOtherTa
    const p1 = src.positionAtTa(ta1s)
    const v1 = src.velocityAtTa(ta1s)
    const p2 = dst.positionAtTa(ta2d)
    const d2 = p2.norm
    const v2d = dst.velocityAtTa(ta2d)

    const distanceBurn = searchOptimalBurnForDistanceCoplanar(src, ta1s, ta2s, d2)
    const v1t = distanceBurn.v1Transfer
    const v2t = distanceBurn.transferOrbit.velocityAtTa(distanceBurn.ta2Transfer)

    let name: string
    let burn1: Vector<MeterPerSecond>, transferOrbit: Orbit
    let burn2: Vector<MeterPerSecond>, finalOrbit: Orbit
    if (nodes.relativeInclination == 0) {  // coplanar
        name = `${startNode.substring(0, 1)}n, match`
        burn1 = distanceBurn.burn
        transferOrbit = distanceBurn.transferOrbit
        burn2 = v2d.sub(v2t)
        finalOrbit = doBurn(transferOrbit, distanceBurn.ta2Transfer, burn2)
    } else {
        const dvInclinationSplit = (x: [number]) => {
            const inc1 = x[0]

            const v1tInc = v1t.rotated(p1, -inc1)
            const dv1 = v1tInc.sub(v1)

            const v2tInc = v2t.rotated(p1, -inc1)
            const dv2 = v2d.sub(v2tInc)
            //console.log(`Inclsplit: ${x[0]} => ${dv1.norm} + ${dv2.norm} = ${dv1.norm + dv2.norm}`)
            return {
                cost: dv1.norm + dv2.norm,
                burn1: dv1,
                burn2: dv2,
            }
        }
        const bestInclinationSplit = findMinimumNelderMead(
            dvInclinationSplit,
            [nodes.relativeInclination / 2],
            {
                cmpFx: (a, b) => a.cost - b.cost,
                terminateFxDelta: (fxmin, fxmax) => fxmax.cost - fxmin.cost < 1e-8
            }
        )
        //console.log("best inclsplit: ", bestInclinationSplit)
        name = `${startNode.substring(0, 1)}n`
            + `+${(bestInclinationSplit.x[0] / Math.PI * 180).toFixed(1)}ºIncl, `
            + `match (${((nodes.relativeInclination - bestInclinationSplit.x[0]) / Math.PI * 180).toFixed(1)}ºIncl)`
        burn1 = bestInclinationSplit.fx.burn1
        transferOrbit = doBurn(src, ta1s, burn1)
        burn2 = bestInclinationSplit.fx.burn2
        finalOrbit = doBurn(transferOrbit, distanceBurn.ta2Transfer, burn2)
    }

    return [{
        name,
        dv: burn1.norm + burn2.norm,
        legs: [{
            burn: {ta: ta1s, dvPrn: src.globalToPrn(burn1, ta1s)},
            nextOrbit: transferOrbit
        }, {
            burn: {ta: distanceBurn.ta2Transfer, dvPrn: transferOrbit.globalToPrn(burn2, distanceBurn.ta2Transfer)},
            nextOrbit: finalOrbit
        }]
    }]
}
strategies.push((src: Orbit, dst: Orbit) => { return nodeToNode(src, dst, "ascending") })
strategies.push((src: Orbit, dst: Orbit) => { return nodeToNode(src, dst, "descending") })


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
