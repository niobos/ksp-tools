export function arrayInsertElement<T>(arr: T[], element: T, pos?: number): T[] {
    /* insert `element` into `arr` at position `pos` (default: end)
     */
    if(pos === undefined) pos = arr.length;
    return [
        ...arr.slice(0, pos),
        element,
        ...arr.slice(pos),
    ];
}

export function arrayRemoveElement<T>(arr: T[], index: number): T[] {
    /* Delete element `index` from `arr`
     */
    return [
        ...arr.slice(0, index),
        ...arr.slice(index + 1),
    ];
}

export function arrayReplaceElement<T>(arr: T[], pos: number, newElement: T): T[] {
    /* In array `arr`, change element at position `pos` to `newElement`
     */
    return [
        ...arr.slice(0, pos),
        newElement,
        ...arr.slice(pos+1),
    ];
}

export function arrayMoveElement<T>(arr: T[], pos: number, offset: number): T[] {
    /* Mov element arr[pos] to be at arr[pos+offset]
     * When offset would move the element past the end of the array,
     * the element is placed at the end (or the beginning)
     */
    const el = arr[pos]
    return arrayInsertElement(
        arrayRemoveElement(arr, pos),
        el,
        pos + offset,
    )
}