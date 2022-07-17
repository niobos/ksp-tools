import {exposeWorker} from "react-hooks-worker";
import OrbitAround, {orbitEvent} from "../utils/orbitAround";
import {Data} from "dataclass";
import Vector from "../utils/vector";
import Orbit from "../utils/orbit";

export enum EventType {
    Initial,
    End,
    CollideOrAtmosphere,
    SoIChange,
    Burn,
    Intercept,
}

export class Burn extends Data {
    t: number;
    prn: Vector;

    serialize(): string {
        return JSON.stringify([this.t, this.prn.x, this.prn.y, this.prn.z]);
    }
    static Unserialize(s: string): Burn {
        const o = JSON.parse(s);
        return Burn.create({t: o[0], prn: new Vector(o[1], o[2], o[3])});
    }
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

exposeWorker(calcPatchedConics);
