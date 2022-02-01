/* Inspired by https://medium.com/swlh/using-react-hooks-to-sync-your-component-state-with-the-url-query-string-81ccdfcb174f
 */

import {useCallback, useState} from 'react';

function getHash() {
    let hash = window.location.hash;  // strip leading #
    if(hash.length > 1) hash = hash.substr(1);  // remove leading #
    return new URLSearchParams(hash);
}

export function getValueFromHash(key, defaultValue) {
    const params = getHash();
    const value = params.get(key);
    if(value === null || value === undefined) return defaultValue;
    try {
        return value;
    } catch (e) {
        return defaultValue;
    }
}

export function updateHashValue(key, value) {
    const params = getHash();
    params.set(key, value);
    window.location.hash = params.toString();
}

export function jsonParseWithDefault(defaultValue) {
    return (valueFromHash) => {
        if(valueFromHash === null || valueFromHash === undefined) {
            return defaultValue;
        } // else:
        try {
            return JSON.parse(valueFromHash);
        } catch(e) {
            return defaultValue;
        }
    }
}

export default function useFragmentState(key, fromString, toString) {
    /* similar to useState() hook, but stores the state in the fragment identifier
     * of the URL as well.
     *
     * The optional functions `fromString` and `toString` can be supplied
     * to customize the conversion from/to the string stored in the URL-hash.
     * By default it output/parses JSON.
     *
     * if `fromString` is not a function, it's considered a default value.
     */
    if(typeof fromString !== 'function') {  // defaultValue or undefined
        const defaultValue = fromString;
        fromString = jsonParseWithDefault(defaultValue);
    }
    if(toString === undefined) {
        toString = JSON.stringify;
    }

    const [value, setValue] = useState(fromString(getValueFromHash(key)));

    const onSetValue = useCallback(  // Re-use same callback for same key
        newValue => {
            setValue(newValue);
            updateHashValue(key, toString(newValue));
        },
        [key]
    );

    return [value, onSetValue];
}

export function addStateProperty(obj, attrName, defaultValue) {
    /* Add a property to access a state variable through the `attrName` getter & setter
     */
    if(!('state' in obj)) obj.state = {};
    obj.state[attrName] = defaultValue;
    Object.defineProperty(obj, attrName, {
        get() {
            return this.state[attrName];
        },
        set(newValue) {
            this.setState({[attrName]: newValue});
        }
    })
}

export function addFragmentStateProperty(obj, attrName, key, fromString, toString) {
    /* Add a property to access a state variable through the `attrName` getter & setter.
     * The state is also synced to the URL fragment identifier (hash) under the key `key`.
     * Conversion from hash is done by `fromString(str)`, conversion to hash by `toString(value)`.
     */
    if(typeof fromString !== 'function') {  // defaultValue or undefined
        const defaultValue = fromString;
        fromString = jsonParseWithDefault(defaultValue);
    }
    if(toString === undefined) {
        toString = JSON.stringify;
    }

    if(!('state' in obj)) obj.state = {};
    obj.state[attrName] = fromString(getValueFromHash(key));
    Object.defineProperty(obj, attrName, {
        get() {
            return this.state[attrName];
        },
        set(newValue) {
            this.setState({[attrName]: newValue});
            updateHashValue(key, toString(newValue));
        },
    });
}
