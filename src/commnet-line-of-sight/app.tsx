import * as React from "react"
import {useMemo} from "react"
import ReactDOM from "react-dom"
import useFragmentState from 'useFragmentState'
import {Location} from "../utils/location"
import {groundstations as kspGroundstations} from "../utils/kspLocations"
import kspSystems from "../utils/kspSystems"
import {formatValueSi} from "formattedInput"
import {useWorker} from "react-hooks-worker"
import {CartesianGrid, Label, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,} from 'recharts'
import {calcCoverageInput, calcCoverageOutput} from "./worker"

import './app.css';
import {findFurthestAwayLocation} from "./findFurthestAwayLocation";

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
        const alt = (1/Math.cos(furthestAwayLocation.distanceToNearest) - 1) * kspSystems["Stock"].bodies['Kerbin'].radius;
        maybeAltitude = <p>Orbits with an altitude of at least {formatValueSi(alt)}mAGL
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

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}
