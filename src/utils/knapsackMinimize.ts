export type Combo<T, E extends {} = {}> = Array<{
    n: number
    item: T
} & E>

export type ComboCost<T, E extends {} = {}> = {
    combination: Combo<T, E>,
    cost: number,
    value: number,
}

export default function knapsackMinimize<T extends { value: number, cost: number }>(
    items: Array<T>,
    minimumValue: number,
): ComboCost<T> {
    const sorted = [...items].sort( // Sort by "value density", descending
        (a, b) => b.value / b.cost - a.value / a.cost,
    )

    function _(minimumValue: number): ComboCost<T> {
        if(minimumValue <= 0) return {combination: [], cost: 0, value: 0}

        let bestSoFar = null
        let bestValueSoFar = null
        let bestCostSoFar = Infinity
        for (let item of sorted) {
            const n = Math.floor(minimumValue / item.value)
            const nPlus1Cost = (n + 1) * item.cost
            if (nPlus1Cost < bestCostSoFar) {
                bestSoFar = [{n: n + 1, item}]
                bestCostSoFar = nPlus1Cost
                bestValueSoFar = (n + 1) * item.value
            }
            if (n > 0) {
                const remainingValue = minimumValue - n * item.value
                const bestForRemaining = _(remainingValue)
                if ((n * item.cost) + bestForRemaining.cost < bestCostSoFar * 0.999 /* prevent rounding errors */) {
                    /* Sometimes this will generate 6×itemX + 1×itemX because of rounding;
                     * require at least 0.1% improvement to counter that */
                    bestSoFar = [{n, item}, ...bestForRemaining.combination]
                    bestCostSoFar = n * item.cost + bestForRemaining.cost
                    bestValueSoFar = n * item.value + bestForRemaining.value
                }
                /* Since we are trying items sorted by "value density",
                 * we know for certain that for (n*item.value) we have the best option
                 * No need to scan further
                 */
                break
            } else {
                // Loop over other items
            }
        }
        return {combination: bestSoFar, cost: bestCostSoFar, value: bestValueSoFar}
    }

    return _(minimumValue)
}