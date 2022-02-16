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

export interface AdjustableListProps {
    value: any
    onChange: (any) => null
}
export interface AdjustableListState {

}

export default class AdjustableList<
        TProps extends AdjustableListProps = AdjustableListProps,
        TState extends AdjustableListState = AdjustableListState
    > extends React.PureComponent<TProps, TState> {
    props: AdjustableListProps

    static defaultProps = {
        value: [],
        onChange: (newValue) => null,
    }

    constructor(props) {
        super(props);
    }

    onAdd(element, index?: number): void {
        const newValue = arrayInsertElement(this.props.value, element, index);
        this.props.onChange(newValue);
    }
    onDelete(index: number): void {
        const newValue = arrayRemoveElement(this.props.value, index);
        this.props.onChange(newValue);
    }
    onChange(index: number, newElement): void {
        const newValue = arrayReplaceElement(this.props.value, index, newElement);
        this.props.onChange(newValue);
    }
}
