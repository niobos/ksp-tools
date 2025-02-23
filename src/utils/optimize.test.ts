import {
    expandAbsolute,
    expandRelative,
    findMinimumNelderMead, findMinimumNelderMeadAsync,
    findZeroBisect, findZeroBisectAsync,
} from "./optimize";

describe('utility functions', () => {
    describe('expandAbsolute', () => {
        test('1D', () => {
            const ret = expandAbsolute([0], 1)
            expect(ret).toEqual([[1]])
        })
        test('2D', () => {
            const ret = expandAbsolute([5, 10], 1)
            expect(ret).toEqual([
                [6, 10],
                [5, 11],
            ])
        })
        test('2D, separate d', () => {
            const ret = expandAbsolute([5, 10], [2, 3])
            expect(ret).toEqual([
                [7, 10],
                [5, 13],
            ])
        })
    })

    describe('expandRelative', () => {
        test('1D', () => {
            const ret = expandRelative([10], 1.1)
            expect(ret).toEqual([[11]])
        })
        test('1D zeroAbs', () => {
            const ret = expandRelative([0], 1.1, 0.01)
            expect(ret).toEqual([[0.01]])
        })
        test('2D', () => {
            const ret = expandRelative([10, 20], 1.1)
            expect(ret).toEqual([
                [11, 20],
                [10, 22],
            ])
        })
        test('2D separate f', () => {
            const ret = expandRelative([10, 20], [1.1, 1.2])
            expect(ret).toEqual([
                [11, 20],
                [10, 24],
            ])
        })
    })
})

describe('Nelder-Mead', () => {
    test('1D sync', () => {
        const ret = findMinimumNelderMead(
            (x) => x[0]*x[0],
            [2],
        )
        expect(ret.x[0]).toBeCloseTo(0)
    })
    test('1D async', async () => {
        const ret = await findMinimumNelderMeadAsync(
            async (x) => {
                return x[0] * x[0]
            },
            [2],
        )
        expect(ret.x[0]).toBeCloseTo(0)
    })

    test('2D sync', () => {
        const ret = findMinimumNelderMead<2>(
            (x: [number, number]) => Math.pow(x[0]-5, 2) + Math.pow(x[1]-7, 2),
            [2, 3],
        )
        expect(ret.x[0]).toBeCloseTo(5)
        expect(ret.x[1]).toBeCloseTo(7)
    })
})

describe('findZeroBisectAsync', () => {
    test('linear sync', () => {
        const ret = findZeroBisect(
            (x) => x,
            -5, 0.2,
        )
        expect(ret).toBeCloseTo(0)
    })
    test('linear async', async () => {
        const ret = await findZeroBisectAsync(
            async (x) => {
                return x
            },
            -5, 0.2,
        )
        expect(ret).toBeCloseTo(0)
    })

    it('should check different sign', async () => {
        await expect(findZeroBisectAsync(x => x, 1, 2))
            .rejects
            .toThrow(RangeError)
    })
})
