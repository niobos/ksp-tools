// Adapted from https://github.com/alexeyraspopov/dataclass

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

let GUARD = Symbol("Empty");
let VALUES = Symbol("Values");

class Data {
    static create(values = {}) {
        let data = new this(GUARD);
        Object.defineProperty(data, VALUES, { value: values });
        Object.assign(data, values);
        if(typeof this.prototype._postCreate === 'function') data._postCreate();
        return Object.freeze(data);
    }

    constructor(values) {
        if (values !== GUARD) {
            throw new Error("Use " + this.constructor.name + ".create(...) instead of `new` operator");
        }
    }

    copy(values) {
        let composed = Object.assign({}, this[VALUES], values);
        return this.constructor.create(composed);
    }

    equals(other) {
        let va = this[VALUES];
        let vb = other[VALUES];

        for (let key in this) {
            let hasA = key in va;
            let hasB = key in vb;
            if (hasA || hasB) {
                let a = hasA ? va[key] : this[key];
                let b = hasB ? vb[key] : other[key];
                if (a !== b) {
                    if (a != null && b != null) {
                        if (a instanceof Data && b instanceof Data && a.equals(b)) continue;
                        if (a.valueOf() === b.valueOf()) continue;
                    }
                    return false;
                }
            }
        }

        return true;
    }
}

exports.Data = Data;
