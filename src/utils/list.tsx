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
