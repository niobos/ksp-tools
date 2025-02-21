import Vector from "./vector";

describe('Vector', () => {
    it('should add', () => {
        const a = new Vector(1, 2, 3);
        const b = new Vector(4, 5, 6);
        const c = a.add(b);
        expect(c.x).toBe(5);
        expect(c.y).toBe(7);
        expect(c.z).toBe(9);
    });

    it('should sub', () => {
        const a = new Vector(4, 5, 6);
        const b = new Vector(1, 2, 3);
        const c = a.sub(b);
        expect(c.x).toBe(3);
        expect(c.y).toBe(3);
        expect(c.z).toBe(3);
    });

    it('should mul', () => {
        const a = new Vector(1, 2, 3);
        const c = a.mul(2);
        expect(c.x).toBe(2);
        expect(c.y).toBe(4);
        expect(c.z).toBe(6);
    });
});
