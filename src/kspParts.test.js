import Part, {Resources, Size} from "./kspParts.ts";

describe('Resources', () => {
    it('should initialize correctly', () => {
        const r = Resources.create({lf: 5, ox: 50});
        expect(r.lf).toBe(5);
        expect(r.ox).toBe(50);
    });

    it('should be immutable', () => {
        const r = Resources.create({lf: 5, ox: 50});
        expect(() => {
            r.lf = 6;
        }).toThrow();
        expect(r.lf).toBe(5);
    });
});

describe('Size', () => {
    it('should be iterable', () => {
        const sizes = []
        for(let size in Size) {
            sizes.push(size);
        }
        expect(sizes).toStrictEqual(["TINY", "SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE", "HUGE", "MK2", "MK3", "RADIAL"]);
    });
    it('should provide a short description', () => {
        expect(Size.TINY.shortDescription).toStrictEqual("T");
    });
    it('should provide a long description', () => {
        expect(Size.TINY.longDescription).toStrictEqual("Tiny (.625m)");
    });
});

describe('Part', () => {
    it('should empty correctly', () => {
        const p = Part.create({
            cost: 1000, mass: 10, size: ['R'],
            content: Resources.create({lf: 100, ox: 1000}),
        });
        expect(p.content.lf).toBe(100);
        expect(p.content.ox).toBe(1000);
        const e = p.emptied();
        expect(p.content.lf).toBe(100);
        expect(p.content.ox).toBe(1000);
        expect(e.content.lf).toBe(0);
        expect(e.content.ox).toBe(0);
        expect(e.cost).toBe(1000-80-160);
        expect(e.mass).toBe(10-0.5-5);
    });
});