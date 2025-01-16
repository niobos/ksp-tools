import {useCallback, useRef} from "react";

export default function useThrottled(callback, limit: number) {
    const lastCallRef = useRef(0)
    const throttledCallback = useCallback((...args) => {
        const now = Date.now()
        if (now - lastCallRef.current >= limit) {
            lastCallRef.current = now
            callback(...args)
        }
    }, [callback, limit])
    return throttledCallback
}
