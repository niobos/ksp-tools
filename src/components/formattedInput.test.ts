import {formatValueYdhms, formatValueYdhmsAbs} from "./formattedInput"

describe('formatValueYdhms', () => {
    it('should return 0s for 0', () => {
        const out = formatValueYdhms(0)
        expect(out).toBe("0s")
    })

    it('should return seconds for small times', () => {
        const out = formatValueYdhms(7)
        expect(out).toBe("7.0s")
    })

    it('should round seconds', () => {
        const out = formatValueYdhms(1.25)
        expect(out).toBe("1.3s")
    })

    it('should include multiple units if needed', () => {
        const out = formatValueYdhms(1*426*6*60*60 + 2*6*60*60 + 3*60*60 + 4*60 + 5.67)
        expect(out).toBe("1y 2d 3h 4m 5.7s")
    })

    it('should reduce multiple units if asked', () => {
        const out = formatValueYdhms(1*426*6*60*60 + 2*6*60*60 + 3*60*60 + 4*60 + 5.67, 2)
        expect(out).toBe("1y 2d")
    })

    it('should be able to replace singleUnit', () => {
        const out = formatValueYdhms(1*426*6*60*60 + 2*6*60*60 + 3*60*60 + 4*60 + 5.67, 1)
        expect(out).toBe("1y")
    })

    it('should handle null as maxParts', () => {
        const out = formatValueYdhms(1*426*6*60*60 + 2*6*60*60 + 3*60*60 + 4*60 + 5.67, null)
        expect(out).toBe("1y 2d 3h 4m 5.7s")
    })
})

describe('formatValueYdhmsAbs', () => {
    it('should work for 0', () => {
        const out = formatValueYdhmsAbs(0)
        expect(out).toBe("Y1, D1, 00:00:00.0")
    })

    it('should work for fractional seconds with rounding', () => {
        const out = formatValueYdhmsAbs(0.12)
        expect(out).toBe("Y1, D1, 00:00:00.1")
    })

    it('should work for years', () => {
        const out = formatValueYdhmsAbs(1*426*6*60*60 + 2*6*60*60 + 3*60*60 + 4*60 + 5.67)
        expect(out).toBe("Y2, D3, 03:04:05.7")
    })

    it('should limit units if asked', () => {
        const out = formatValueYdhmsAbs(1*426*6*60*60 + 2*6*60*60 + 3*60*60 + 4*60 + 5.67, 3)
        expect(out).toBe("Y2, D3, 03")
    })

    it('should behave with maxParts==null', () => {
        const out = formatValueYdhmsAbs(1*426*6*60*60 + 2*6*60*60 + 3*60*60 + 4*60 + 5.67, null)
        expect(out).toBe("Y2, D3, 03:04:05.7")
    })
})