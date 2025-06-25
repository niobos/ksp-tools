import knapsackMinimize from "./knapsackMinimize";

describe('knapsackMinimize', () => {
    it('should work', () => {
        const a = {cost: 1, value: 1}
        const b = {cost: 2, value: 4}
        const res = knapsackMinimize(
            [a, b],
            5
        )
        expect(res.combination).toEqual([{n: 1, item: b}, {n: 1, item: a}])
        expect(res.cost).toBe(3)
    })

    test.failing('may not find the best solution', () => {
        const a = {cost: 10, value: 10}
        const b = {cost: 8, value: 7.5}
        const res = knapsackMinimize(
            [a, b],
            14
        )
        expect(res.combination).toEqual([{n: 2, item: b}])
        expect(res.cost).toBe(16)
    })
})
