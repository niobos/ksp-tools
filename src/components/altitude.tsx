import * as React from "react";  // JSX
import {SiInput} from "formattedInput";
import {Body} from "../utils/kspSystems";

import "./apside.css";

interface AltitudeProps {
    value: number
    onChange?: (value: number) => void
    readOnly?: boolean
    onFocus?: () => void
    onBlur?: () => void
    primaryBody?: Body
}

export default function Altitude(props: AltitudeProps) {
    const onFocus = props.onFocus !== undefined ? props.onFocus : () => null
    const onBlur = props.onBlur !== undefined ? props.onBlur : () => null
    const primaryBody = props.primaryBody !== undefined ? props.primaryBody : new Body(null, 0, 0, null)

    let maybeAgl: any = "", maybeAa: any = "";
    if(primaryBody.radius !== undefined && props.value >= 0) {
        maybeAgl = <>
            {" = "}<SiInput
                value={props.value - primaryBody.radius}
                onChange={props.onChange != null ? v => props.onChange(v + primaryBody.radius) : null}
                onFocus={onFocus}
                onBlur={onBlur}
                readOnly={props.readOnly}
                classNameFunc={v => v <= 0 ? 'warning' : ''}
            />mAGL
        </>;

        const obstacles = []
        if(primaryBody.atmosphereHeight != null) obstacles.push({name: 'atmosphere', height: primaryBody.atmosphereHeight || 0})
        if(primaryBody.terrainMaxHeight != null) obstacles.push({name: 'terrain', height: primaryBody.terrainMaxHeight || 0})
        obstacles.sort((a, b) => b.height - a.height)  // reverse sort in-place by height
        if(obstacles.length > 0) {
            const {name: highestObstacle, height: obstacleHeight} = obstacles[0]
            maybeAa = <>
                {" = "}<SiInput
                    value={props.value - primaryBody.radius - obstacleHeight}
                    onChange={props.onChange != null ? v => props.onChange(v + primaryBody.radius + obstacleHeight) : null}
                    readOnly={props.readOnly}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    classNameFunc={v => v <= 0 ? 'warning' : ''}
                />m above {highestObstacle}
            </>;
        }
    }

    return <>
        <SiInput value={props.value}
                 onChange={props.onChange}
                 readOnly={props.readOnly}
                 onFocus={onFocus}
                 onBlur={onBlur}
                 classNameFunc={v => (v >= primaryBody.soi || v < 0) ? 'warning' : ''}
        />m{maybeAgl}{maybeAa}
    </>;
}