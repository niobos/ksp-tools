export function objectMap<K extends PropertyKey, Vin, Vout>(
    obj: { [k in K]: Vin },
    mapFn: (v: Vin, k: K) => Vout,
): { [k in K]: Vout } {
    /* returns a new object with the values at each key mapped using mapFn(value, key)
     */
    return Object.keys(obj).reduce((result, key) => {
        const key_ = key as K
        result[key_] = mapFn(obj[key_], key as K)
        return result
    }, {} as {[k in K]: Vout})
}

export function objectFilter<K extends PropertyKey, V>(
    obj: { [k in K]: V},
    filterFn: (k: K, v: V) => boolean,
): { [k in K]?: V } {
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

export function fromPreset(valueOrPreset, presets) {
    let value, preset;
    if(typeof valueOrPreset === 'string') {  // preset
        preset = valueOrPreset;
        value = presets[preset];
    } else {  // value
        value = valueOrPreset;
        preset = "";
    }
    return {value, preset};
}
