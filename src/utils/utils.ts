export function objectMap(object, mapFn) {
    /* returns a new object with the values at each key mapped using mapFn(value)
     */
    return Object.keys(object).reduce(function(result, key) {
        result[key] = mapFn(object[key])
        return result
    }, {})
}

export function objectFilter(object, filterFn) {
    /* returns a new object with only the key:value's for which filterFn(key, value) returns true
     */
    return Object.keys(object).reduce(function(result, key) {
        if(filterFn(key, object[key])) {
            result[key] = object[key]
        }
        return result
    }, {})
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
