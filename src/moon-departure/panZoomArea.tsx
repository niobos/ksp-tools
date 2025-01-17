import * as React from 'react';
import {useRef, useState} from "react";
import useThrottled from "../utils/useThrottled";

type Xy = {
    x: number,
    y: number,
}

export interface PlotProps {
    onMove: (xRange: [number, number], yRange: [number, number]) => void
    xRange?: [number, number]  // horizontal range [left, right], defaults to [0, 1]
    yRange?: [number, number]  // vertical range [top, bottom], defaults to [0, 1]
    freezeX?: boolean
    freezeY?: boolean
    onClick?: (logicalCoords: Xy, ev: React.MouseEvent) => void
}

export default function PanZoomArea(
    {xRange, yRange, onMove, freezeX, freezeY, onClick, children}: React.PropsWithChildren<PlotProps>
) {
    if(xRange == null) xRange = [0, 1]
    if(yRange == null) yRange = [0, 1]

    const [dragging, setDragging] = useState<{start: Xy, cur: Xy} | null>(null)

    const elementRef = useRef<HTMLDivElement>(null);

    const divXyFromEvent = (e: MouseEvent | React.MouseEvent) => {
        const rect = elementRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        return {x, y}
    }
    const coordPhysToLogical = ({x, y}: Xy): Xy => {
        const width = elementRef.current.getBoundingClientRect().width
        const height = elementRef.current.getBoundingClientRect().height
        return {
            x: xRange[0] + x / width * (xRange[1] - xRange[0]),
            y: yRange[0] + (height-y) / height * (yRange[1] - yRange[0]),
        }
    }

    const onMouseDown = (e: React.MouseEvent) => {
        const xy = divXyFromEvent(e)
        setDragging({start: xy, cur: xy})
    }
    const onMouseMove = (e: MouseEvent) => {
        if(dragging == null) return
        const xy = divXyFromEvent(e)
        if(freezeX) xy.x = dragging.start.x
        if(freezeY) xy.y = dragging.start.y
        setDragging({start: dragging.start, cur: xy})
    }
    const onMouseUp = (e: MouseEvent) => {
        if(dragging == null) return
        const xy = divXyFromEvent(e)
        if(freezeX) xy.x = dragging.start.x
        if(freezeY) xy.y = dragging.start.y
        const dx = (xy.x - dragging.start.x) / elementRef.current.offsetWidth * (xRange[1] - xRange[0])
        const dy = (xy.y - dragging.start.y) / elementRef.current.offsetHeight * (yRange[1] - yRange[0])
        onMove([xRange[0] - dx, xRange[1] - dx],
            [yRange[0] - dy, yRange[1] - dy])
        setDragging(null)
    }
    React.useEffect(() => {
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [onMouseMove, onMouseUp])

    const onWheel = useThrottled(e => {
        if(onMove) {
            const canvasXy = divXyFromEvent(e)
            const logicalXy = coordPhysToLogical(canvasXy)
            const factor = e.deltaY > 0 ? /* in */ .7  : /* out */ 1./.7
            onMove(
                zoom([xRange[0], xRange[1]], logicalXy.x, factor),
                zoom([yRange[0], yRange[1]], logicalXy.y, factor),
            )
        }
    }, 500)

    const dx = dragging ? (dragging.cur.x - dragging.start.x) : 0
    const dy = dragging ? (dragging.cur.y - dragging.start.y) : 0

    return <div ref={elementRef}
                style={{overflow: 'hidden'}}
                onMouseDown={onMouseDown}
                onClick={e => {
                    if(onClick == null) return
                    const xy = divXyFromEvent(e)
                    const logicalXy = coordPhysToLogical(xy)
                    onClick(logicalXy, e)
                }}
                onWheel={onWheel}
    >
        <div style={{position: 'relative', left: `${dx}px`, top: `${dy}px`}}>
            {children}
        </div>
    </div>
}

function zoom(range: [number, number], value: number, factor: number): [number, number] {
    /* Zoom in/out a range [min, max] such that `value` remains at the same relative position in the new interval
     */
    const span = range[1] - range[0]
    const newRange = span * factor
    const xRel = (value - range[0]) / span
    const newXmin = value - xRel * newRange
    return [newXmin, newXmin + newRange]
}
