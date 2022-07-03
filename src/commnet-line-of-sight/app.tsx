import * as React from "react";
import {useMemo} from "react";
import ReactDOM from "react-dom";
import useFragmentState from 'useFragmentState';
import {Location, sphericalGrid} from "../utils/location";
import {groundstations as kspGroundstations} from "../utils/kspLocations";
import {bodies as kspBodies} from "../utils/kspBody";
import {SiInput} from "../components/formatedInput";
import {useWorker} from "react-hooks-worker";
import {CartesianGrid, Label, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,} from 'recharts';
import {calcCoverageInput, calcCoverageOutput} from "./worker";

import './app.css';

function groundstationsFromString(s: string): Set<string> {
    try {
        const l = JSON.parse(s);
        return new Set(l);
    } catch {
        return new Set(['Kerbal Space Center']);
    }
}
function groundstationsToString(g: Set<string>): string {
    return JSON.stringify(Array.from(g));
}

const createWorker = () => new Worker(new URL('./worker', import.meta.url));

export default function App() {
    const [groundstations, setGroundstations] = useFragmentState('g', groundstationsFromString, groundstationsToString);

    const locations = useMemo(() => {
        const locations = [];
        for(let locationName in kspGroundstations) {
            if(groundstations.has(locationName)) {
                locations.push(kspGroundstations[locationName]);
            }
        }
        return locations;
    }, [groundstations]);

    const locationsJsx = [];
    for(let locationName in kspGroundstations) {
        const checked = groundstations.has(locationName);
        const newValue = new Set(groundstations);
        if(checked) {
            newValue.delete(locationName);
        } else {
            newValue.add(locationName);
        }
        locationsJsx.push(<li key={locationName}><label>
            <input type="checkbox"
                   checked={checked}
                   onChange={() => setGroundstations(newValue)}
            />{locationName} ({kspGroundstations[locationName].toStringDegrees()})</label>
        </li>);
    }

    const furthestAwayLocation = findFurthestAwayLocation(locations);

    const distancesJsx = [];
    groundstations.forEach(locationName => {
        const dist = Location.greatCircleDistance(furthestAwayLocation.location, kspGroundstations[locationName]);
        distancesJsx.push(<li key={locationName}>{(dist/Math.PI*180).toFixed(1)}º from {locationName}</li>);
    });

    let maybeAltitude = <p>Since this is more than 90º, there is no altitude where 100% coverage is guaranteed.</p>;
    if(furthestAwayLocation.distanceToNearest < Math.PI/2) {
        const alt = (1/Math.cos(furthestAwayLocation.distanceToNearest) - 1) * kspBodies['Kerbin'].radius;
        maybeAltitude = <p>Orbits with an altitude of at least {SiInput.format(alt)}mAGL
            will always have at least 1 ground station in line of sight.</p>;
    }

    const coverageInput = useMemo(() => ({locations}), [locations]);  // ensure it doesn't change to avoid re-render-loop
    let {result: coverage} = useWorker<calcCoverageInput, calcCoverageOutput>(createWorker, coverageInput);
    if(coverage === undefined) {
        coverage = {altitudeCoveragePairs: []};
    }

    return <div>
        <h1>CommNet line-of-sight calculator</h1>
        <h2>Available locations</h2>
        <ul id="locations">{locationsJsx}</ul>
        <h2>Worst location</h2>
        <p>Worst location is at {furthestAwayLocation.location.toStringDegrees()}{", "}
            which is {(furthestAwayLocation.distanceToNearest/Math.PI*180).toFixed(1)}º away from the nearest station:</p>
        <ul>{distancesJsx}</ul>
        {maybeAltitude}
        <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
                margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                }}
            >
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="Altitude" unit="kmAGL" scale="log"
                       domain={[1, 50e3]} ticks={[10, 100, 1e3, 1e4]}>
                    <Label value="Altitude" offset={0} position="insideBottom" />
                </XAxis>
                <YAxis type="number" dataKey="y" name="Coverage" unit="%" domain={[0, 100]}>
                    <Label value="Coverage" angle={-90} position="insideLeft" />
                </YAxis>
                <Tooltip />
                <Scatter data={coverage.altitudeCoveragePairs} line fill="#ff0000" />
            </ScatterChart>
        </ResponsiveContainer>
    </div>;
}

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
    for(let i=0; i<locations.length; i++) {
        for(let j=0; j<locations.length; j++) {
            if(i >= j) continue;  // skip self & repeated comparisons
            const dist = Location.greatCircleDistance(locations[i], locations[j]);
            if(dist < minimalDistance) {
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
    while(step > tolerance) {
        const around = [
            bestCandidate,
            bestCandidate.move(0, step),
            bestCandidate.move(Math.PI/2, step),
            bestCandidate.move(Math.PI, step),
            bestCandidate.move(3/2*Math.PI, step),
        ];
        const dist = around.map(loc => distanceToClosestLocation(loc));
        const bestIdx = argmin(dist);
        bestCandidate = around[bestIdx];
        bestCandidateClosestLocation = dist[bestIdx];
        if(bestIdx === 0) step = step / 2;
    }

    return {
        location: bestCandidate,
        distanceToNearest: bestCandidateClosestLocation,
    }
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
