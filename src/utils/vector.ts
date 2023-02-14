export default class Vector {
    constructor(
        public x: number,
        public y: number,
        public z: number,
    ) {};

    static FromObject(o: any): Vector {
        return new Vector(o.x, o.y, o.z)
    }
    isEqual(other: Vector): boolean {
        return (
            this.x == other.x
            && this.y == other.y
            && this.z == other.z
        )
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

    add(other: Vector): Vector {
        return new Vector(
            this.x + other.x,
            this.y + other.y,
            this.z + other.z,
        )
    }
    sub(other: Vector): Vector {
        return new Vector(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z,
        )
    }
    mul(scalar: number): Vector {
        return new Vector(
            scalar * this.x,
            scalar * this.y,
            scalar * this.z,
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
    get norm(): number {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    }
    angle_to(other): number {
        let cos = this.inner_product(other) / (this.norm * other.norm);
        if(cos < -1) cos = -1;  // cap to compensate for rounding errors
        if(cos > 1) cos = 1;
        return Math.acos(cos);
    }

    rotated(axis: Vector, amount: number): Vector {
        // https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
        axis = axis.mul(1/axis.norm);
        const t1 = this.mul(Math.cos(amount));
        const t2 = axis.cross_product(this).mul(Math.sin(amount));
        const t3 = axis.mul(axis.inner_product(this) * (1 - Math.cos(amount)));
        return t1.add(t2).add(t3);
    }
};