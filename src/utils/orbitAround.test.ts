import Orbit from "./orbit"
import OrbitAround, {orbitEvent} from "./orbitAround"
import kspSystems from "./kspSystems"
import Vector from "./vector"

const system = kspSystems["Stock"]
const kerbin = kspSystems["Stock"].bodies["Kerbin"]

describe('Event detection', () => {
    it('should detect inside body', () => {
        const o = new OrbitAround(
            system, "Kerbin",
            Orbit.FromOrbitalElements(
                kerbin.gravity,
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
            system, "Kerbin",
            Orbit.FromOrbitalElements(
                kerbin.gravity,
                Orbit.smaEFromApsides(650e3, 1000e3),
                {ta: Math.PI},
            ),
        );
        const event = o.nextEvent(0);
        expect(event.t).toBeLessThan(o.orbit.period);
        expect(event.type).toBe(orbitEvent.enterAtmosphere);
        expect(event.body).toBe(kerbin);
        expect(o.orbit.positionAtT(event.t).norm)
            .toBeCloseTo(kerbin.radius + kerbin.atmosphereHeight);
    });

    it('should detect SoI exit', () => {
        const o = new OrbitAround(
            system, "Kerbin",
            Orbit.FromStateVector(
                kerbin.gravity,
                new Vector(80e6,0, 0),
                new Vector(1000, 10, 0),
            ),
        );
        const event = o.nextEvent(0);
        expect(event.type).toBe(orbitEvent.exitSoI);
        expect(event.body).toBe(kerbin);
    });

    it('should detect SoI enter', () => {
        const o = new OrbitAround(
            system, "Kerbin",
            Orbit.FromStateVector(
                kerbin.gravity,
                new Vector(1000e3, 0, 0),
                new Vector(0, 3000, 0),
            ),
        );
        const event = o.nextEvent(0);
        expect(event.type).toBe(orbitEvent.enterSoI);
        expect(event.body).toBe(system.bodies['Mun']);
        const r = o.orbit.positionAtT(event.t);
        const rMun = system.bodies['Mun'].orbit.positionAtT(event.t);
        const sep = r.sub(rMun).norm;
        expect(sep).toBeCloseTo(system.bodies['Mun'].soi);
    });
});
