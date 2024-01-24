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
    destOrbitTa: Angle
    dtTransformed: number  // transformed dt such that 0 is the geometric mean of src & dst, and ±1 gives the source & dst periods
}
export type CalculatedTrajectory = Trajectory & {
    legs: Leg[]
    dv: number
}

export function sameTrajectory(a: Trajectory, b: Trajectory): boolean {
    return (Math.abs(a.sourceOrbitTa - b.sourceOrbitTa) < 0.01)  &&
        (Math.abs(a.destOrbitTa - b.destOrbitTa) < 0.01) &&
        (Math.abs(a.dtTransformed - b.dtTransformed) < 0.01)
}
export function dedupTrajectories(trs: Trajectory[]): void {
    for(let field of ["sourceOrbitTa", "destOrbitTa", "dtInSourceOrbitPeriod"]) {
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

    const geoMeanPeriod = Math.sqrt(sourceOrbit.period * destOrbit.period)
    const geoMeanPeriodScale = Math.sqrt(sourceOrbit.period / destOrbit.period)
    const dt = geoMeanPeriod * Math.pow(geoMeanPeriodScale, t.dtTransformed)

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
                    destOrbitTa: x[1],
                    dtTransformed: x[2],
                }
            )
            if(ct == null) {
                return {cost: Infinity, ct: ct}
            }
            return {cost: ct.dv, ct: ct}
        }
        const {fmin} = Orbit._findMinimum(cost, [
            /* sourceOrbitTa */ Math.random() * 2 * Math.PI,
            /* destOrbitTa */ Math.random() * 2 * Math.PI,
            /* dtTransformed */ Math.random() * 4 - 2,
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
