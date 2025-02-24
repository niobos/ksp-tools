import {Location, sphericalGrid} from "../utils/location";

function argmin(a: number[]): number {
    return a.map((el, idx) => [el, idx])
        .reduce((min, el) => (el[0] > min[0] ? el : min))[1];
}

export function findFurthestAwayLocation(locations: Location[], tolerance: number = 1e-8): {
    location: Location,
    distanceToNearest: number,
} {
    if (locations.length === 0) {
        // Any arbitrary point is the furthest away
        return {
            location: Location.create({longitude: 0, latitude: 0}),
            distanceToNearest: 2 * Math.PI,
        }
    }
    if (locations.length === 1) {
        // opposite side
        const lon = locations[0].longitude + Math.PI;
        return {
            location: Location.create({
                longitude: lon > Math.PI ? lon - 2 * Math.PI : lon,
                latitude: -locations[0].latitude,
            }),
            distanceToNearest: Math.PI,
        }
    }
    if (locations.length === 2) {
        // opposite side of half-way point
        const midpoint = locations[0].move(
            Location.greatCircleDirection(locations[0], locations[1]),
            0.5 * Location.greatCircleDistance(locations[0], locations[1]),
        );
        const location = Location.create({
            latitude: -midpoint.latitude,
            longitude: midpoint.longitude > 0 ? midpoint.longitude - Math.PI : midpoint.longitude + Math.PI,
        });
        return {
            location,
            distanceToNearest: Location.greatCircleDistance(location, locations[1]),
        };
    }

    // TODO: is there a better algorithm than brute forcing?
    // https://gis.stackexchange.com/questions/17358/how-can-i-find-the-farthest-point-from-a-set-of-existing-points

    /* Figure out what the minimum distance between locations is.
     * We'll use this to determine the size of our grid.
     */
    let minimalDistance = Infinity;
    //let minimalDistanceLocationPair: [number, number] = null;
    for (let i = 0; i < locations.length; i++) {
        for (let j = 0; j < locations.length; j++) {
            if (i >= j) continue;  // skip self & repeated comparisons
            const dist = Location.greatCircleDistance(locations[i], locations[j]);
            if (dist < minimalDistance) {
                minimalDistance = dist;
                //minimalDistanceLocationPair = [i, j];
            }
        }
    }

    function distanceToClosestLocation(loc: Location) {
        let closestLocationDistance = Infinity;
        for (let i = 0; i < locations.length; i++) {
            const dist = Location.greatCircleDistance(loc, locations[i]);
            if (dist < closestLocationDistance) {
                closestLocationDistance = dist;
            }
        }
        return closestLocationDistance;
    }

    let step;
    let bestCandidate: Location = null;
    let bestCandidateClosestLocation = 0;
    {  // Limit scope of grid
        const grid = sphericalGrid(1000);
        step = Location.greatCircleDistance(grid[0], grid[1]);
        for (let loc of grid) {
            let closestLocationDistance = distanceToClosestLocation(loc);
            if (closestLocationDistance > bestCandidateClosestLocation) {
                bestCandidateClosestLocation = closestLocationDistance;
                bestCandidate = loc;
            }
        }
    }

    // Now do a gradient descend to narrow it down.
    while (step > tolerance) {
        const around = [
            bestCandidate,
            bestCandidate.move(0, step),
            bestCandidate.move(Math.PI / 2, step),
            bestCandidate.move(Math.PI, step),
            bestCandidate.move(3 / 2 * Math.PI, step),
        ];
        const dist = around.map(loc => distanceToClosestLocation(loc));
        const bestIdx = argmin(dist);
        bestCandidate = around[bestIdx];
        bestCandidateClosestLocation = dist[bestIdx];
        if (bestIdx === 0) step = step / 2;
    }

    return {
        location: bestCandidate,
        distanceToNearest: bestCandidateClosestLocation,
    }
}