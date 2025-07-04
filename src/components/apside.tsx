import * as React from "react"  // JSX
import Altitude from "./altitude"
import {FloatInput} from "formattedInput"
import {Body} from "../utils/kspSystems"

interface ApsideProps {
    altitude: number
    speed: number
    primaryBody?: Body
    onAltitudeChange?: (altitude: number) => void
    onSpeedChange?: (speed: number) => void
    onFocus?: () => void
    onBlur?: () => void
    readOnly?: boolean
}
export default function Apside(props: ApsideProps) {
    const onFocus = props.onFocus !== undefined ? props.onFocus : () => null;
    const onBlur = props.onBlur !== undefined ? props.onBlur : () => null;

    if(props.altitude === Infinity) {  // parabolic
        return <>Parabolic</>

    } else if(props.altitude > 0) {  // elliptical
        let speedStyle: object = {visibility: 'hidden'};
        if(props.primaryBody != null && props.primaryBody.gravity != null) {
            speedStyle = {};
        }

        return <>
            <Altitude
                value={props.altitude}
                onFocus={onFocus}
                onChange={r => props.onAltitudeChange != null ? props.onAltitudeChange(r) : null}
                onBlur={onBlur}
                readOnly={props.readOnly}
                primaryBody={props.primaryBody}
            /><span style={speedStyle}>, speed <FloatInput
                decimals={1}
                value={props.speed}
                onFocus={onFocus}
                onChange={v => props.onSpeedChange != null ? props.onSpeedChange(v) : null}
                onBlur={onBlur}
                readOnly={props.readOnly}
            />m/s</span>
        </>

    } else { // hyperbolic
        let speedStyle: object = {visibility: 'hidden'};
        if(props.primaryBody != null && props.primaryBody.gravity != null) {
            speedStyle = {};
        }

        return <>
            Hyperbolic<span style={speedStyle}>, hyperbolic excess velocity <FloatInput
                decimals={1}
                value={props.speed}
                onFocus={onFocus}
                onChange={v => props.onSpeedChange != null ? props.onSpeedChange(v) : null}
                onBlur={onBlur}
                readOnly={props.readOnly}
            />m/s</span>
        </>
    }
}