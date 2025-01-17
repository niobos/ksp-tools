import {useCallback, useRef} from "react";

export default function useThrottled<TParams extends any[]>(
    callback: (...args: TParams) => void,
    limit: number
): (...args: TParams) => void {
    const lastCallRef = useRef(0)
    const throttledCallback = useCallback((...args: TParams) => {
        const now = Date.now()
        if (now - lastCallRef.current >= limit) {
            lastCallRef.current = now
            callback(...args)
        }
    }, [callback, limit])
    return throttledCallback
}
