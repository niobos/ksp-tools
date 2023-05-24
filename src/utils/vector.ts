export type Radians = number

export default class Vector<Type extends number=number> {
    constructor(
        public x: Type,
        public y: Type,
        public z: Type,
    ) {};

    static FromObject<Type extends number=number>(o: any): Vector<Type> {
        if(o == null) return null
        return new Vector<Type>(o.x, o.y, o.z)
    }
    isEqual(other: Vector): boolean {
        return (
            this.x == other.x
            && this.y == other.y
            && this.z == other.z
        )
    }

    isNaN(): boolean {
        return isNaN(this.x) || isNaN(this.y) || isNaN(this.z)
    }

    static FromSpherical(r: number, i: number, a: number): Vector {
        // Inclination measured from positive z-axis
        return new Vector(
            r * Math.sin(i) * Math.cos(a),
            r * Math.sin(i) * Math.sin(a),
            r * Math.cos(i),
        )
    }

    get spherical(): [number, number, number] {
        const xsq_plus_ysq = this.x*this.x + this.y*this.y;
        return [
            Math.sqrt(xsq_plus_ysq + this.z*this.z),  // r
            Math.atan2(Math.sqrt(xsq_plus_ysq), this.z),  // incl
            Math.atan2(this.y, this.x),  // azimuth
        ]
    }

    add(other: Vector<Type>): Vector<Type> {
        return new Vector<Type>(
            this.x + other.x as Type,
            this.y + other.y as Type,
            this.z + other.z as Type,
        )
    }
    sub(other: Vector<Type>): Vector<Type> {
        return new Vector<Type>(
            this.x - other.x as Type,
            this.y - other.y as Type,
            this.z - other.z as Type,
        )
    }
    mul(scalar: number): Vector<Type> {
        return new Vector<Type>(
            scalar * this.x as Type,
            scalar * this.y as Type,
            scalar * this.z as Type,
        )
    }
    inner_product(other: Vector): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    cross_product(other: Vector): Vector {
        return new Vector(
            this.y*other.z - this.z*other.y,
            -this.x*other.z + this.z*other.x,
            this.x*other.y - this.y*other.x,
        )
    }
    get norm(): Type {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z) as Type;
    }
    angle_to(other): Radians {
        let cos = this.inner_product(other) / (this.norm * other.norm);
        if(cos < -1) cos = -1;  // cap to compensate for rounding errors
        if(cos > 1) cos = 1;
        return Math.acos(cos);
    }

    rotated(axis: Vector, amount: Radians): Vector {
        // https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
        axis = axis.mul(1/axis.norm);
        const t1 = this.mul(Math.cos(amount)) as Vector<number>;
        const t2 = axis.cross_product(this).mul(Math.sin(amount));
        const t3 = axis.mul(axis.inner_product(this) * (1 - Math.cos(amount)));
        return t1.add(t2).add(t3) as Vector<Type>;
    }
};