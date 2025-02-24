import * as React from 'react'
import PanZoomArea, {PanZoomAreaProps, Xy} from "./panZoomArea";
import {ReactNode, useRef, useState} from "react";

export interface PanZoomAreaAxesProps extends PanZoomAreaProps {
    xAxisPosition?: 'top' | 'bottom' | 'both' | 'none'
    yAxisPosition?: 'left' | 'right' | 'both' | 'none'
    formatXValue?: (v: number) => string
    formatX0?: (v: number) => string | ReactNode
    formatX1?: (v: number) => string | ReactNode
    formatYValue?: (v: number) => string
    formatY0?: (v: number) => string | ReactNode
    formatY1?: (v: number) => string | ReactNode
}

interface AxisProps {
    orientation: 'horizontal-bottom' | 'horizontal-top' | 'vertical-left' | 'vertical-right'
    size: number
    range: [number, number]
    cursor?: number | null
    format0?: (v: number) => string | ReactNode
    formatC?: (v: number) => string | ReactNode
    format1?: (v: number) => string | ReactNode
}

function Axis(
    {
        orientation, size, range,
        cursor = null,
        format0 = (v) => `${v}`,
        formatC = (v) => `${v}`,
        format1 = (v) => `${v}`,
    }: AxisProps,
) {
    if(size == null) size = 100
    const relCursor = (cursor - range[0]) / (range[1] - range[0])

    const styleParent = {}
    const styleChild = {}
    const styleCursor = {}
    if(orientation == 'horizontal-top') {
        styleParent['width'] = size - 2
        styleParent['flexDirection'] = 'row'
        styleCursor['left'] = `${relCursor*100-50}%`
    } else if(orientation == 'horizontal-bottom') {
        styleParent['width'] = size - 2
        styleParent['flexDirection'] = 'row'
        styleChild['marginTop'] = 'auto'
        styleChild['marginBottom'] = 0
        styleCursor['left'] = `${relCursor*100-50}%`
    } else if(orientation == 'vertical-left') {
        styleParent['height'] = size - 2
        styleParent['flexDirection'] = 'column'
        styleCursor['top'] = `${relCursor*100-50}%`
    } else if(orientation == 'vertical-right') {
        styleParent['height'] = size - 2
        styleParent['flexDirection'] = 'column'
        styleChild['marginLeft'] = 'auto'
        styleChild['marginRight'] = 0
        styleCursor['top'] = `${relCursor*100-50}%`
    } else {
        throw "Unreachable"
    }

    return <div style={{
        ...styleParent,
        display: 'flex', justifyContent: 'space-between', position: 'relative',
    }}>
        <div style={{...styleChild}}>
            {format0(range[0])}
        </div>
        {cursor == null ? "" : <div style={{...styleChild, ...styleCursor, position: 'relative', zIndex: -1}}>
            {formatC(cursor)}
        </div>}
        <div style={{...styleChild}}>
            {format1(range[1])}
        </div>
    </div>
}

export default function PanZoomAreaAxes(
    {
        xAxisPosition = 'top',
        yAxisPosition = 'left',
        formatXValue = (v) => `${v}`,
        formatX0 = formatXValue,
        formatX1 = formatXValue,
        formatYValue = (v) => `${v}`,
        formatY0 = formatYValue,
        formatY1 = formatYValue,
        xRange, yRange, onHover, onMoving,
        cursor = null,
        ...rest
    }: React.PropsWithChildren<PanZoomAreaAxesProps>
) {
    const [hover, setHover] = useState<Xy>(null)
    const [moving, setMoving] = useState<[[number, number] | null, [number, number] | null]>([null, null])
    const plotRef = useRef<HTMLTableCellElement>(null)

    const xRange_ = moving[0] != null ? moving[0] : xRange
    const yRange_ = moving[1] != null ? moving[1] : yRange

    return <table>
        <tbody>
        <tr>
            <td></td>
            <td>{(xAxisPosition == "top" || xAxisPosition == "both")
                ? <Axis range={xRange_} orientation='horizontal-bottom' size={plotRef.current?.offsetWidth}
                        format0={formatX0} formatC={formatXValue} format1={formatX1}
                        cursor={hover != null ? hover.x : cursor?.x}
                />
                : ""}</td>
            <td></td>
        </tr>
        <tr>
            <td>{(yAxisPosition == "left" || yAxisPosition == "both")
                ? <Axis range={yRange_} orientation='vertical-right' size={plotRef.current?.offsetHeight}
                        format0={formatY0} formatC={formatYValue} format1={formatY1}
                        cursor={hover != null ? hover.y : cursor?.y}
                />
                : ""}</td>
            <td ref={plotRef}>
                <PanZoomArea xRange={xRange} yRange={yRange}
                             onHover={xy => {
                                 setHover(xy)
                                 if(onHover) onHover(xy)
                             }}
                             onMoving={(xRange, yRange) => {
                                 setMoving([xRange, yRange])
                                 if(onMoving) onMoving(xRange, yRange)
                             }}
                             cursor={cursor}
                             {...rest}
                />
            </td>
            <td>{(yAxisPosition == "right" || yAxisPosition == "both")
                ? <Axis range={yRange_} orientation='vertical-left' size={plotRef.current?.offsetHeight}
                        format0={formatY0} formatC={formatYValue} format1={formatY1}
                        cursor={hover != null ? hover.y : cursor?.y}
                />
                : ""}</td>
        </tr>
        <tr>
            <td></td>
            <td>{(xAxisPosition == "bottom" || xAxisPosition == "both")
                ? <Axis range={xRange_} orientation='horizontal-top' size={plotRef.current?.offsetWidth}
                        format0={formatX0} formatC={formatXValue} format1={formatX1}
                        cursor={hover != null ? hover.x : cursor?.x}
                />
                : ""}</td>
            <td></td>
        </tr>
    </tbody></table>
}
