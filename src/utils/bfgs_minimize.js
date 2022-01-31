const bfgs_minimize = function(f, x0, options) {
    // SOURCE: https://github.com/yanceyou/bfgs-algorithm/blob/master/lib/BFGSAlgorithm.js MIT licensed
    options = options || {}

    this.f = f
    this.n = x0.length
    // cache the init guess
    this.xInitGuess = x0
    this.x = [...x0];  // clone

    this.df = options.df || bfgs_minimize.getApproximateGradientFunction(this.f)
    this.maxIterator = options.maxIterator || 200
    this.err = options.err || 1E-6

    // the gradient of the function evaluated at x[k]: g[k]  (x[0] = x0)
    this.g = this.df(this.x)

    // the inverse of approximate Hessian matrix: B[k]  (B[0] = I)
    this.B = bfgs_minimize.getIdentityMatrix(this.n)

    // direction: p[k]
    this.p = []

    this.stepsize = 0
    this.convergence = Infinity
    this.isConverges = false

    this.iterator = -1
};
bfgs_minimize.prototype = {
    // SOURCE: https://github.com/yanceyou/bfgs-algorithm/blob/master/lib/MathUtils.js  MIT licensed
    step: function() {
        var self = this
        var dimension = self.n
        var i, j

        ////////////////////////////////////////////////////////////////
        // 0. Convergence is checked by observing the norm of the gradient
        //
        var convergence = 0
        for (i = 0; i < dimension; i++) {
            convergence += self.g[i] * self.g[i]
        }
        self.convergence = Math.sqrt(convergence)

        if (isNaN(self.convergence)) {
            throw 'the norm of the gradient was unconverged'
        }

        if (self.convergence < self.err) {
            self.isConverges = true
            return self
        }

        self.iterator++
        ////////////////////////////////////////////////////////////////
        // 1. obtain a direction pk by solving: P[k] = - B[k] * ▽f(x[k])
        // 搜索方向 done: p
        for (i = 0; i < dimension; i++) {
            self.p[i] = 0
            for (j = 0; j < dimension; j++) {
                self.p[i] += -self.B[i][j] * self.g[j]
            }
        }

        ////////////////////////////////////////////////////////////////
        // 2. lineSearch: min f(x + lamda * p)
        // 搜索步长 done: stepsize
        var fNext = function(lamda) {
            var xNext = []
            for (i = 0; i < dimension; i++) {
                xNext[i] = self.x[i] + lamda * self.p[i]
            }
            return self.f(xNext)
        }

        self.stepsize = bfgs_minimize.minimize_1d(fNext, { guess: 0 })

        if (isNaN(self.stepsize)) {
            throw 'can\'t find approximate stepsize'
        }

        ////////////////////////////////////////////////////////////////
        // 3. update: x[k + 1] = x[k] + stepsize * p[k],  s[k] = stepsize * p[k]
        // 求取heessian矩阵中间值 s done: s = stepsize * p
        // 下一次迭代点 done: s = stepsize * p
        var s = []
        for (i = 0; i < dimension; i++) {
            s[i] = self.stepsize * self.p[i]
            self.x[i] += s[i]
        }

        ////////////////////////////////////////////////////////////////
        // 4. next gradient: ▽f(x[k + 1]), y[k] = g[k + 1] - g[k]
        // 求取hessian矩阵中间值 y done: y = df(x[k + 1]) - df(x[k])
        var _g = self.df(self.x)
        var y = []
        for (i = 0; i < dimension; i++) {
            y[i] = _g[i] - self.g[i]
        }
        self.g = _g

        ////////////////////////////////////////////////////////////////
        // 5. approximate hessian matrix
        // (T) => transposition

        // 5.1 let _scalarA = s(T) * y
        var _scalarA = 0
        for (i = 0; i < dimension; i++) {
            _scalarA += s[i] * y[i]
        }

        // 5.2 let _vectorB = B * y
        var _vectorB = []
        for (i = 0; i < dimension; i++) {
            _vectorB[i] = 0
            for (j = 0; j < dimension; j++) {
                _vectorB[i] += self.B[i][j] * y[j]
            }
        }

        // 5.3 let _scalarC = (s(T) * y + y(T) * B * y) / (s(T) * y)2
        //                  = (_scalarA + y(T) * _vectorB) / (_scalarA * _scalarA)
        var _scalarC = 0
        for (i = 0; i < dimension; i++) {
            _scalarC += y[i] * _vectorB[i]
        }
        _scalarC = (_scalarA + _scalarC) / (_scalarA * _scalarA)

        for (i = 0; i < dimension; i++) {
            for (j = 0; j < dimension; j++) {
                self.B[i][j] += _scalarC * s[i] * s[j] - (_vectorB[i] * s[j] + s[i] * _vectorB[j]) / _scalarA
            }
        }

        return self
    },

    run: function() {
        while (true) {
            if (this.isConverges) {
                return this
            }

            if (this.iterator > this.maxIterator) {
                throw 'Too much iterators'
            }

            this.step()
        }
    }
};
bfgs_minimize.getIdentityMatrix = function(size) {
    // SOURCE: https://github.com/yanceyou/bfgs-algorithm/blob/master/lib/MathUtils.js  MIT licensed
    var i, j
    var matrix = []

    for (i = 0; i < size; i++) {
        matrix[i] = []
        for (j = 0; j < size; j++) {
            matrix[i][j] = 0
        }
        matrix[i][i] = 1
    }

    return matrix
};
bfgs_minimize.getApproximateGradientFunction = function(f) {
    // SOURCE: https://github.com/yanceyou/bfgs-algorithm/blob/master/lib/MathUtils.js  MIT licensed
    return function(x) {
        var deltaX = 1E-10
        var deltaY
        var xNew = [], dy = []

        var i, j, n = x.length
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                xNew[j] = (i === j) ? (x[j] + deltaX) : x[j]
            }

            deltaY = f(xNew) - f(x)

            dy[i] = deltaY / deltaX
        }

        return dy
    }
};

bfgs_minimize.minimize_1d = function (f, options, status) {
    // SOURCE: https://github.com/scijs/minimize-golden-section-1d/blob/master/src/golden-section-minimize.js MIT licensed
    const PHI_RATIO = 2 / (1 + Math.sqrt(5));

    options = options || {};
    var x0;
    var tolerance = options.tolerance === undefined ? 1e-8 : options.tolerance;
    var dx = options.initialIncrement === undefined ? 1 : options.initialIncrement;
    var xMin = options.lowerBound === undefined ? -Infinity : options.lowerBound;
    var xMax = options.upperBound === undefined ? Infinity : options.upperBound;
    var maxIterations = options.maxIterations === undefined ? 100 : options.maxIterations;

    if (status) {
        status.iterations = 0;
        status.argmin = NaN;
        status.minimum = Infinity;
        status.converged = false;
    }

    let bounds = [0, 0];
    if (isFinite(xMax) && isFinite(xMin)) {
        bounds[0] = xMin;
        bounds[1] = xMax;
    } else {
        // Construct the best guess we can:
        if (options.guess === undefined) {
            if (xMin > -Infinity) {
                x0 = xMax < Infinity ? 0.5 * (xMin + xMax) : xMin;
            } else {
                x0 = xMax < Infinity ? xMax : 0;
            }
        } else {
            x0 = options.guess;
        }

        function bracketMinimum(bounds, f, x0, dx, xMin, xMax, maxIter) {
            // If either size is unbounded (=infinite), Expand the guess
            // range until we either bracket a minimum or until we reach the bounds:
            var fU, fL, fMin, n, xL, xU, bounded;
            n = 1;
            xL = x0;
            xU = x0;
            fMin = fL = fU = f(x0);
            while (!bounded && isFinite(dx) && !isNaN(dx)) {
                ++n;
                bounded = true;

                if (fL <= fMin) {
                    fMin = fL;
                    xL = Math.max(xMin, xL - dx);
                    fL = f(xL);
                    bounded = false;
                }
                if (fU <= fMin) {
                    fMin = fU;
                    xU = Math.min(xMax, xU + dx);
                    fU = f(xU);
                    bounded = false;
                }

                // Track the smallest value seen so far:
                fMin = Math.min(fMin, fL, fU);

                // If either of these is the case, then the function appears
                // to be minimized against one of the bounds, so although we
                // haven't bracketed a minimum, we'll considere the procedure
                // complete because we appear to have bracketed a minimum
                // against a bound:
                if ((fL === fMin && xL === xMin) || (fU === fMin && xU === xMax)) {
                    bounded = true;
                }

                // Increase the increment at a very quickly increasing rate to account
                // for the fact that we have *no* idea what floating point magnitude is
                // desirable. In order to avoid this, you should really provide *any
                // reasonable bounds at all* for the variables.
                dx *= n < 4 ? 2 : Math.exp(n * 0.5);

                if (!isFinite(dx)) {
                    bounds[0] = -Infinity;
                    bounds[1] = Infinity;
                    return bounds;
                }
            }

            bounds[0] = xL;
            bounds[1] = xU;
            return bounds;
        }
        bracketMinimum(bounds, f, x0, dx, xMin, xMax, maxIterations);

        if (isNaN(bounds[0]) || isNaN(bounds[1])) {
            return NaN;
        }
    }

    let xL = bounds[0];
    let xU = bounds[1];
    const tol = tolerance;

    var xF, fF;
    var iteration = 0;
    var x1 = xU - PHI_RATIO * (xU - xL);
    var x2 = xL + PHI_RATIO * (xU - xL);
    // Initial bounds:
    var f1 = f(x1);
    var f2 = f(x2);

    // Store these values so that we can return these if they're better.
    // This happens when the minimization falls *approaches* but never
    // actually reaches one of the bounds
    var f10 = f(xL);
    var f20 = f(xU);
    var xL0 = xL;
    var xU0 = xU;

    // Simple, robust golden section minimization:
    while (++iteration < maxIterations && Math.abs(xU - xL) > tol) {
        if (f2 > f1) {
            xU = x2;
            x2 = x1;
            f2 = f1;
            x1 = xU - PHI_RATIO * (xU - xL);
            f1 = f(x1);
        } else {
            xL = x1;
            x1 = x2;
            f1 = f2;
            x2 = xL + PHI_RATIO * (xU - xL);
            f2 = f(x2);
        }
    }

    xF = 0.5 * (xU + xL);
    fF = 0.5 * (f1 + f2);

    if (status) {
        status.iterations = iteration;
        status.argmin = xF;
        status.minimum = fF;
        status.converged = true;
    }

    if (isNaN(f2) || isNaN(f1) || iteration === maxIterations) {
        if (status) {
            status.converged = false;
        }
        return NaN;
    }

    if (f10 < fF) {
        return xL0;
    } else if (f20 < fF) {
        return xU0;
    } else {
        return xF;
    }
};