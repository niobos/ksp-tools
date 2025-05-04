import kspSystems, {Body, KspSystem} from "./kspSystems"
import Orbit, {OrbitalPhase} from "./orbit"
import {findZeroBisect} from "./optimize"

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
        public system: KspSystem,
        public bodyName: string,
        public orbit: Orbit,
    ) {
        if(system.bodies[bodyName].gravity !== orbit.gravity) throw "Gravity mismatch";
    }

    static FromObject(o: any): OrbitAround {
        const system = KspSystem.FromObject(o.system)
        return new OrbitAround(
            system,
            o.bodyName,
            Orbit.FromObject(o.orbit),
        );
    }

    serialize(): string {
        return JSON.stringify({
            sys: this.system.name,
            b: this.bodyName,
            o: this.orbit.serialize(),
        });
    }
    static Unserialize(s: string): OrbitAround {
        const o = JSON.parse(s);
        const system = kspSystems[o.sys]
        return new OrbitAround(
            system,
            o.b,
            Orbit.Unserialize(o.o),
        )
    }

    get body() {
        return this.system.bodies[this.bodyName]
    }

    nextEvent(
        t: number,
        tEnd: number = Infinity,
    ): {
        t: number,
        type: orbitEvent,
        body: Body,
    } {
        // First check events that already happened or are happening right now
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
        if(this.body.atmosphereHeight != null && r.norm < this.body.radius + this.body.atmosphereHeight) return {
            t: t,
            type: orbitEvent.enterAtmosphere,
            body: this.body,
        }

        /* For other events, we need to see which happens first.
         * So calculate when they would happen and sort on time
         */
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

        const taCollide = this.orbit.taAtDistance(this.body.radius + (this.body.atmosphereHeight || 0));
        if(!isNaN(taCollide)) {
            let tCollide = this.orbit.tAtTa(taCollide);
            while(tCollide < t) tCollide += this.orbit.period || Infinity;
            events.push({
                t: tCollide,
                type: this.body.atmosphereHeight != null ? orbitEvent.enterAtmosphere : orbitEvent.collideSurface,
                body: this.body,
            })
        }

        function smartMin(a, b) {
            // Math.min(), but works with undefined, null, NaN
            return a < b ? a : b
        }

        for(let subBodyName of this.body.childrenNames) {
            const subBody = this.system.bodies[subBodyName]
            const subBodyOrbit = subBody.orbit
            events.sort((a, b) => a.t - b.t);  // in-place
            const nextIntercept = this.orbit.nextIntercept(
                subBodyOrbit,
                t,
                smartMin(events[0]?.t, tEnd),
            );
            if(nextIntercept != null) {
                if(nextIntercept.separation < subBody.soi) {
                    try {
                        const tsoi = findZeroBisect(
                            (t) => {
                                const r = this.orbit.positionAtT(t);
                                const rsb = subBodyOrbit.positionAtT(t);
                                const sep = r.sub(rsb).norm;
                                return sep - subBody.soi;
                            },
                            t, nextIntercept.t + 10,
                        );
                        events.push({
                            t: tsoi,
                            type: orbitEvent.enterSoI,
                            body: subBody,
                        });
                    } catch(e) {
                        console.log("Couldn't determine exact SoI change moment for orbit ", this.orbit,
                            " with body ", subBodyName, ". Should be between ", t, " and ", nextIntercept.t);
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
        if(this.body.parentName == null) throw "Can't exit SoI, no parent body";

        const taOld = this.orbit.taAtT(t);
        const rOld = this.orbit.positionAtTa(taOld);
        const vOld = this.orbit.velocityAtTa(taOld);

        if(rOld.norm < this.body.soi * 0.99 || rOld.norm > this.body.soi * 1.01) {
            throw "Not at SoI edge";
        }

        const bodyOrbit = this.body.orbit;
        const taBody = bodyOrbit.taAtT(t);
        const rBody = bodyOrbit.positionAtTa(taBody);
        const vBody = bodyOrbit.velocityAtTa(taBody);

        return new OrbitAround(
            this.system,
            this.body.parentName,
            Orbit.FromStateVector(
                this.system.bodies[this.body.parentName].gravity,
                rBody.add(rOld),
                vBody.add(vOld),
                t,
            )
        );
    }

    enterSoI(t: number, subBody: Body): OrbitAround {
        if(subBody.parentName !== this.body.name) throw `${subBody.name} is not a sub-body of ${this.body.name}`;

        const taOld = this.orbit.taAtT(t);
        const rOld = this.orbit.positionAtTa(taOld);
        const vOld = this.orbit.velocityAtTa(taOld);

        const bodyOrbit = subBody.orbit
        const taBody = bodyOrbit.taAtT(t);
        const rBody = bodyOrbit.positionAtTa(taBody);
        const vBody = bodyOrbit.velocityAtTa(taBody);

        const rNew = rOld.sub(rBody);
        const vNew = vOld.sub(vBody);

        if(rNew.norm < subBody.soi * 0.99 || rNew.norm > subBody.soi * 1.01) {
            throw "Not at SoI edge";
        }

        return new OrbitAround(
            this.system,
            subBody.name,
            Orbit.FromStateVector(
                subBody.gravity,
                rNew,
                vNew,
                t,
            )
        );

    }
}
