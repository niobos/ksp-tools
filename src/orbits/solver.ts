import Orbit from "../utils/orbit";
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

export type Trajectory = {
    sourceOrbitTa: Angle
    dt1Transformed: number  // transformed dt such that 0 is the geometric mean of src & dst, and ±1 gives the source & dst periods
    midpointScaled: Vector  // scaled such that 1 => largest_orbit_apoapsis
    dt2Transformed: number  // transformed dt such that 0 is the geometric mean of src & dst, and ±1 gives the source & dst periods
    destOrbitTa: Angle
}
export type CalculatedTrajectory = Trajectory & {
    legs: Leg[]
    dv: number
}

export function sameTrajectory(a: Trajectory, b: Trajectory): boolean {
    return (Math.abs(a.sourceOrbitTa - b.sourceOrbitTa) < 0.01)  &&
        (Math.abs(a.dt1Transformed - b.dt1Transformed) < 0.01) &&
        (Math.abs(a.midpointScaled.sub(b.midpointScaled).norm) < 0.01) &&
        (Math.abs(a.dt2Transformed - b.dt2Transformed) < 0.01) &&
        (Math.abs(a.destOrbitTa - b.destOrbitTa) < 0.01)
}
export function dedupTrajectories(trs: Trajectory[]): void {
    for(let field of ["sourceOrbitTa", "dt1Transformed", "midpointScaled", "dt2Transformed", "destOrbitTa"]) {
        trs.sort((a, b) => a[field] - b[field])  // in-place
        for (let i = 0; i < trs.length; i++) {
            if (i == 0) continue
            if (sameTrajectory(trs[i - 1], trs[i])) {
                trs.splice(i, 1)
                i--
            }
        }
    }
}

export type SolverInput = {
    requestId?: any
    sourceOrbit: Orbit
    destOrbit: Orbit
    numTries: number
}
export type SolverOutput = {
    requestId?: any
    result: CalculatedTrajectory[]
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

    const largestOrbitApoapsis = Math.max(sourceOrbit.distanceAtApoapsis, destOrbit.distanceAtApoapsis)
    const midpoint = t.midpointScaled.mul(largestOrbitApoapsis)

    const geoMeanPeriod = Math.sqrt(sourceOrbit.period * destOrbit.period)
    const geoMeanPeriodScale = Math.sqrt(sourceOrbit.period / destOrbit.period)
    const dt1 = geoMeanPeriod * Math.pow(geoMeanPeriodScale, t.dt1Transformed)
    const dt2 = geoMeanPeriod * Math.pow(geoMeanPeriodScale, t.dt2Transformed)

    try {
        const {orbit: transferOrbit1, arc: arc1, v1: transfer1V1} = Orbit.FromLambert(
            sourceOrbit.gravity, p1, midpoint, dt1,
        )
        const {orbit: transferOrbit2, arc: arc2, v1: transfer2V1} = Orbit.FromLambert(
            sourceOrbit.gravity, midpoint, p2, dt2,
        )
        // TODO: do we want to check both prograde & retrograde?

        const dv1 = transfer1V1.sub(v1)
        const p1Transfer1Perifocal = transferOrbit1.globalToPerifocal(p1)
        const transfer1Ta1 = Math.atan2(p1Transfer1Perifocal.y, p1Transfer1Perifocal.x)
        const transfer1Ta2 = transfer1Ta1 + arc1;
        const transfer1V2 = transferOrbit1.velocityAtTa(transfer1Ta2)

        const dv2 = transfer2V1.sub(transfer1V2)
        const midpointTransfer2Perifocal = transferOrbit2.globalToPerifocal(midpoint)
        const transfer2Ta1 = Math.atan2(midpointTransfer2Perifocal.y, midpointTransfer2Perifocal.x)
        const transfer2Ta2 = transfer2Ta1 + arc2;
        const transfer2V2 = transferOrbit2.velocityAtTa(transfer2Ta2)
        const dv3 = v2.sub(transfer2V2)

        const legs: Leg[] = []
        const t0 = sourceOrbit.tAtTa(t.sourceOrbitTa);
        legs.push({
            burn: {
                ta: t.sourceOrbitTa,
                t: t0,
                dvPrn: sourceOrbit.globalToPrn(dv1, t.sourceOrbitTa),
            },
            nextOrbit: transferOrbit1,
        })
        legs.push({
            burn: {
                ta: transfer1Ta2,
                t: t0 + dt1,
                dvPrn: transferOrbit1.globalToPrn(dv2, transfer1Ta2),
            },
            nextOrbit: transferOrbit2,
        })
        legs.push({
            burn: {
                ta: transfer2Ta2,
                t: t0 + dt1 + dt2,
                dvPrn: transferOrbit2.globalToPrn(dv3, transfer2Ta2)
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


self.onmessage = (m) => {
    if(m.data.type == 'webpackOk') return

    // const startTime = +(new Date())
    const input: SolverInput = m.data
    input.sourceOrbit = Orbit.FromObject(input.sourceOrbit)
    input.destOrbit = Orbit.FromObject(input.destOrbit)
    // console.log(`Starting ${input.requestId}`)

    const candidates: CalculatedTrajectory[] = []
    for(let i = 0; i < input.numTries; i++) {
        const cost = (x) => {
            const ct = calcTrajectory(
                input.sourceOrbit, input.destOrbit,
                {
                    sourceOrbitTa: x[0],
                    dt1Transformed: x[1],
                    midpointScaled: new Vector(x[2], x[3], x[4]),
                    dt2Transformed: x[5],
                    destOrbitTa: x[6],
                }
            )
            if(ct == null) {
                return {cost: Infinity, ct: ct}
            }
            return {cost: ct.dv, ct: ct}
        }
        const {fmin} = Orbit._findMinimum(cost, [
            /* sourceOrbitTa */ Math.random() * 2 * Math.PI,
            /* dt1Transformed */ Math.random() * 4 - 2,
            /* midpoint */ 0.1 + Math.random() * 2, 0.1 + Math.random() * 2, 0.1 + Math.random() * 2,
            /* dt2Transformed */ Math.random() * 4 - 2,
            /* destOrbitTa */ Math.random() * 2 * Math.PI,
        ], 0.01)

        if(fmin.ct != null) candidates.push(fmin.ct)
    }

    const out: SolverOutput = {
        requestId: input.requestId,
        result: candidates,
    }
    self.postMessage(out)
    // const duration = (+(new Date()) - startTime)
    // console.log(`Worker did ${input.numTries} tries in ${duration}ms => ${duration / input.numTries}ms per trajectory`)
}
