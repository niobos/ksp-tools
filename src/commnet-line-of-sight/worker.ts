import {exposeWorker} from "react-hooks-worker";
import {Location, sphericalGrid} from "../utils/location";
import {bodies as kspBodies} from "../utils/kspBody";

export type calcCoverageInput = {
    locations: Location[],
};
export type calcCoverageOutput = {
    altitudeCoveragePairs: {x: number, y: number}[],
};

function calcCoverage(input: calcCoverageInput): calcCoverageOutput {
    const {locations} = input;
    let altitudes = [];

    for(let loc of sphericalGrid(200)) {
        let distanceToClosestLocation = Infinity;
        for (let i = 0; i < locations.length; i++) {
            const dist = Location.greatCircleDistance(loc, locations[i]);
            if(dist < distanceToClosestLocation) {
                distanceToClosestLocation = dist;
            }
        }
        if(distanceToClosestLocation < Math.PI/2) {
            const alt = (1/Math.cos(distanceToClosestLocation) - 1) * kspBodies.Kerbin.radius;
            altitudes.push(alt);
        } else {
            altitudes.push(Infinity);
        }
    }

    altitudes = altitudes.sort((a, b) => a-b);
    altitudes = altitudes.filter(alt => 1e3 < alt && alt < 50e6)  // 1km until Minmus to keep te graph clear
        .map((alt, idx) => ({x: alt/1e3, y: idx/altitudes.length * 100}));  // convert to {x, y} in {km, %]
    return {altitudeCoveragePairs: altitudes};
    /* Note: Do NOT return an Array (or any Iterator),
     * this will cause every element to be returned individually by exposeWorker()
     */
}

exposeWorker(calcCoverage);
