export function find_zero_1d(f, fp, x0, options) {
    /* Usage:
     *   ksp.find_zero(f[, fp], x0[, options])
     * Given a real-valued function of one variable, iteratively improves and returns a guess of a zero.
     *
     * Parameters:
     *     f: The numerical function of one variable of which to compute the zero.
     *     fp (optional): The first derivative of f. If not provided, is computed numerically using a fourth order central difference with step size h.
     *     x0: A number representing the intial guess of the zero.
     *     options (optional): An object permitting the following options:
     *         tolerance (default: 1e-7): The tolerance by which convergence is measured. Convergence is met if |x[n+1] - x[n]| <= tolerance * |x[n+1]|.
     *         epsilon (default: 2.220446049250313e-16 (double-precision epsilon)): A threshold against which the first derivative is tested. Algorithm fails if |y'| < epsilon * |y|.
     *         maxIterations (default: 20): Maximum permitted iterations.
     *         h (default: 1e-4): Step size for numerical differentiation.
     *         verbose (default: false): Output additional information about guesses, convergence, and failure.
     *
     * Returns: If convergence is achieved, returns an approximation of the zero. If the algorithm fails, returns false.
     *
     * SOURCE: https://github.com/scijs/newton-raphson-method MIT licensed
     */
    var x1, y, yp, tol, maxIter, iter, yph, ymh, yp2h, ym2h, h, hr, verbose, eps;

    // Iterpret variadic forms:
    if (typeof fp !== 'function') {
        options = x0;
        x0 = fp;
        fp = null;
    }

    options = options || {};
    tol = options.tolerance === undefined ? 1e-7 : options.tolerance;
    eps = options.epsilon === undefined ? 2.220446049250313e-16 : options.epsilon;
    maxIter = options.maxIterations === undefined ? 20 : options.maxIterations;
    h = options.h === undefined ? 1e-4 : options.h;
    verbose = options.verbose === undefined ? false : options.verbose;
    hr = 1 / h;

    iter = 0;
    while (iter++ < maxIter) {
        // Compute the value of the function:
        y = f(x0);

        if (fp) {
            yp = fp(x0);
        } else {
            // Needs numerical derivatives:
            yph = f(x0 + h);
            ymh = f(x0 - h);
            yp2h = f(x0 + 2 * h);
            ym2h = f(x0 - 2 * h);

            yp = ((ym2h - yp2h) + 8 * (yph - ymh)) * hr / 12;
        }

        // Check for badly conditioned update (extremely small first deriv relative to function):
        if (Math.abs(yp) <= eps * Math.abs(y)) {
            if (verbose) {
                console.log('Newton-Raphson: failed to converged due to nearly zero first derivative');
            }
            return false;
        }

        // Update the guess:
        x1 = x0 - y / yp;

        // Check for convergence:
        if (Math.abs(x1 - x0) <= tol * Math.abs(x1)) {
            if (verbose) {
                console.log('Newton-Raphson: converged to x = ' + x1 + ' after ' + iter + ' iterations');
            }
            return x1;
        }

        // Transfer update to the new guess:
        x0 = x1;
    }

    if (verbose) {
        console.log('Newton-Raphson: Maximum iterations reached (' + maxIter + ')');
    }

    return false;
};

export function find_minimum_1d(f, options, status) {
    return bfgs_minimize.minimize_1d(f, options, status);
}

export function find_minimum_nd(f, x0, init_step=100, err=0.1) {
    /* Naive, unoptimized multi-dimensional optimizer
     * I tried to use https://github.com/yanceyou/bfgs-algorithm/blob/master/lib/BFGSAlgorithm.js,
     * but that didn't even converge.
     *
     * Algorithm:
     *  - Minimize each dimension individually
     *  - Do so again, until the gain is less then err
     */

    let prev_cost = undefined, cost = undefined;
    while(prev_cost === undefined || cost < prev_cost - err) {
        for (let dim = 0; dim < x0.length; dim++) {
            function x_(x_d) {
                const x = [...x0];
                x[dim] = x_d;
                return x;
            }

            x0[dim] = find_minimum_1d((x) => f(x_(x)), {
                guess: x0[dim],
                initialIncrement: init_step,
                tolerance: err
            });
        }
        prev_cost = cost;
        cost = f(x0);
    }
    return x0;
}
