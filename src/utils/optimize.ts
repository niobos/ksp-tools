// noinspection JSUnusedGlobalSymbols

/* Algorithms are written as a Generator function, so they can be exposed in a
 * sync and async variant
 */

// https://stackoverflow.com/a/52490977
export type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

export function expandAbsolute<ND extends number>(
    x0: Tuple<number, ND>,
    d: number | Tuple<number, ND>
): Tuple<Tuple<number, ND>, ND> {
    /* Returns a number of points around the given point `x0`
     * by taking steps of size `d` for every dimension
     */
    const N = x0.length
    if(!Array.isArray(d)) {
        d = new Array(N).fill(d) as Tuple<number, ND>
    }

    const out: Array<Tuple<number, ND>> = []
    for(let dimension = 0; dimension < N; dimension++) {
        const point = x0.slice() as Tuple<number, ND>
        point[dimension] += d[dimension]
        out.push(point)
    }
    return out as Tuple<Tuple<number, ND>, ND>
}

export function expandRelative<ND extends number>(
    x0: Tuple<number, ND>,
    f: number | Tuple<number, ND>,
    zeroAbs: number | Tuple<number, ND> = 0.001,
): Tuple<Tuple<number, ND>, ND> {
    /* Returns a number of points around the given point `x0`
     * by scaling every dimension by `f`.
     * if the given dimension has coordinate 0, `zeroAbs` is added instead
     */
    const N = x0.length
    if(!Array.isArray(f)) {
        f = new Array(N).fill(f) as Tuple<number, ND>
    }
    if(!Array.isArray(zeroAbs)) {
        zeroAbs = new Array(N).fill(zeroAbs) as Tuple<number, ND>
    }

    const out: Array<Tuple<number, ND>> = []
    for(let dimension = 0; dimension < N; dimension++) {
        const point = x0.slice() as Tuple<number, ND>
        if(point[dimension] != 0) point[dimension] *= f[dimension]
        else point[dimension] += zeroAbs[dimension]
        out.push(point)
    }
    return out as Tuple<Tuple<number, ND>, ND>
}

function weightedSum<ND extends number>(
    w1: number, x1: Tuple<number, ND>,
    w2: number, x2: Tuple<number, ND>,
): Tuple<number, ND> {
    const N = x1.length
    const out = x1.slice() as Tuple<number, ND>
    for(let dim = 0; dim < N; dim++) {
        out[dim] = w1 * x1[dim] + w2 * x2[dim]
    }
    return out
}

export type findMinimumNelderMeadOptions<ND extends number, FxType = number> = {
    relExpand?: number | Tuple<number, ND>,
    absExpand?: number | Tuple<number, ND>,
    alpha?: number,
    gamma?: number,
    rho?: number,
    sigma?: number,
    maxIters?: number,
    minXDelta?: number | Tuple<number, ND>,
    cmpFx?: (a: FxType, b: FxType) => number,
    terminateFxDelta?: (fxmin: FxType, fxmax: FxType) => boolean,
}
function* _findMinimumNelderMead<ND extends number, FxType = number>(
    x0: Tuple<number, ND> | Array<Tuple<number, ND>>,
    options: findMinimumNelderMeadOptions<ND, FxType> = {},
): Generator<Tuple<number, ND>, {x: Tuple<number, ND>, fx: FxType}, FxType> {
    /* Search for a minimum in the given function `f(x)`.
     * `f` is a function taking N numbers as input, and returning a single number. I.e R^N -> R
     * `f` can be a normal function, or an async function
     *
     * Ideally, x0 should be a list of N+1 points.
     * But if a single point is given, the point is automatically expanded:
     *  - by multiplying with `options.relExpand` if the coordinate is non-zero
     *  - by `options.absExpand` otherwise
     *
     * https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method
     */

    const relExpand = options.relExpand || 1.01
    const absExpand = options.absExpand || 0.001
    const alpha = options.alpha || 1  // Reflection step size
    const gamma = options.gamma || 2  // Expansion step size
    const rho = options.rho || .5  // Contraction
    const sigma = options.sigma || 0.5 // shrink
    let maxIters = options.maxIters || 100
    let minXDelta = options.minXDelta || 1e-6  // Stop if x moves less than minXDelta per step
    const cmpFx = options.cmpFx || // How to compare two function outputs
        ((a, b) => (a as number) - (b as number))
    const terminateFxDelta = options.terminateFxDelta || // Termination condition for f(x) range
        ((fxmin, fxmax) => ((fxmax as number) - (fxmin as number)) < 1e-6)

    let simplex: Array<{x: Tuple<number, ND>, fx: FxType}> = []
    let N: number
    if(Array.isArray(x0[0])) {  // full simplex given
        x0 = x0 as Array<Tuple<number, ND>>
        N = x0[0].length
        for(let x of x0) {
            simplex.push({
                x: x,
                fx: yield x,
            })
        }
    } else {
        x0 = x0 as Tuple<number, ND>
        N = x0.length
        simplex.push({
            x: x0,
            fx: yield x0,
        })
        const xextra = expandRelative(x0 as Tuple<number, ND>, relExpand, absExpand)
        for(let x of xextra) {
            simplex.push({
                x: x,
                fx: yield x,
            })
        }
    }
    console.assert(simplex.length == N+1, `Expected N+1 (${N+1}) points for the simplex`)

    if(!Array.isArray(minXDelta)) {
        minXDelta = new Array(N).fill(minXDelta) as Tuple<number, ND>
    }

    while(maxIters--) {
        simplex.sort((a, b) => cmpFx(a.fx, b.fx))  // in-place

        // Termination conditions
        let xDiffWithinLimits = true
        for(let dim = 0; dim < N; dim++) {
            const xDiffDim = Math.abs(simplex[0].x[dim] - simplex[1].x[dim])
            if(xDiffDim >= minXDelta[dim]) {
                xDiffWithinLimits = false
                break
            }
        }
        if(xDiffWithinLimits && terminateFxDelta(simplex[0].fx, simplex[N].fx)) break

        // Compute centroid of all but the worst point of the simplex
        const centroid = new Array(N).fill(0) as Tuple<number, ND>
        for (let dim = 0; dim < N; dim++) {
            for (let point = 0; point < (N+1)-1; point++) {
                centroid[dim] += simplex[point].x[dim];
            }
            centroid[dim] /= N;
        }

        // Reflection step
        const worst = simplex[N].x
        // x_r = x_0 + a(x_0 - x_{n+1}) = (1+a) * x_0 - a * x_{n+1}
        const reflected = weightedSum(1 + alpha, centroid, -alpha, worst)
        const freflected = yield reflected
        if (cmpFx(simplex[0].fx,freflected) <= 0 && cmpFx(freflected, simplex[N - 1].fx) < 0) {
            simplex[N] = {
                x: reflected,
                fx: freflected,
            }
            continue
        }

        if(cmpFx(freflected, simplex[0].fx) < 0) {
            // expansion
            // x_e = x_0 + g(x_r - x_o) = (1-g)x_0 + g*x_r
            const expanded = weightedSum(1 - gamma, centroid, gamma, reflected)
            const fexpanded = yield expanded
            if(cmpFx(fexpanded, freflected) < 0) {
                simplex[N] = {
                    x: expanded,
                    fx: fexpanded,
                }
            } else {
                simplex[N] = {
                    x: reflected,
                    fx: freflected,
                }
            }
            continue
        }

        // Contraction
        // f(x_N) <= f(x_r)
        let contracted
        if(cmpFx(freflected, simplex[N].fx) < 0) {
            // x_c = x_0 + r(x_r - x_o) = (1-r)x_0 + r * x_r
            contracted = weightedSum(1 - rho, centroid, rho, reflected)
        } else {
            // x_c = x_0 + r(x_{n+1} - x_o) = (1-r)x_0 + r * x_{n+1}
            contracted = weightedSum(1 - rho, centroid, rho, worst)
        }
        const fcontracted = yield contracted
        if(cmpFx(fcontracted, freflected) < 0) {
            simplex[N] = {
                x: contracted,
                fx: fcontracted,
            }
            continue
        }

        // Shrink
        for(let point = 1; point < (N+1); point++) {
            // x_i = x_1 + s(x_i - x_1) = (1-s)x_1 - s*x_i
            const xi = weightedSum(1 - sigma, simplex[0].x, sigma, simplex[point].x)
            simplex[point] = {
                x: xi,
                fx: yield xi
            }
        }
    }

    return {
        x: simplex[0].x,
        fx: simplex[0].fx,
    }
}
export function findMinimumNelderMead<ND extends number, FxType = number>(
    f: (x: Tuple<number, ND>) => FxType,
    x0: Tuple<number, ND> | Array<Tuple<number, ND>>,
    options: findMinimumNelderMeadOptions<ND, FxType> = {},
): {
    x: Tuple<number, ND>,
    fx: FxType,
} {
    const gen = _findMinimumNelderMead(x0, options)
    let step = gen.next()
    while(!step.done) {
        step = gen.next(f(step.value as Tuple<number, ND>))
    }
    return step.value
}
export async function findMinimumNelderMeadAsync<ND extends number, FxType = number>(
    f: ((x: Tuple<number, ND>) => FxType) | ((x: Tuple<number, ND>) => Promise<FxType>),
    x0: Tuple<number, ND> | Array<Tuple<number, ND>>,
    options: findMinimumNelderMeadOptions<ND, FxType> = {},
): Promise<{
    x: Tuple<number, ND>,
    fx: FxType,
}> {
    const gen = _findMinimumNelderMead(x0, options)
    let step = gen.next()
    while(!step.done) {
        step = gen.next(await f(step.value as Tuple<number, ND>))
    }
    return step.value
}

function* _findZeroBisect(
    a: number, b: number,
    xTolerance: number = 1e-6, fxTolerance: number = 1e-6,
): Generator<number, number, number> {
    /* Find zero of function `f(x)` by bisecting between [a;b].
     * Expects f(a) * f(b) < 0 (i.e. should have a different sign).
     *
     * Stops when |a-b| < xTolerance or |f(x)| < fxTolerance
     */
    let fa = yield a
    let fb = yield b
    if(!(fa * fb < 0)) {
        throw RangeError(`Expected f(${a})=${fa} and f(${b})=${fb} to have different sign.`)
    }
    // Pre-condition the loop so that f(a) < 0 and f(b) > 0
    // Note that a could be larger than b
    if(fa > 0) {
        let t = a; a = b; b = t
    }
    let d = b - a
    while(Math.abs(a-b) > xTolerance) {
        d = d / 2
        if(d === 0) {
            // We've reached floating point limits, give up
            return a
        }
        const x = a + d
        const fx = yield x
        if(Math.abs(fx) < fxTolerance) return x
        if(fx < 0) {
            // shift a
            a = x
        } // else: shift b, but this is done automatically since we calculate x = a + d
    }
    return a
}
export function findZeroBisect(
    f: (x: number) => number,
    a: number, b: number,
    xTolerance: number = 1e-6, fxTolerance: number = 1e-6,
): number {
    const gen = _findZeroBisect(a, b, xTolerance, fxTolerance)
    let step = gen.next()
    while(!step.done) {
        step = gen.next(f(step.value))
    }
    return step.value
}
export async function findZeroBisectAsync(
    f: ((x: number) => Promise<number>) | ((x: number) => number),
    a: number, b: number,
    xTolerance: number = 1e-6, fxTolerance: number = 1e-6,
): Promise<number> {
    const gen = _findZeroBisect(a, b, xTolerance, fxTolerance)
    let step = gen.next()
    while(!step.done) {
        step = gen.next(await f(step.value))
    }
    return step.value
}
