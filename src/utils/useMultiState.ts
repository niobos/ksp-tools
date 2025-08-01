import {useCallback, useState} from 'react';

export default function useMultiState<T>(
    states: Array<[T, (value: T) => void]>,
    defaultValue: T,
    unsetValue = null,
): [T, (value: T) => void] {
    /* Similar to useState(), but tries to read state from multiple places,
     * and store in multiple places.
     *
     * A particular state should return the `unsetValue` (defaults to `null`)
     * to indicate it has no value, the next state's value will be used in that case.
     * The first state that returns a non-unsetValue value wins.
     *
     * You can use a Symbol() if `null` would be a valid return from a state.
     *
     * setValue always saves to all locations.
     */

    let value: T = unsetValue
    for(const [v, _] of states) {
        if(v !== unsetValue) {
            value = v
            break
        }
    }
    if(value === unsetValue) value = defaultValue

    const [reactValue, setReactValue] = useState<T>(value)

    const setValue = useCallback(  // Re-use same callback for same key
        newValue => {
            setReactValue(newValue)
            for(const [_, s] of states) {
                s(newValue)
            }
        },
        [],
    )

    return [reactValue, setValue]
}
