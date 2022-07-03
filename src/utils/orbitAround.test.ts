import Orbit from "./orbit";
import OrbitAround, {orbitEvent} from "./orbitAround";
import {bodies as kspBodies} from "./kspBody";
import {orbits as kspOrbits} from "./kspOrbit";
import Vector from "./vector";

describe('Event detection', () => {
    it('should detect inside body', () => {
        const o = new OrbitAround(
            kspBodies['Kerbin'],
            Orbit.FromOrbitalElements(
                kspBodies['Kerbin'].gravity,
                Orbit.smaEFromApsides(500e3, 1000e3),
                {ta: 0},
            )
        );
        const event = o.nextEvent(0);
        expect(event.type).toBe(orbitEvent.collideSurface);
        expect(event.t).toBe(0);
    });

    it('should detect atmospheric entry', () => {
        const o = new OrbitAround(
            kspBodies['Kerbin'],
            Orbit.FromOrbitalElements(
                kspBodies['Kerbin'].gravity,
                Orbit.smaEFromApsides(650e3, 1000e3),
                {ta: Math.PI},
            ),
        );
        const event = o.nextEvent(0);
        expect(event.t).toBeLessThan(o.orbit.period);
        expect(event.type).toBe(orbitEvent.enterAtmosphere);
        expect(event.body).toBe(kspBodies['Kerbin']);
        expect(o.orbit.positionAtT(event.t).norm)
            .toBeCloseTo(kspBodies['Kerbin'].radius + kspBodies['Kerbin'].atmosphere);
    });

    it('should detect SoI exit', () => {
        const o = new OrbitAround(
            kspBodies['Kerbin'],
            Orbit.FromStateVector(
                kspBodies['Kerbin'].gravity,
                new Vector(80e6,0, 0),
                new Vector(1000, 10, 0),
            ),
        );
        const event = o.nextEvent(0);
        expect(event.type).toBe(orbitEvent.exitSoI);
        expect(event.body).toBe(kspBodies['Kerbin']);
    });

    it('should detect SoI enter', () => {
        const o = new OrbitAround(
            kspBodies['Kerbin'],
            Orbit.FromStateVector(
                kspBodies['Kerbin'].gravity,
                new Vector(1000e3, 0, 0),
                new Vector(0, 3000, 0),
            ),
        );
        const event = o.nextEvent(0);
        expect(event.type).toBe(orbitEvent.enterSoI);
        expect(event.body).toBe(kspBodies['Mun']);
        const r = o.orbit.positionAtT(event.t);
        const rMun = kspOrbits['Mun'].positionAtT(event.t);
        const sep = r.sub(rMun).norm;
        expect(sep).toBeCloseTo(kspBodies['Mun'].soi);
    });
});
