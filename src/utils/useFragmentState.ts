/* Inspired by https://medium.com/swlh/using-react-hooks-to-sync-your-component-state-with-the-url-query-string-81ccdfcb174f
 */

import {useCallback, useState} from 'react';

function getHash(): URLSearchParams {
    let hash = window.location.hash;  // strip leading #
    if(hash.length > 1) hash = hash.substring(1);  // remove leading #
    return new URLSearchParams(hash);
}

export function getValueFromHash(key: string, defaultValue?: string): string {
    const params = getHash();
    const value = params.get(key);
    if(value === null || value === undefined) return defaultValue;
    try {
        return value;
    } catch (e) {
        return defaultValue;
    }
}

export function updateHashValue(key: string, value: string): void {
    const params = getHash();
    params.set(key, value);
    history.replaceState({}, '', '#' + params.toString());
}

export function jsonParseWithDefault(defaultValue: string): (value: string) => any {
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

export default function useFragmentState(
    key: string,
    fromString: any | ((value: string) => any),
    toString?: (value: any) => string,
): [any, (value: any) => void] {
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

type hasState = {
    state: object
}

export function addStateProperty(obj: hasState, attrName: string, defaultValue: any): void {
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

export function addFragmentStateProperty(
    obj: hasState,
    attrName: string,
    key: string,
    fromString: (value: string) => any,
    toString?: (value: any) => string,
): void {
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
