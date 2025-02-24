import * as React from 'react';
import {useRef, useState} from 'react';
import useThrottled from "../utils/useThrottled";

export type Xy = {
    x: number,
    y: number,
}

export interface PanZoomAreaProps {
    onMoved: (xRange: [number, number], yRange: [number, number]) => void
    onMoving?: (xRange: [number, number] | null, yRange: [number, number] | null) => void
    xRange?: [number, number]  // horizontal range [left, right], defaults to [0, 1]
    yRange?: [number, number]  // vertical range [top, bottom], defaults to [0, 1]
    freezeX?: boolean
    freezeY?: boolean
    onClick?: (logicalCoords: Xy, ev: React.MouseEvent) => void
    onHover?: (logicalCoords: Xy | null) => void
    cursor?: Xy | null
}

export default function PanZoomArea(
    {
        xRange = [0, 1],
        yRange = [0, 1],
        onMoved,
        onMoving,
        freezeX,
        freezeY,
        onClick,
        onHover,
        cursor = null,
        children,
    }: React.PropsWithChildren<PanZoomAreaProps>
) {
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
            y: yRange[0] + y / height * (yRange[1] - yRange[0]),
        }
    }
    const rangeFromPan = (xy: Xy): {xRange: [number, number], yRange: [number, number]} => {
        if(freezeX) xy.x = dragging.start.x
        if(freezeY) xy.y = dragging.start.y
        const dx = (xy.x - dragging.start.x) / elementRef.current.offsetWidth * (xRange[1] - xRange[0])
        const dy = (xy.y - dragging.start.y) / elementRef.current.offsetHeight * (yRange[1] - yRange[0])
        return {
            xRange: [xRange[0] - dx, xRange[1] - dx],
            yRange: [yRange[0] - dy, yRange[1] - dy]
        }
    }

    const windowOnMouseMove = (e: MouseEvent) => {
        if(dragging == null) return
        const xy = divXyFromEvent(e)
        setDragging({start: dragging.start, cur: xy})
        if(onMoving) {
            const {xRange, yRange} = rangeFromPan(xy)
            onMoving(xRange, yRange)
        }
    }
    const windowOnMouseUp = (e: MouseEvent) => {
        if(dragging == null) return
        const xy = divXyFromEvent(e)
        const {xRange, yRange} = rangeFromPan(xy)
        onMoved(xRange, yRange)
        onMoving(null, null)
        setDragging(null)
    }
    React.useEffect(() => {
        window.addEventListener('mousemove', windowOnMouseMove)
        window.addEventListener('mouseup', windowOnMouseUp)
        return () => {
            window.removeEventListener('mousemove', windowOnMouseMove)
            window.removeEventListener('mouseup', windowOnMouseUp)
        }
    }, [windowOnMouseMove, windowOnMouseUp])

    const onWheel = useThrottled(e => {
        if(onMoved) {
            const canvasXy = divXyFromEvent(e)
            const logicalXy = coordPhysToLogical(canvasXy)
            const factor = e.deltaY > 0 ? /* in */ .7  : /* out */ 1./.7
            onMoved(
                zoom([xRange[0], xRange[1]], logicalXy.x, factor),
                zoom([yRange[0], yRange[1]], logicalXy.y, factor),
            )
        }
    }, 500)

    const dx = dragging ? (dragging.cur.x - dragging.start.x) : 0
    const dy = dragging ? (dragging.cur.y - dragging.start.y) : 0

    let maybeCursor = <></>
    if(cursor) {
        const relCursor = {
            x: (cursor.x - xRange[0]) / (xRange[1] - xRange[0]),
            y: (cursor.y - yRange[0]) / (yRange[1] - yRange[0]),
        }
        maybeCursor = <div style={{
            position: 'absolute',
            left: `${relCursor.x*100}%`,
            top: `${relCursor.y*100}%`,
            transform: 'translate(-50%, -50%)',  // position the center instead of the top-left corner
            zIndex: 1,  // above children
            filter: 'invert(1)', mixBlendMode: 'difference',  // Invert background color, so always visible
            fontSize: '200%',
        }}>+</div>
    }

    return <div ref={elementRef}
                style={{overflow: 'hidden', position: 'relative'}}
                onMouseDown={(e: React.MouseEvent) => {
                    const xy = divXyFromEvent(e)
                    setDragging({start: xy, cur: xy})
                }}
                onClick={e => {
                    if(onClick) {
                        const xy = divXyFromEvent(e)
                        const logicalXy = coordPhysToLogical(xy)
                        onClick(logicalXy, e)
                    }
                }}
                onMouseMove={e => {
                    if(onHover) {
                        const xy = divXyFromEvent(e)
                        const logicalXy = coordPhysToLogical(xy)
                        onHover(logicalXy)
                    }
                }}
                onMouseLeave={e => {
                    if(onHover) onHover(null)
                }}
                onWheel={onWheel}
    >
        {maybeCursor}
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
