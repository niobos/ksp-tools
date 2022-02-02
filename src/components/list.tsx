import React from "react";

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

interface AdjustableListProps {
    value: any
    onChange: (any) => null
}

export default class AdjustableList extends React.PureComponent {
    props: AdjustableListProps

    static defaultProps = {
        value: [],
        onChange: (newValue) => null,
    }

    onAdd(element, index) {
        const newValue = arrayInsertElement(this.props.value, element, index);
        this.props.onChange(newValue);
    }
    onDelete(index) {
        const newValue = arrayRemoveElement(this.props.value, index);
        this.props.onChange(newValue);
    }
    onChange(index, newElement) {
        const newValue = arrayReplaceElement(this.props.value, index, newElement);
        this.props.onChange(newValue);
    }
}