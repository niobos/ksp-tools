import React from "react";
import {bodiesHier} from "../kspBody.js";

export default class KspHierBody extends React.PureComponent {
    static defaultProps = {
        value: 'Kerbin',  // selected body
        customValue: null,  // when non-null, include a disabled custom option with the given name
        onChange: (bodyName) => null,
    }

    render() {
        const options = [];
        let i = 0;

        if(this.props.customValue !== null) {
            options.push(<option key={i++} value="" disabled>{this.props.customValue}</option>);
        }

        for (const system in bodiesHier) {
            if(bodiesHier[system] instanceof Array) {
                const system_bodies = [];
                for (const body of bodiesHier[system]) {
                    system_bodies.push(<option key={i++} value={body}>{body}</option>);
                }
                options.push(<optgroup key={i++} label={system}>{system_bodies}</optgroup>);
            } else {
                const body = bodiesHier[system]
                options.push(<option key={i++} value={body}>{body}</option>);
            }
        }

        return <select
            value={this.props.value}
            onChange={(e) => this.props.onChange(e.target.value)}
        >
            {options}
        </select>;
    }
}
