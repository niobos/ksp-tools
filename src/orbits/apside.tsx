import React from "react";  // JSX
import {SiInput, FloatInput} from "../components/formatedInput";

import "./apside.css";
import Body from "../utils/kspBody";

interface ApsideProps {
    value: number
    onChange?: (value: number) => void
    onFocus?: () => void
    onBlur?: (finalValue: number) => void
    primaryBody?: Body
}

export default function Apside(props: ApsideProps) {
    const onChange = props.onChange !== undefined ? props.onChange : () => null;
    const onFocus = props.onFocus !== undefined ? props.onFocus : () => null;
    const onBlur = props.onBlur !== undefined ? props.onBlur : () => null;
    const primaryBody = props.primaryBody !== undefined ? props.primaryBody : Body.create({});

    let maybeAgl = "", maybeAa = "";
    if(primaryBody.radius !== undefined) {
        maybeAgl = <span>
            {" = "}<SiInput
                value={props.value - primaryBody.radius}
                onChange={v => onChange(v + primaryBody.radius)}
                onFocus={onFocus}
                onBlur={v => onBlur(v + primaryBody.radius)}
                classNameFunc={v => v <= 0 ? ['warning'] : []}
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
                    onChange={v => onChange(v + primaryBody.radius + primaryBody[highestObstacle])}
                    onFocus={onFocus}
                    onBlur={v => onBlur(v + primaryBody.radius + primaryBody[highestObstacle])}
                    classNameFunc={v => v <= 0 ? ['warning'] : []}
                />m above {highestObstacle}
            </span>;
        }
    }

    return <span>
        <SiInput value={props.value}
                 onChange={onChange}
                 onFocus={onFocus}
                 onBlur={onBlur}
                 classNameFunc={v => v >= primaryBody.soi ? ['warning'] : []}
        />m{maybeAgl}{maybeAa}
    </span>;
}