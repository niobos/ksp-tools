import {useEffect, useRef, useState} from "react";
import * as React from "react";

export type PlotFuncType<Type> = (value: Type, state: any) => {color: [number, number, number], state?: any, redraw?: boolean}
/* Determine the color of a result.
 * To support automatic scaling of the color-scale, a `state` object is carried over to subsequent calls.
 * If the `redraw` property is true, all pixels values will be re-evaluated to change the color scale.
 * Take care to avoid a redraw-loop!
 */

export interface ColorMapPlotProps<Type> {
    width: number
    height: number
    asyncCalcFunc: (xys: Array<[number, number]>) => Promise<Array<Type>>
    /* Calculate a batch of "slow" calculations (possibly in a WebWorker)
     */
    colorMapFunc: PlotFuncType<Type>
    xRange: [number, number]
    yRange: [number, number]
    onClick?: (x: number, y: number) => void
    onZoom?: (centerX: number, centerY: number, zoom: "in" | "out") => void
    onPan?: (deltaX: number, deltaY: number) => void
}

type Result = {
    x: number, xWidth: number,
    y: number, yHeight: number,
    result: any
}

let calcVersion = 0
export default function ColorMapPlot<Type>(props: ColorMapPlotProps<Type>) {
    const [autoUpdate, setAutoUpdate] = useState(true)
    const [results, setResults] = useState<Array<Result>>([])
    const [lastPaintedResult, setLastPaintedResult] = useState(-1)
    const [paintState, setPaintState] = useState(null)
    const [dragging, setDragging] = useState<{x: number, y: number}>(null)

    const [version, setVersion] = useState(0)
    const versionRef = useRef<number>()
    versionRef.current = version
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const coordCanvasToLogical = ({x, y}) => {
        const width = canvasRef.current.width
        const height = canvasRef.current.height
        return {
            x: props.xRange[0] + x / width * (props.xRange[1] - props.xRange[0]),
            y: props.yRange[0] + (height-y) / height * (props.yRange[1] - props.yRange[0]),
        }
    }
    const canvasXyFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        return {x, y}
    }

    const doCalc = async (version) => {
        //console.log(`Starting draw ${version}`)

        const canvas = canvasRef.current
        const width = canvas.width
        const height = canvas.height

        const xyIter = refiningGrid(0, width, 0, height)
        let batchSize = 1
        const allStart = +(new Date())
        setResults([])
        setLastPaintedResult(-1)
        setPaintState(null)
        while(true) {
            const batchStart = +(new Date())
            const {value: xys} = iterNextBatch(xyIter, batchSize)
            if(xys.length == 0) break

            const logicalXys = xys.map((xy): [number, number] => {
                const logicalXy = coordCanvasToLogical(xy)
                return [logicalXy.x, logicalXy.y]
            })

            let batchResults = await props.asyncCalcFunc(logicalXys)
            if(versionRef.current > version) {
                //console.log(`Abandoning draw ${version}`)
                return
            }

            const newResults = []
            for(let index in batchResults) {
                const result = batchResults[index]
                newResults.push({...xys[index], result})
            }
            setResults(results => [...results, ...newResults])

            const batchDuration = +(new Date()) - batchStart
            if(batchDuration < 200) {
                batchSize = batchSize * 2
            } else if(batchDuration > 500) {
                batchSize = batchSize / 2
            } else {
                //console.log(`Batch size of ${batchSize} took ${batchDuration}ms => ${batchDuration / batchSize} per request`)
            }
        }
        const allDuration = +(new Date()) - allStart
        console.log(`Done calculating ${canvas.width * canvas.height} ` +
            `in ${allDuration}ms ` +
            `=> ${allDuration / (canvas.width * canvas.height)} per request `)
    }

    useEffect(() => {
        if(autoUpdate) {
            const newVersion = version + 1
            setVersion(newVersion)
            doCalc(newVersion).then(() => {})
        }
    }, [
        props.width, props.height,
        props.xRange, props.yRange,
        props.asyncCalcFunc,
        canvasRef,
    ])

    useEffect(() => {
            setLastPaintedResult(-1)
            setPaintState(null)
            setResults([...results])  // to trigger re-render
        },
        [
            props.colorMapFunc,
            canvasRef,
        ]
    )
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d", {alpha: false})

        // TODO: optimize re-render. Full re-render takes ~2 seconds. Maybe with getImageData()/putImageData()?
        //console.log(`Paint start from ${lastPaintedResult}`)
        //const paintStart = +(new Date())
        let state = paintState
        for(let index = lastPaintedResult+1; index < results.length; index++) {
            let color, redraw
            ({color, state, redraw} = props.colorMapFunc(results[index].result, state))
            if(redraw) {
                index = -1  // Will do index++ after continue to make index=0
                continue
            }
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
            ctx.fillRect(results[index].x, results[index].y, results[index].xWidth, results[index].yHeight)
        }
        setLastPaintedResult(results.length-1)
        setPaintState(state)
        //console.log("paint done after ", +(new Date()) - paintStart)
    }, [
        results,
    ])

    let progress = 0
    if(canvasRef.current) {
        progress = results.length / (canvasRef.current.width * canvasRef.current.height)
    }

    return <>
        <label><input type="checkbox"
                      onChange={e => setAutoUpdate(e.target.checked)}
                      checked={autoUpdate}
        />Automatically update</label>
        <div>Calculating... {(progress*100).toFixed(1)}%</div>
        <canvas
            ref={canvasRef} width={props.width} height={props.height}
            onClick={e => {
                if(props.onClick == null) return
                const canvasXy = canvasXyFromEvent(e)
                const logicalXy = coordCanvasToLogical(canvasXy)
                props.onClick(logicalXy.x, logicalXy.y)
            }}
            onMouseDown={e => setDragging(canvasXyFromEvent(e))}
            onMouseUp={e => {
                if(dragging == null) return
                const endCanvasXy = canvasXyFromEvent(e)
                if((endCanvasXy.x != dragging.x || endCanvasXy.y != dragging.y) && props.onPan) {
                    const startXy = coordCanvasToLogical(dragging)
                    const endXy = coordCanvasToLogical(endCanvasXy)
                    props.onPan(endXy.x-startXy.x, endXy.y-startXy.y)
                }
                setDragging(null)
            }}
            onWheel={e => {
                if(props.onZoom) {
                    const canvasXy = canvasXyFromEvent(e)
                    const logicalXy = coordCanvasToLogical(canvasXy)
                    props.onZoom(logicalXy.x, logicalXy.y, e.deltaY > 0 ? "in" : "out")
                }
            }}
        >Color map plot</canvas>
    </>
}

function iterNextBatch<Type>(it: Iterator<Type>, size: number): {value: Array<Type>, done: boolean} {
    const value = []
    let done = false
    while(value.length < size) {
        const {value: v, done} = it.next()
        if(done) break
        value.push(v)
    }
    return {value, done}
}

function* refiningGrid(
    xStart: number, xEnd: number, yStart: number, yEnd: number, skipFirst: boolean = false
): Generator<{x: number, y: number, xWidth: number, yHeight: number}> {
    /* iterate over the interval [xStart;xEnd) × [yStart;yEnd)
     * The order of iterations is such that the entire grid is refined in better and better resolution.
     * The yielded objects contain a coordinate (x, y) and a size (xWidth, yHeight):
     * if you draw rectangles with these specifications, the result will be a fully defined grid,
     * with later rectangles overwriting previous rectangles:
     * refiningGrid(2, 2) yields
     *  - {x: 0, y: 0, xWidth: 2, yWidth: 2}
     *  - {x: 1, y: 1, xWidth: 1, yWidth: 1}
     *  - {x: 0, y: 1, xWidth: 1, yWidth: 1}
     *  - {x: 1, y: 0, xWidth: 1, yWidth: 1}
     */
    if(xStart == xEnd || yStart == yEnd) return

    const xRange = xEnd-xStart;
    const yRange = yEnd-yStart;
    if(!skipFirst) yield {x: xStart, y: yStart, xWidth: xRange, yHeight: yRange}

    if(xRange == 1 && yRange == 1) return

    let lowerHalf, upperHalf
    if(xRange >= yRange) {  // split x
        const middle = xStart + Math.ceil(xRange / 2)
        lowerHalf = refiningGrid(xStart, middle, yStart, yEnd, true)
        upperHalf = refiningGrid(middle, xEnd, yStart, yEnd)
    } else {  // split y
        const middle = yStart + Math.ceil(yRange / 2)
        lowerHalf = refiningGrid(xStart, xEnd, yStart, middle, true)
        upperHalf = refiningGrid(xStart, xEnd, middle, yEnd)
    }

    while(true) {
        const {value: valueU, done: doneU} = upperHalf.next()
        if(!doneU) yield valueU
        const {value: valueL, done: doneL} = lowerHalf.next()
        if(!doneL) yield valueL
        if(doneL && doneU) break
    }
}
