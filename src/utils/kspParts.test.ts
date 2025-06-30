import Part, {resourceInfoWithMods, Resources, Size} from "./kspParts"

describe('Resources', () => {
    it('should initialize correctly', () => {
        const r = new Resources({LF: 5, Ox: 50})
        expect(r.amount.LF).toBe(5)
        expect(r.amount.Ox).toBe(50)
        expect(r.mass(resourceInfoWithMods()).Ox).toBe(0.25)
    })

    it('should calculate consumption', () => {
        const r = new Resources({LF: 5, Ox: 10})
        expect(r.consumedAtRatio(new Resources({LF: 1, Ox: 1}))).toBe(5);
    })
})

describe('Size', () => {
    it('should be iterable', () => {
        const sizes = []
        for(let size in Size) {
            sizes.push(size)
        }
        expect(sizes).toStrictEqual(["TINY", "SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE", "HUGE", "MK2", "MK3", "RADIAL"])
    })
    it('should provide a short description', () => {
        expect(Size.TINY.shortDescription).toStrictEqual("T")
    })
    it('should provide a long description', () => {
        expect(Size.TINY.longDescription).toStrictEqual("Tiny (.625m)")
    })
})

describe('Part', () => {
    it('should empty correctly', () => {
        const p = Part.create({
            cost: 1000, mass: 10, size: new Set(["R"]),
            content: new Resources({LF: 100, Ox: 1000}),
        })
        expect(p.content.amount.LF).toBe(100)
        expect(p.content.amount.Ox).toBe(1000)
        const e = p.emptied(resourceInfoWithMods())
        expect(p.content.amount.LF).toBe(100)
        expect(p.content.amount.Ox).toBe(1000)
        expect(e.content.amount.LF ?? 0).toBe(0)
        expect(e.content.amount.Ox ?? 0).toBe(0)
        expect(e.cost).toBe(1000-80-160)
        expect(e.mass).toBe(10-0.5-5)
    })
})
