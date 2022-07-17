import Body from './kspBody';
import Orbit, {OrbitalPhase} from "./orbit";
import {bodies as kspBodies} from './kspBody';
import {orbits as kspOrbits} from './kspOrbit';

export enum orbitEvent {
    exitSoI,
    enterSoI,
    enterAtmosphere,
    collideSurface,  // For bodies without atmosphere
    intercept,  // Local minimum in distance between both orbits, but too far for enterSoI
}

export default class OrbitAround {
    /* Similar to orbit, but includes SOI-changes
     */

    constructor(
        public body: Body,
        public orbit: Orbit,
    ) {
        if(body.gravity !== orbit.gravity) throw "Gravity mismatch";
    }

    static FromObject(o: any): OrbitAround {
        return new OrbitAround(
            kspBodies[o.body.name],
            Orbit.FromObject(o.orbit),
        );
    }

    serialize(): string {
        return JSON.stringify({
            b: this.body.name,
            o: this.orbit.serialize(),
        });
    }
    static Unserialize(s: string): OrbitAround {
        const o = JSON.parse(s);
        return new OrbitAround(
            kspBodies[o.b],
            Orbit.Unserialize(o.o),
        )
    }

    nextEvent(
        t: number,
    ): {
        t: number,
        type: orbitEvent,
        body: Body,
    } {
        const ta = this.orbit.taAtT(t);
        const r = this.orbit.positionAtTa(ta);
        if(r.norm > this.body.soi * 1.01) return {  // rounding
            t: t,
            type: orbitEvent.exitSoI,
            body: this.body,
        }
        if(r.norm < this.body.radius) return {
            t: t,
            type: orbitEvent.collideSurface,
            body: this.body,
        }
        if(this.body.atmosphere != null && r.norm < this.body.radius + this.body.atmosphere) return {
            t: t,
            type: orbitEvent.enterAtmosphere,
            body: this.body,
        }

        const events = [];

        const taExit = this.orbit.taAtDistance(this.body.soi);
        if(!isNaN(taExit)) {
            let tExit = this.orbit.tAtTa(taExit);
            while(tExit < t) tExit += this.orbit.period || Infinity;
            events.push({
                t: tExit,
                type: orbitEvent.exitSoI,
                body: this.body,
            });
        }

        const taCollide = this.orbit.taAtDistance(this.body.radius + (this.body.atmosphere || 0));
        if(!isNaN(taCollide)) {
            let tCollide = this.orbit.tAtTa(taCollide);
            while(tCollide < t) tCollide += this.orbit.period || Infinity;
            events.push({
                t: tCollide,
                type: this.body.atmosphere != null ? orbitEvent.enterAtmosphere : orbitEvent.collideSurface,
                body: this.body,
            })
        }
        events.sort((a, b) => a.t - b.t);  // in-place

        for(let subBody of this.body.isOrbitedBy()) {
            const subBodyOrbit = kspOrbits[subBody.name];
            const nextIntercept = this.orbit.nextIntercept(subBodyOrbit, t, events[0]?.t);
            if(nextIntercept != null) {
                if(nextIntercept.separation < subBody.soi) {
                    try {
                        const tsoi = Orbit._findZeroBisect(
                            (t) => {
                                const r = this.orbit.positionAtT(t);
                                const rsb = subBodyOrbit.positionAtT(t);
                                const sep = r.sub(rsb).norm;
                                return sep - subBody.soi;
                            },
                            (t+nextIntercept.t)/2, nextIntercept.t + 10,
                        );
                        events.push({
                            t: tsoi,
                            type: orbitEvent.enterSoI,
                            body: subBody,
                        });
                    } catch(e) {
                        console.log("Couldn't determine exact SoI change moment for orbit ", this.orbit,
                            " with body ", subBody.name, ". Should be between ", t, " and ", nextIntercept.t);
                        throw e;
                    }
                } else {
                    events.push({
                        t: nextIntercept.t,
                        type: orbitEvent.intercept,
                        body: subBody,
                    });
                }
            }
        }

        events.sort((a, b) => a.t - b.t);  // in-place
        return events[0];
    }

    exitSoI(t: number): OrbitAround {
        if(this.body.orbitsAround == null) throw "Can't exit SoI, no parent body";

        const taOld = this.orbit.taAtT(t);
        const rOld = this.orbit.positionAtTa(taOld);
        const vOld = this.orbit.velocityAtTa(taOld);

        if(rOld.norm < this.body.soi * 0.99 || rOld.norm > this.body.soi * 1.01) {
            throw "Not at SoI edge";
        }

        const bodyOrbit = kspOrbits[this.body.name];
        const taBody = bodyOrbit.taAtT(t);
        const rBody = bodyOrbit.positionAtTa(taBody);
        const vBody = bodyOrbit.velocityAtTa(taBody);

        return new OrbitAround(
            this.body.orbitsAround,
            Orbit.FromStateVector(
                this.body.orbitsAround.gravity,
                rBody.add(rOld),
                vBody.add(vOld),
                t,
            )
        );
    }

    enterSoI(t: number, subBody: Body): OrbitAround {
        if(subBody.orbitsAround !== this.body) throw `${subBody.name} is not a sub-body of ${this.body.name}`;

        const taOld = this.orbit.taAtT(t);
        const rOld = this.orbit.positionAtTa(taOld);
        const vOld = this.orbit.velocityAtTa(taOld);

        const bodyOrbit = kspOrbits[subBody.name];
        const taBody = bodyOrbit.taAtT(t);
        const rBody = bodyOrbit.positionAtTa(taBody);
        const vBody = bodyOrbit.velocityAtTa(taBody);

        const rNew = rOld.sub(rBody);
        const vNew = vOld.sub(vBody);

        if(rNew.norm < subBody.soi * 0.99 || rNew.norm > subBody.soi * 1.01) {
            throw "Not at SoI edge";
        }

        return new OrbitAround(
            subBody,
            Orbit.FromStateVector(
                subBody.gravity,
                rNew,
                vNew,
                t,
            )
        );

    }
}
