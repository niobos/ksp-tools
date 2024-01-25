import * as React from "react"
import "./solution.css"
import {CalculatedTrajectory} from "./solver";
import {formatValueYdhms} from "../components/formattedInput";
import {formatValueSi} from "formattedInput";

export interface SolutionProps {
    trajectory: CalculatedTrajectory
}

export default function Solution(props: SolutionProps) {
    const legs = props.trajectory.legs

    return <>
        <div className="name">{props.trajectory.name}</div>
        <div className="total_dv">{props.trajectory.dv.toFixed(1)} m/s</div>
        <ol className="burns">{legs.map((leg, i) => [
            <li key={i + "b"} className="burn">
                t={formatValueYdhms(leg.burn.t)}{", "}
                ta={(leg.burn.ta / Math.PI * 180).toFixed(1)}º<br/>
                ∆v={leg.burn.dvPrn.norm.toFixed(1)}m/s (
                {leg.burn.dvPrn.x.toFixed(1)}{", "}
                {leg.burn.dvPrn.y.toFixed(1)}{", "}
                {leg.burn.dvPrn.z.toFixed(1)})</li>,

            <li key={i + "o"} className="orbit">
                SMA={formatValueSi(leg.nextOrbit.semiMajorAxis)}m{", "}
                e={leg.nextOrbit.eccentricity.toFixed(3)}<br/>
                (pe={formatValueSi(leg.nextOrbit.distanceAtPeriapsis)}m{", "}
                ap={formatValueSi(leg.nextOrbit.distanceAtApoapsis)}m)<br/>
                argp={(leg.nextOrbit.argumentOfPeriapsis / Math.PI * 180).toFixed(1)}º{", "}
                inc={(leg.nextOrbit.inclination / Math.PI * 180).toFixed(1)}º,<br/>
                lan={(leg.nextOrbit.longitudeAscendingNode / Math.PI * 180).toFixed(1)}º
                {/*{", "}ma0={(leg.nextOrbit.meanAnomalyAtEpoch / Math.PI * 180).toFixed(1)}º*/}
            </li>
        ]).flat()}</ol>
    </>
}
