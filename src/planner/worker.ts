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

let startTime = null;
let initialOrbit = null;
let burns = [];
let endSimulation = null;
let nextIteration = null;

export enum SegmentReason {
    Initial,
    SoIChange,
    Burn,
    CollideOrAtmosphere,
    EndOfSimulation
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

self.onmessage = function(e) {
    switch(e.data?.type as workerMessageType) {
    case 'setStartTime':
        startTime = e.data.value;
        resetSegments();
        break;
    case 'setInitialOrbit':
        initialOrbit = OrbitAround.FromObject(e.data.value);
        resetSegments()
        break;
    case 'setBurns':
        // See how much calculations we need to redo
        let burnIdx;
        let tMin;
        for(burnIdx = 0; burnIdx < burns.length; burnIdx++) {
            if(burns[burnIdx].t !== e.data.value[burnIdx]?.t &&
                burns[burnIdx].prn !== e.data.value[burnIdx]?.prn
            ) {
                tMin = Math.min(burns[burnIdx].t, e.data.value[burnIdx].t);
                break;
            }
        }
        burns = e.data.value;
        resetSegments(tMin);
        break;
    case 'calculateUntil':
        endSimulation = e.data.value;
        break;
    default:
        console.info("Unhandled message type " + e.data?.type);
        return;
    }

    if(startTime == null || initialOrbit == null || endSimulation == null) return;

    if(!(segments[segments.length-1]?.startT >= endSimulation)) {  // !(>=) to work with undefined
        if(nextIteration != null) clearTimeout(nextIteration);
        nextIteration = setTimeout(calcNextSegment, 0);
    }
}

function resetSegments(t?: number) {
    if(t == null || t <= startTime) {
        segments = [
            {
                startT: startTime,
                reason: SegmentReason.Initial,
                orbit: initialOrbit,
            }
        ];
    } else {
        let segmentIdx;
        for(segmentIdx = 0; segmentIdx < segments.length; segmentIdx++) {
            if(segments[segmentIdx].startT >= t) break;
        }
        segments.splice(segmentIdx); // remove from t onwards
    }
}

function calcNextSegment() {
    const previousIteration = segments[segments.length-1];
    let t = previousIteration.startT;
    let orbit = previousIteration.orbit;

    if(previousIteration.reason === SegmentReason.EndOfSimulation) {
        // Remove (will be replaced with actual next event)
        segments.splice(segments.length-1);
    }

    let nextEvent;
    try {
        nextEvent = orbit.nextEvent(t);
    } catch(e) {
        console.log("Failed to find next event. t=", t, ", orbit=", orbit, "  error: ", e);
    }

    let nextBurnIdx;
    for(nextBurnIdx = 0; nextBurnIdx < burns.length; nextBurnIdx++) {
        if(burns[nextBurnIdx].t > t) break;
    }
    if(burns[nextBurnIdx]?.t <= nextEvent.t) {
        t = burns[nextBurnIdx].t;
        const ta = orbit.orbit.taAtT(t);
        const r = orbit.orbit.positionAtTa(ta);
        const v = orbit.orbit.velocityAtTa(ta);
        const vNew = v.add( orbit.orbit.prnToGlobal(burns[nextBurnIdx].prn, ta) );
        orbit = new OrbitAround(
            orbit.body,
            Orbit.FromStateVector(orbit.orbit.gravity, r, vNew, t),
        );
        segments.push({startT: t, reason: SegmentReason.Burn, orbit, burnIdx: nextBurnIdx});

    } else if (nextEvent.type === orbitEvent.collideSurface || nextEvent.type === orbitEvent.enterAtmosphere) {
        segments.push({startT: nextEvent.t, reason: SegmentReason.CollideOrAtmosphere, orbit});
        segments.push({startT: endSimulation, reason: SegmentReason.CollideOrAtmosphere, orbit});

    } else if (nextEvent.type === orbitEvent.enterSoI) {
        orbit = orbit.enterSoI(nextEvent.t, nextEvent.body);
        segments.push({startT: nextEvent.t, reason: SegmentReason.SoIChange, orbit});

    } else if (nextEvent.type === orbitEvent.exitSoI) {
        orbit = orbit.exitSoI(nextEvent.t);
        segments.push({startT: nextEvent.t, reason: SegmentReason.SoIChange, orbit});

    } else {  // intercept
        // Note time for next iteration
        segments.push({startT: nextEvent.t, reason: SegmentReason.EndOfSimulation, orbit});
    }

    self.postMessage(segments);
    if(segments[segments.length-1].startT < endSimulation) {
        nextIteration = setTimeout(calcNextSegment, 0);
    }
}



export enum EventType {
    Initial,
    End,
    CollideOrAtmosphere,
    SoIChange,
    Burn,
    Intercept,
}

export type calcPatchedConicsInput = {
    startTime: number,
    initialOrbit: OrbitAround,
    burns?: Array<Burn>,
    simulateTimeout?: number,
    returnIntercepts?: boolean,
};
export type calcPatchedConicsOutput = {
    t: number,
    event: EventType,
    newOrbit: OrbitAround,
    burnIdx?: number,
};

function* calcPatchedConics(input: calcPatchedConicsInput): Generator<calcPatchedConicsOutput> {
    if (input == null || input.startTime == null || input.initialOrbit == null) {
        // Ignore WebPack debug messages
        return undefined;
    }
    if(input.simulateTimeout == null) input.simulateTimeout = 10*426*6*60*60;  // 10 Kerbal-years
    console.log("Starting simulation...");

    // initialOrbit is received over a message channel as JSON. So it's just an object, not an OrbitAround
    let orbit = OrbitAround.FromObject(input.initialOrbit);

    yield {t: input.startTime, event: EventType.Initial, newOrbit: orbit};

    let t = input.startTime;
    let tLastEvent = input.startTime;
    let nextBurnIdx = 0;
    while (t < tLastEvent + input.simulateTimeout) {
        console.log("Simulating t=", t, "; timeout at ", tLastEvent + input.simulateTimeout, "...");

        let nextEvent;
        try {
            nextEvent = orbit.nextEvent(t);
        } catch(e) {
            console.log("Failed to find next event. t=", t, ", orbit=", orbit, "  error: ", e);
        }
        if(input.burns[nextBurnIdx]?.t <= nextEvent.t) {
            t = input.burns[nextBurnIdx].t;
            tLastEvent = t;
            const ta = orbit.orbit.taAtT(t);
            const r = orbit.orbit.positionAtTa(ta);
            const v = orbit.orbit.velocityAtTa(ta);
            const vNew = v.add( orbit.orbit.prnToGlobal(input.burns[nextBurnIdx].prn, ta) );
            orbit.orbit = Orbit.FromStateVector(orbit.orbit.gravity, r, vNew, t);
            yield {t: t, event: EventType.Burn, newOrbit: orbit, burnIdx: nextBurnIdx};
            nextBurnIdx++;
            continue;
        }

        t = nextEvent.t;
        if (nextEvent.type === orbitEvent.collideSurface || nextEvent.type === orbitEvent.enterAtmosphere) {
            yield {t: nextEvent.t, event: EventType.CollideOrAtmosphere, newOrbit: orbit};
            break;
        }
        if (nextEvent.type === orbitEvent.enterSoI) {
            orbit = orbit.enterSoI(nextEvent.t, nextEvent.body);
            yield {t: nextEvent.t, event: EventType.SoIChange, newOrbit: orbit};
            tLastEvent = t;
        } else if (nextEvent.type === orbitEvent.exitSoI) {
            orbit = orbit.exitSoI(nextEvent.t);
            yield {t: nextEvent.t, event: EventType.SoIChange, newOrbit: orbit};
            tLastEvent = t;
        } else {  // intercept
            if(input.returnIntercepts) {
                yield {t: nextEvent.t, event: EventType.Intercept, newOrbit: orbit};
            }
        }
    }

    yield {t: t, event: EventType.End, newOrbit: orbit};
    console.log("Simulation done...")
}

