import kspSystems, {Body, kspSystem} from "./kspSystems"

function angleOfBody(body: Body): number {
    const orbit = body.orbit
    const positionatT0 = orbit.positionAtT(0)
    return Math.atan2(positionatT0.y, positionatT0.x)
}

function modulo(n: number, d: number): number {
    return ((n % d) + d) % d
}

function compareAngle(actualRad: number, expectedDeg: number) {
    actualRad = modulo(actualRad, 2*Math.PI)
    expectedDeg = modulo(expectedDeg, 360)
    expect(actualRad*180/Math.PI).toBeCloseTo(expectedDeg, -1)
}

describe('Stock', () => {
    it('should contain Kerbin', () => {
        expect(kspSystem().bodies["Kerbin"]).toHaveProperty("name", "Kerbin")
    })
    it('should have Kerbin located at the correct position around Kerbol', () => {
        compareAngle(angleOfBody(kspSystem().bodies["Kerbin"]), 180)
    })
    it('should have Mun located at the correct position around Kerbin', () => {
        compareAngle(angleOfBody(kspSystem().bodies["Mun"]), 100)
    })
    it('should have Jool located at the correct position around Kerbol', () => {
        compareAngle(angleOfBody(kspSystem().bodies["Jool"]), 60)
    })
})

describe("OPM", () => {
    const mods = new Set(["OPM"])

    it('should contain Kerbin', () => {
        expect(kspSystem(mods).bodies["Kerbin"]).toHaveProperty("name", "Kerbin")
    })
    it('should have Kerbin located at the correct position around Kerbol', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Kerbin"]), 180)
    })
    it('should have Mun located at the correct position around Kerbin', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Mun"]), 100)
    })
    it('should have Jool located at the correct position around Kerbol', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Jool"]), 60)
    })
    it('should have Sarnus located at the correct position around Kerbol', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Sarnus"]), -10)
    })
    it('should have Hale located at the correct position around Sarnus', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Hale"]), 55)
    })
    it('should have Eeloo located at the correct position around Sarnus', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Eeloo"]), 135)
    })
    it('should have Neidon located at the correct position around Kerbol', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Neidon"]), 30)
    })
    it('should have Nissee located at the correct position around Neidon', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Nissee"]), -140)
    })
    it('should have Thatmo located at the correct position around Neidon', () => {
        compareAngle(angleOfBody(kspSystem(mods).bodies["Thatmo"]), 85)
    })
})
