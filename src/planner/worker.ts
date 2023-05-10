import OrbitAround, {orbitEvent} from "../utils/orbitAround";
import {Data} from "dataclass";
import Vector from "../utils/vector";
import Orbit from "../utils/orbit";

export class Burn extends Data {
    t: number;
    prn: Vector;

    toObject(): object {
        return this;
    }
    static FromObject(o: any): Burn {
        return Burn.create({
            t: o.t,
            prn: new Vector(o.prn.x, o.prn.y, o.prn.z),
        });
    }
}

let startTime: number = null
let initialOrbit: OrbitAround = null
let burns: Array<Burn> = []
let simulationEnd: number = null
let nextIteration = null

export enum SegmentReason {
    Initial,
    SoIChange,
    Burn,
    CollideOrAtmosphere,
    CurrentSimulationTime
}
export type ConicSegment = {
    startT: number,
    reason: SegmentReason,
    orbit: OrbitAround,
    burnIdx?: number,
};
let segments: Array<ConicSegment> = [];

export type workerMessageType = 'setStartTime'
    | 'setInitialOrbit'
    | 'setBurns'
    | 'calculateUntil';

function smartMin(a, b) {
    // Math.min(), but works with undefined, null, NaN
    return a < b ? a : b
}

self.onmessage = function(e) {
    switch(e.data?.type as workerMessageType) {
    case 'setStartTime':
        startTime = e.data.value
        break;
    case 'setInitialOrbit':
        initialOrbit = OrbitAround.FromObject(e.data.value);
        resetSegments()
        break;
    case 'setBurns':
        // See how much calculations we can keep from previous run
        let sameBurnsUntilTime;
        for(let burnIdx = 0; burnIdx < burns.length; burnIdx++) {
            if(burns[burnIdx].t !== e.data.value[burnIdx]?.t ||
                burns[burnIdx].prn !== e.data.value[burnIdx]?.prn
            ) {
                // different burn, recalculate from the time of the difference
                sameBurnsUntilTime = smartMin(burns[burnIdx].t, e.data.value[burnIdx]?.t);
                break;
            }
        }
        burns = e.data.value;
        resetSegments(sameBurnsUntilTime);
        break;
    case 'calculateUntil':
        simulationEnd = e.data.value;
        break;
    default:
        //console.info("Unhandled message type: " + JSON.stringify(e.data));
        return;
    }

    if(startTime == null || initialOrbit == null || simulationEnd == null) return;

    if(!(segments[segments.length-1]?.startT >= simulationEnd)) {
        /* !(>=) to work with undefined
         * runs if segments is [], or when the last segment.startT is below simulationEnd
         */
        if(nextIteration != null) clearTimeout(nextIteration);
        nextIteration = setTimeout(calcNextSegment, 0);
        /* Run the calculation in small chunks, so we can receive new onmessage-calls
         * in between, and preempt a running calculation to restart with updated values
         */
    }
}

function resetSegments(tAfter?: number) {
    if(tAfter == null || tAfter <= startTime) {
        segments = [
            {
                startT: startTime,
                reason: SegmentReason.Initial,
                orbit: initialOrbit,
            }
        ];
    } else {
        let segmentIdx
        let lastOrbit = initialOrbit
        for(segmentIdx = 0; segmentIdx < segments.length; segmentIdx++) {
            if(segments[segmentIdx].startT >= tAfter) break;
            lastOrbit = segments[segmentIdx].orbit
        }
        segments.splice(segmentIdx); // remove from t onwards
        segments.push({
            startT: tAfter - 1,
            reason: SegmentReason.CurrentSimulationTime,
            orbit: lastOrbit,
        })
    }
}

function calcNextSegment() {
    const previousIteration = segments[segments.length-1];
    let t = previousIteration.startT;
    let orbit = previousIteration.orbit;

    if(previousIteration.reason === SegmentReason.CurrentSimulationTime) {
        // Remove (will be replaced with actual next event)
        segments.splice(segments.length-1)
    }

    let nextEvent;
    try {
        nextEvent = orbit.nextEvent(t, simulationEnd)
    } catch(e) {
        console.log("Failed to find next event. t=", t, ", orbit=", orbit, "  error: ", e)
    }

    let nextBurnIdx;
    for(nextBurnIdx = 0; nextBurnIdx < burns.length; nextBurnIdx++) {
        if(burns[nextBurnIdx].t > t) break
    }

    if(burns[nextBurnIdx]?.t <= (nextEvent?.t ?? Infinity)) {
        /* nextBurnIdx can be burns.length, so burns[nextBurnIdx] may be undefined
         * if burns[]?.t is undefined => false
         */
        // next burn happens before next event; perform the burn
        t = burns[nextBurnIdx].t
        const ta = orbit.orbit.taAtT(t)
        const r = orbit.orbit.positionAtTa(ta)
        const v = orbit.orbit.velocityAtTa(ta)
        const vNew = v.add(orbit.orbit.prnToGlobal(burns[nextBurnIdx].prn, ta))
        orbit = new OrbitAround(
            orbit.body,
            Orbit.FromStateVector(orbit.orbit.gravity, r, vNew, t),
        );
        segments.push({startT: t, reason: SegmentReason.Burn, orbit, burnIdx: nextBurnIdx})

    } else if(nextEvent == null) {  // no event before simulationEnd
        segments.push({startT: simulationEnd, reason: SegmentReason.CurrentSimulationTime, orbit})

    } else if (nextEvent.type === orbitEvent.collideSurface || nextEvent.type === orbitEvent.enterAtmosphere) {
        segments.push({startT: nextEvent.t, reason: SegmentReason.CollideOrAtmosphere, orbit})
        segments.push({startT: simulationEnd, reason: SegmentReason.CollideOrAtmosphere, orbit})  // to signal no more calculations are necessary

    } else if (nextEvent.type === orbitEvent.enterSoI) {
        orbit = orbit.enterSoI(nextEvent.t, nextEvent.body)
        segments.push({startT: nextEvent.t, reason: SegmentReason.SoIChange, orbit})

    } else if (nextEvent.type === orbitEvent.exitSoI) {
        orbit = orbit.exitSoI(nextEvent.t)
        segments.push({startT: nextEvent.t, reason: SegmentReason.SoIChange, orbit})

    } else {  // intercept
        // Note time for next iteration
        segments.push({startT: nextEvent.t, reason: SegmentReason.CurrentSimulationTime, orbit})
    }

    self.postMessage({
        type: 'segments',
        value: segments,
    });
    if(segments[segments.length-1].startT < simulationEnd) {
        nextIteration = setTimeout(calcNextSegment, 0)
    } else {
        nextIteration = null
    }
}
