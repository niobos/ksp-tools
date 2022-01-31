export default class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    static FromSpherical(r, i, a) {
        // Inclination measured from positive z-axis
        return new Vector(
            r * Math.sin(i) * Math.cos(a),
            r * Math.sin(i) * Math.sin(a),
            r * Math.cos(i),
        )
    }

    get spherical() {
        const xsq_plus_ysq = this.x*this.x + this.y*this.y;
        return [
            Math.sqrt(xsq_plus_ysq + this.z*this.z),  // r
            Math.atan2(Math.sqrt(xsq_plus_ysq), this.z),  // incl
            Math.atan2(this.y, this.x),  // azimuth
        ]
    }

    add(other) {
        return new Vector(
            this.x + other.x,
            this.y + other.y,
            this.z + other.z,
        )
    }
    sub(other) {
        return new Vector(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z,
        )
    }
    mul(scalar) {
        return new Vector(
            scalar * this.x,
            scalar * this.y,
            scalar * this.z,
        )
    }
    inner_product(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    cross_product(other) {
        return new Vector(
            this.y*other.z - this.z*other.y,
            -this.x*other.z + this.z*other.x,
            this.x*other.y - this.y*other.x,
        )
    }
    get norm() {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    }
    angle_to(other) {
        let cos = this.inner_product(other) / (this.norm * other.norm);
        if(cos < -1) cos = -1;  // cap to compensate for rounding errors
        if(cos > 1) cos = 1;
        return Math.acos(cos);
    }

    rotated(axis, amount) {
        // https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
        axis = axis.mul(1/axis.norm);
        const t1 = this.mul(Math.cos(amount));
        const t2 = axis.cross_product(this).mul(Math.sin(amount));
        const t3 = axis.mul(axis.inner_product(this) * (1 - Math.cos(amount)));
        return t1.add(t2).add(t3);
    }
};