import * as React from "react";  // JSX
import {SiInput} from "formattedInput";
import Body from "../utils/kspBody";

import "./apside.css";

interface ApsideProps {
    value: number
    onChange?: (value: number) => void
    onFocus?: () => void
    onBlur?: () => void
    primaryBody?: Body
}

export default function Apside(props: ApsideProps) {
    const onFocus = props.onFocus !== undefined ? props.onFocus : () => null;
    const onBlur = props.onBlur !== undefined ? props.onBlur : () => null;
    const primaryBody = props.primaryBody !== undefined ? props.primaryBody : Body.create({});

    let maybeAgl: any = "", maybeAa: any = "";
    if(primaryBody.radius !== undefined) {
        maybeAgl = <span>
            {" = "}<SiInput
                value={props.value - primaryBody.radius}
                onChange={props.onChange != null ? v => props.onChange(v + primaryBody.radius) : null}
                onFocus={onFocus}
                onBlur={onBlur}
                classNameFunc={v => v <= 0 ? 'warning' : ''}
            />mAGL
        </span>;

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
            maybeAa = <span>
                {" = "}<SiInput
                    value={props.value - primaryBody.radius - primaryBody[highestObstacle]}
                    onChange={props.onChange != null ? v => props.onChange(v + primaryBody.radius + primaryBody[highestObstacle]) : null}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    classNameFunc={v => v <= 0 ? 'warning' : ''}
                />m above {highestObstacle}
            </span>;
        }
    }

    return <span>
        <SiInput value={props.value}
                 onChange={props.onChange}
                 onFocus={onFocus}
                 onBlur={onBlur}
                 classNameFunc={v => v >= primaryBody.soi ? 'warning' : ''}
        />m{maybeAgl}{maybeAa}
    </span>;
}