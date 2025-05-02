import {dvForDm, g0, massAfterDv, massBeforeDv} from "./rocket"

describe("dvForDm", () => {
    test("Wikipedia example", () => {
        const dv = dvForDm(1, 1-0.88415, 4500/g0)
        expect(dv).toBeCloseTo(9700, 0)
    })
})

describe("massAfterDv", () => {
    test("Wikipedia example", () => {
        const mEnd = massAfterDv(1, 9700, 4500/g0)
        expect(mEnd).toBeCloseTo(1-0.88415)
    })
})

describe("massBeforeDv", () => {
    test("Wikipedia example", () => {
        const mBegin = massBeforeDv(1-0.88415, 9700, 4500/g0)
        expect(mBegin).toBeCloseTo(1)
    })
})
