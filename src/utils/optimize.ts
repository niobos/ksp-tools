// noinspection JSUnusedGlobalSymbols

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

async function ensurePromise<T>(f: Promise<T> | T): Promise<T> {
    return Promise.resolve(f)
}

function weightedSum<ND extends number>(x1: Tuple<number, ND>, w1: number,
                         x2: Tuple<number, ND>, w2: number
): Tuple<number, ND> {
    const N = x1.length
    const out = x1.slice() as Tuple<number, ND>
    for(let dim = 0; dim < N; dim++) {
        out[dim] = w1 * x1[dim] + w2 * x2[dim]
    }
    return out
}

export type findMinimumNelderMeadOptions<ND extends number> = {
    relExpand?: number,
    absExpand?: number,
    alpha?: number,
    gamma?: number,
    rho?: number,
    sigma?: number,
    maxIters?: number,
    minXDelta?: number | Tuple<number, ND>,
    minFxDelta?: number,
}
export async function findMinimumNelderMead<ND extends number>(
    f: ((x: Tuple<number, ND>) => number) | ((x: Tuple<number, ND>) => Promise<number>),
    x0: Tuple<number, ND> | Array<Tuple<number, ND>>,
    options: findMinimumNelderMeadOptions<ND> = {},
): Promise<{
    x: Tuple<number, ND>,
    fx: number,
}> {
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
    const minFxDelta = options.minFxDelta || 1e-6  // Stop if f(x) improves less than minFxDelta per step
    let minXDelta = options.minXDelta || 1e-6  // Stop if x moves less than minXDelta per step

    let simplex: Array<{x: Tuple<number, ND>, fx: number}>
    let N: number
    if(Array.isArray(x0[0])) {  // full simplex given
        N = x0[0].length
        simplex = await Promise.all(
            x0.map(async (p) => ({
                x: p,
                fx: await ensurePromise(f(p))
            }))
        )
    } else {
        N = x0.length
        const xextra = expandRelative(x0 as Tuple<number, ND>, relExpand, absExpand)
        simplex = await Promise.all(
            [x0, ...xextra].map(async (p: Tuple<number, ND>) => ({
                x: p,
                fx: await ensurePromise(f(p))
            }))
        )
    }
    console.assert(simplex.length == N+1, `Expected N+1 (${N+1}) points for the simplex`)

    if(!Array.isArray(minXDelta)) {
        minXDelta = new Array(N).fill(minXDelta) as Tuple<number, ND>
    }

    while(maxIters--) {
        simplex.sort((a, b) => a.fx - b.fx)  // in-place

        // Termination conditions
        let xDiffWithinLimits = true
        for(let dim = 0; dim < N; dim++) {
            const xDiffDim = Math.abs(simplex[0].x[dim] - simplex[1].x[dim])
            if(xDiffDim >= minXDelta[dim]) {
                xDiffWithinLimits = false
                break
            }
        }
        if(xDiffWithinLimits && simplex[N].fx - simplex[0].fx < minFxDelta) break

        // Compute centroid of all but the worst point of the simplex
        const centroid = simplex[0].x.slice() as Tuple<number, ND>
        for (let i = 0; i < N; ++i) {
            centroid[i] = 0;
            for (let j = 0; j < N; ++j) {
                centroid[i] += simplex[j].x[i];
            }
            centroid[i] /= N;
        }

        // Reflection step
        const worst = simplex[N].x
        // x_r = x_0 + a(x_0 - x_{n+1}) = (1+a) * x_0 - a * x_{n+1}
        const reflected = weightedSum(centroid, 1 + alpha, worst, -alpha)
        const freflected = await ensurePromise(f(reflected))
        if (simplex[0].fx <= freflected && freflected < simplex[N - 1].fx) {
            simplex[N] = {
                x: reflected,
                fx: freflected,
            }
            continue
        }

        if(freflected < simplex[0].fx) {
            // expansion
            // x_e = x_0 + g(x_r - x_o) = (1-g)x_0 + g*x_r
            const expanded = weightedSum(centroid, 1-gamma, reflected, gamma)
            const fexpanded = await ensurePromise(f(expanded))
            if(fexpanded < freflected) {
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
        if(freflected < simplex[N].fx) {
            // x_c = x_0 + r(x_r - x_o) = (1-r)x_0 + r * x_r
            contracted = weightedSum(centroid, 1-rho, reflected, rho)
        } else {
            // x_c = x_0 + r(x_{n+1} - x_o) = (1-r)x_0 + r * x_{n+1}
            contracted = weightedSum(centroid, 1-rho, worst, rho)
        }
        const fcontracted = await ensurePromise(f(contracted))
        if(fcontracted < freflected) {
            simplex[N] = {
                x: contracted,
                fx: fcontracted,
            }
            continue
        }

        // Shrink
        for(let i = 1; i < N; i++) {
            // x_i = x_1 + s(x_i - x_1) = (1-s)x_1 - s*x_i
            const xi = weightedSum(simplex[0].x, 1-sigma, simplex[i].x, sigma)
            simplex[i] = {
                x: xi,
                fx: await ensurePromise(f(xi))
            }
        }
    }

    return {
        x: simplex[0].x,
        fx: simplex[0].fx,
    }
}
