// From https://type-level-typescript.com/articles/how-to-get-optional-keys-from-object-types
//type IsOptional<Obj, Key extends PropertyKey> = Omit<Obj, Key> extends Obj ? true : false
//type IsRequired<Obj, Key extends PropertyKey> = Omit<Obj, Key> extends Obj ? false : true

export function objectMap<Obj extends object, Vout>(
    obj: Obj,
    mapFn: (v: Obj[keyof Obj], k: string) => Vout,
): {[k in keyof Obj]: Vout} {
    /* returns a new object with the values at each key mapped using mapFn(value, key)
     */
    return Object.keys(obj).reduce((result, key) => {
        const key_ = key as keyof Obj
        result[key_] = mapFn(obj[key_], key)
        return result
    }, {} as {[k in keyof Obj]: Vout})
}

export function objectFilter<K extends PropertyKey, V>(
    obj: {[k in K]: V},
    filterFn: (k: K, v: V) => boolean,
): {[k in K]?: V} {
    /* returns a new object with only the key:value's for which filterFn(key, value) returns true
     */
    return Object.keys(obj).reduce((result, key) => {
        const key_ = key as K
        if(filterFn(key_, obj[key_])) {
            result[key_] = obj[key_]
        }
        return result
    }, {} as { [k in K]?: V })
}

export function objectJoin<K extends PropertyKey, V1, V2, Vo>(
    obj1: { [k in K]: V1 },
    obj2: { [k in K]: V2 },
    joinFn: (k: K, v1: V1, v2: V2) => Vo
): {[k in K]: Vo} {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
    const out = {}
    for(let k in allKeys) {
        out[k] = joinFn(k as K, obj1[k], obj2[k])
    }
    return out as {[k in K]: Vo}
}

export function fromPreset<T>(
    valueOrPreset: string | T,
    presets: Record<string, T>,
): {value: T, preset: string} {
    let value: T, preset: string;
    if(typeof valueOrPreset === 'string') {  // preset
        preset = valueOrPreset;
        value = presets[preset];
    } else {  // value
        value = valueOrPreset;
        preset = "";
    }
    return {value, preset};
}

export function setEq<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size != b.size) return false
    return [...a].every(value => b.has(value))
}

export function combineWithOverride<T extends {name: string}>(...lists: Array<Array<T>>): Array<T> {
    const index: Record<string, T> = {}
    for(let list of lists) {
        for(let item of list) {
            index[item.name] = item
        }
    }
    return Object.values(index)
}
