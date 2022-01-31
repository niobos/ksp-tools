import React from "react";

export default class AdjustableList extends React.PureComponent {
    static defaultProps = {
        value: [],
        onChange: (newValue) => null,
    }

    onAdd(element, index) {
        /* insert `element` into value at location `index` (default: end)
         */
        if(index === undefined) index = this.props.value.length;
        const newValue = [
            ...this.props.value.slice(0, index),
            element,
            ...this.props.value.slice(index),
        ];
        this.props.onChange(newValue);
    }
    onDelete(index) {
        /* Delete element `index` from value
         */
        const newValue = [
            ...this.props.value.slice(0, index),
            ...this.props.value.slice(index+1),
        ];
        this.props.onChange(newValue);
    }
    onChange(index, newElement) {
        /* Change element at `index` with `newElement`
         */
        const newValue = [
            ...this.props.value.slice(0, index),
            newElement,
            ...this.props.value.slice(index+1),
        ];
        this.props.onChange(newValue);
    }
}