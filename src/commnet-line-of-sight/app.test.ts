import {Location} from "../utils/location";
import {findFurthestAwayLocation} from "./app";

describe('Great Circle navigation', () => {
    it('should calculate distance north/south', () => {
        const a = Location.create({
            latitude: 0,
            longitude: 0,
        });
        const b = Location.create({
            latitude: 2,
            longitude: 0,
        });
        const d1 = Location.greatCircleDistance(a, b);
        expect(d1).toBeCloseTo(2);
        const d2 = Location.greatCircleDistance(b, a);
        expect(d2).toBeCloseTo(2);
    });

    it('should calculate distance west/east', () => {
        const a = Location.create({
            latitude: 0,
            longitude: -1,
        });
        const b = Location.create({
            latitude: 0,
            longitude: -2,
        });
        const d1 = Location.greatCircleDistance(a, b);
        expect(d1).toBeCloseTo(1);
        const d2 = Location.greatCircleDistance(b, a);
        expect(d2).toBeCloseTo(1);
    });

    it('should calculate distance diagonally', () => {
        const a = Location.create({
            latitude: -1,
            longitude: -1,
        });
        const b = Location.create({
            latitude: 1,
            longitude: 1,
        });
        const d1 = Location.greatCircleDistance(a, b);
        expect(d1).toBeCloseTo(2.549112);
        const d2 = Location.greatCircleDistance(b, a);
        expect(d2).toBeCloseTo(2.549112);
    });

    it('should calculate big distances', () => {
        const a = Location.create({
            latitude: 0,
            longitude: -Math.PI/2,
        });
        const b = Location.create({
            latitude: 0,
            longitude: Math.PI/2,
        });
        const d1 = Location.greatCircleDistance(a, b);
        expect(d1).toBeCloseTo(Math.PI);
        const d2 = Location.greatCircleDistance(b, a);
        expect(d2).toBeCloseTo(Math.PI);
    });

    it('should calculate direction northward/south', () => {
        const a = Location.create({
            latitude: 0,
            longitude: 0,
        });
        const b = Location.create({
            latitude: 2,
            longitude: 0,
        });
        const d1 = Location.greatCircleDirection(a, b);
        expect(d1).toBeCloseTo(0);
        const d2 = Location.greatCircleDirection(b, a);
        expect(d2).toBeCloseTo(Math.PI);
    });

    it('should calculate direction west/east', () => {
        const a = Location.create({
            latitude: 0,
            longitude: -1,
        });
        const b = Location.create({
            latitude: 0,
            longitude: -2,
        });
        const d1 = Location.greatCircleDirection(a, b);
        expect(d1).toBeCloseTo(-Math.PI/2);
        const d2 = Location.greatCircleDirection(b, a);
        expect(d2).toBeCloseTo(Math.PI/2);
    });

    it('should calculate direction diagonally', () => {
        const a = Location.create({
            latitude: -1,
            longitude: -1,
        });
        const b = Location.create({
            latitude: 1,
            longitude: 1,
        });
        const d1 = Location.greatCircleDirection(a, b);
        expect(d1).toBeCloseTo(1.075);
        const d2 = Location.greatCircleDirection(b, a);
        expect(d2).toBeCloseTo(1.075-Math.PI);
    });

    it('should calculate waypoints', () => {
        const a = Location.create({
            latitude: -33/180*Math.PI,
            longitude: -71.6/180*Math.PI,
        });
        const b = Location.create({
            latitude: 31.4/180*Math.PI,
            longitude: 121.8/180*Math.PI,
        })
        const dist = Location.greatCircleDistance(a, b);
        expect(dist).toBeCloseTo(168.56/180*Math.PI);
        const dir = Location.greatCircleDirection(a, b);
        expect(dir).toBeCloseTo(-94.41/180*Math.PI);

        const midway = a.move(dir, dist/2);
        expect(midway.latitude).toBeCloseTo(-6.81/180*Math.PI);
        expect(midway.longitude).toBeCloseTo(-159.18/180*Math.PI);
    });
});

describe('Find furthest away location', () => {
    it('should work with 0 given locations', () => {
        const res = findFurthestAwayLocation([]);
    });

    it('should work with 1 given location', () => {
        const locations = [
            Location.create({latitude: 1, longitude: 2}),
        ];
        const res = findFurthestAwayLocation(locations);
        expect(res.location.latitude).toBeCloseTo(-1);
        expect(res.location.longitude).toBeCloseTo(2-Math.PI);
        expect(res.distanceToNearest).toBeCloseTo(Math.PI);
    });

    it('should work with 2 given location', () => {
        const locations = [
            Location.create({latitude: -1, longitude: 0}),
            Location.create({latitude: 1, longitude: 2}),
        ];
        const res = findFurthestAwayLocation(locations);
        expect(res.location.latitude).toBeCloseTo(0);
        expect(res.location.longitude).toBeCloseTo(-Math.PI+1);
    });

    it('should work with 3 locations', () => {
        const locations = [
            Location.create({latitude: 0.1, longitude: 0}),
            Location.create({latitude: 0.1, longitude: 2/3*Math.PI}),
            Location.create({latitude: 0.1, longitude: -2/3*Math.PI}),
        ];
        const res = findFurthestAwayLocation(locations);
        expect(res.location.latitude).toBeCloseTo(-Math.PI/2);
        // Any longitude (singularity)
        expect(res.distanceToNearest).toBeCloseTo(Math.PI/2+0.1);
    });

    it('should work with 4 locations', () => {
        const locations = [
            Location.create({latitude: 0.1, longitude: 0}),
            Location.create({latitude: 0.1, longitude: 2/3*Math.PI}),
            Location.create({latitude: 0.1, longitude: -2/3*Math.PI}),
            Location.create({latitude: -1, longitude: 0}),
        ];
        const res = findFurthestAwayLocation(locations);
        expect(res.location.latitude).toBeCloseTo(Math.PI/2);
        // Any longitude (singularity)
        expect(res.distanceToNearest).toBeCloseTo(Math.PI/2-0.1);
    });
});
