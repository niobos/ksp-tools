import * as React from "react"
import "./solution.css"
import {formatValueYdhms} from "../components/formattedInput";
import {Leg} from "./solver";
import {formatValueSi} from "formattedInput";

export interface SolutionProps {
    name: string
    legs: Leg[]
}

export default function Solution(props: SolutionProps) {
    const totalDv = 0
    const totalTime = 0
    const burns = <></>

    return <>
        <div className="name">{props.name}</div>
        <div className="total_dv">{totalDv.toFixed(1)} m/s,{" "}
            {formatValueYdhms(totalTime)}</div>
        <ol className="burns">{props.legs.map((leg, i) => [
            <li key={i + "b"} className="burn">
                t={formatValueYdhms(leg.burn.t)}{", "}
                ta={(leg.ta / Math.PI * 180).toFixed(1)}º<br/>
                ∆v={leg.burn.prnDv.norm.toFixed(1)}m/s (
                {leg.burn.prnDv.x.toFixed(1)}{", "}
                {leg.burn.prnDv.y.toFixed(1)}{", "}
                {leg.burn.prnDv.z.toFixed(1)})</li>,

            <li key={i + "o"} className="orbit">
                SMA={formatValueSi(leg.nextOrbit.semiMajorAxis)}m{", "}
                e={leg.nextOrbit.eccentricity.toFixed(3)}<br/>
                (pe={formatValueSi(leg.nextOrbit.distanceAtPeriapsis)}m{", "}
                ap={formatValueSi(leg.nextOrbit.distanceAtApoapsis)}m)<br/>
                argp={(leg.nextOrbit.argumentOfPeriapsis / Math.PI * 180).toFixed(1)}º{", "}
                inc={(leg.nextOrbit.inclination / Math.PI * 180).toFixed(1)}º,<br/>
                lan={(leg.nextOrbit.longitudeAscendingNode / Math.PI * 180).toFixed(1)}º{", "}
                ma0={(leg.nextOrbit.meanAnomalyAtEpoch / Math.PI * 180).toFixed(1)}º
            </li>
        ]).flat()}</ol>
    </>
}
