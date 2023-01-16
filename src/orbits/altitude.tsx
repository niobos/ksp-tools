import * as React from "react";  // JSX
import {SiInput} from "formattedInput";
import Body from "../utils/kspBody";

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
    const onFocus = props.onFocus !== undefined ? props.onFocus : () => null;
    const onBlur = props.onBlur !== undefined ? props.onBlur : () => null;
    const primaryBody = props.primaryBody !== undefined ? props.primaryBody : Body.create({});

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

        let highestObstacle;
        if(primaryBody.terrain === undefined) {
            highestObstacle = 'atmosphere';
        } else if(primaryBody.atmosphere === undefined) {
            highestObstacle = 'terrain';
        } else {  // both defined
            highestObstacle = primaryBody.atmosphere > primaryBody.terrain ?
                'atmosphere' : 'terrain';
        }
        if(primaryBody[highestObstacle] !== undefined) {
            maybeAa = <>
                {" = "}<SiInput
                    value={props.value - primaryBody.radius - primaryBody[highestObstacle]}
                    onChange={props.onChange != null ? v => props.onChange(v + primaryBody.radius + primaryBody[highestObstacle]) : null}
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