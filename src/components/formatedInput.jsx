import React from "react";

function equalNaNCompatible(a, b) {
    /* Return true if a === b,
     * but also if both a and b are NaN
     */
    if(isNaN(a) && isNaN(b)) return true;
    return a === b;
}

export default class FormattedInput extends React.PureComponent {
    static defaultProps = {
        // value: ...
        onChange: (newValue) => undefined,  // User is changing input: (newValue) => ...
        onBlur: (finalValue) => undefined,  // User has done changing input: (finalValue) => ...
        style: {},  // style passed straight through
        styleFunc: (value) => {},  // style based on value
        className: [],  // additional className's passed straight through
        classNameFunc: (value) => [],  // className's based on value
        disabled: false,  // Is the input field disabled?
    }

    constructor(props) {
        super(props);
        const value = this.constructor.parseInput(this.props.value, this.props);
        const text = this.constructor.formatValue(value, this.props);
        this.state = {text, value};
    }

    static parseInput(in_text, props) {
        // To override
        return parseFloat(in_text);
    }

    static formatValue(value, props) {
        // To override
        return '' + value;
    }

    onChange(e) {
        const rawText = e.target.value;
        this.setState({text: rawText});

        let value = this.constructor.parseInput(rawText, this.props);
        if(value !== undefined) {
            this.setState({value: value});
        }
    }

    onBlur(e) {
        const rawText = e.target.value;
        let value = this.constructor.parseInput(rawText, this.props);
        if(value === undefined) value = 0;
        const formattedText = this.constructor.formatValue(value, this.props);
        this.setState({
            text: formattedText,
            value: value,
        });
        this.props.onBlur(this.state.value);
    }

    componentDidUpdate(prevProps, prevState) {
        if(!equalNaNCompatible(prevProps.value, this.props.value)
            && !equalNaNCompatible(this.props.value, this.state.value)
        ) {
            //console.log(`[${this._reactInternals.key}] New value pushed down: old_value=`, prevProps.value, " new_value=", this.props.value, " state_value=", this.state.value);
            const value = this.constructor.parseInput(this.props.value, this.props);
            const text = this.constructor.formatValue(value, this.props)
            this.setState({ text, value });
            // will trigger re-render and re-call this method

        } else if(!equalNaNCompatible(prevState.value, this.state.value)
            && !equalNaNCompatible(this.state.value, this.props.value)
        ) {
            //console.log(`[${this._reactInternals.key}] User input changed, propagating: old_value=`, prevState.value, " new_value=", this.state.value, " props_value=", this.props.value);
            this.props.onChange(this.state.value);
        }
    }

    render() {
        const style = {
            textAlign: 'right',
        };
        Object.assign(style, this.props.style);
        Object.assign(style, this.props.styleFunc(this.state.value));
        const className = [].concat(
            this.props.className,
            this.props.classNameFunc(this.state.value),
        );

        return <input
            style={style}
            className={className}
            type="text"
            value={this.state.text}
            onChange={(e) => this.onChange(e)}
            onBlur={(e) => this.onBlur(e)}
            readOnly={this.props.onChange === undefined}
            disabled={this.props.disabled}
        />;
    }
}

export class FloatInput extends FormattedInput {
    static defaultProps = {
        ...FormattedInput.defaultProps,
        decimals: 3,
    }

    static parseInput(text, props) {
        const f = parseFloat(text);
        if(isNaN(f)) return 0;  // Needed to parse "." when starting to type ".5"
        return parseFloat(text);
    }

    static formatValue(value, props) {
        return value.toFixed(props.decimals);
    }
}

export class SiInput extends FormattedInput {
    static defaultProps = {
        ...FormattedInput.defaultProps,
        significantDigits: 3,
    }

    static formatValue(value, props) {
        const {significantDigits = 3} = props || {};

        // Based on https://github.com/ThomWright/format-si-prefix/blob/master/src/index.js MIT licensed
        const PREFIXES = {
            '24': 'Y',
            '21': 'Z',
            '18': 'E',
            '15': 'P',
            '12': 'T',
            '9': 'G',
            '6': 'M',
            '3': 'k',
            '0': '',
            '-3': 'm',
            '-6': 'µ',
            '-9': 'n',
            '-12': 'p',
            '-15': 'f',
            '-18': 'a',
            '-21': 'z',
            '-24': 'y'
        };
        if (value === 0) {
            return "0";
        }
        let sig = Math.abs(value); // significand
        let exponent = 0;
        while (sig >= 1000 && exponent < 24) {
            sig /= 1000;
            exponent += 3;
        }
        while (sig < 1 && exponent > -24) {
            sig *= 1000;
            exponent -= 3;
        }

        const signPrefix = value < 0 ? '-' : '';
        if (sig > 1000) { // exponent == 24
            // significand can be arbitrarily long
            return signPrefix + sig.toFixed(0) + ' ' + PREFIXES[exponent];
        }
        return signPrefix + parseFloat(sig.toPrecision(significantDigits)) + ' ' + PREFIXES[exponent];
    }

    static parseInput(text) {
        const re = /^\s*(?<sign>[+-]?)(?<int_part>[0-9 ]*)(?:[.,](?<frac_part>[0-9 ]*))?([eE](?<exp_part>[+-]?\d+))? *(?<prefix>[EPTGMkmuµnpfa])?\s*$/
        const match = re.exec(text);
        if(match === null) return undefined;

        let sign = match.groups['sign'];
        let int_part = match.groups['int_part'] || "0";
        let frac_part = match.groups['frac_part'] || "0";
        let exp_part = match.groups['exp_part'] || "0";
        let prefix = match.groups['prefix'] || "";

        int_part = int_part.replace(' ', '');
        frac_part = frac_part.replace(' ', '');
        exp_part = exp_part.replace(' ', '');

        sign = (sign === '-' ? -1 : 1);
        int_part = parseInt(int_part);
        frac_part = parseFloat("0." + frac_part);
        exp_part = parseInt(exp_part);
        if(prefix === "") {
            // Do nothing
        } else {
            //         0123456789012
            const i = "EPTGMkmuµnpfa".indexOf(prefix);
            if(i <= 5) exp_part += 3*(6-i);
            else exp_part -= 3*(i-5);
        }

        return sign*(int_part + frac_part)*Math.pow(10, exp_part);
    }
}

export class KerbalYdhmsInput extends FormattedInput {
    static parseInput(text) {
        const re = /^((?<y>\d+) *y)? *((?<d>\d+) *d)? *((?<h>\d+) *h)? *((?<m>\d+) *m)? *((?<s>\d+(.\d*)?) *s?)?$/;
        const match = re.exec(text);
        if(match === null) return undefined;
        const i = {};
        for(const unit of ['y', 'd', 'h', 'm']) {
            i[unit] = parseInt(match.groups[unit]) || 0;
        }
        i.s = parseFloat(match.groups.s) || 0.;
        return (((((i.y*426) + i.d)*6 + i.h)*60 + i.m)*60) + i.s;
    }

    static formatValueYdhms(sec) {
        const s = sec % 60; sec = (sec - s) / 60;
        const m = sec % 60; sec = (sec - m) / 60;
        const h = sec % 6; sec = (sec - h) / 6;
        const d = sec % 426; sec = (sec - d) / 426;
        const y = sec;

        let values = [y, d, h, m, s.toFixed(1)];
        let units = ['y', 'd', 'h', 'm', 's'];
        while(values[0] === 0) {
            values = values.slice(1);
            units = units.slice(1);
        }
        while(values[values.length-1] === 0 || values[values.length-1] === "0.0") {
            values = values.slice(0, values.length-1);
            units = units.slice(0, units.length-1);
        }

        const parts = values.map((v, i) => '' + v + units[i]);
        return parts.join(' ');
    }

    static formatValueSingleUnit(sec) {
        const factors = [60, 60, 6, 426];
        const units = ['s', 'm', 'h', 'd'];
        while(sec >= factors[0]) {
            sec /= factors[0];
            units.shift();
            factors.shift();
        }
        return sec.toFixed(1) + units[0];
    }

    static formatValue(sec, props) {
        if(props === undefined) props = {};

        if(sec === undefined) return "undefined";
        if(sec === null) return "null";
        if(isNaN(sec)) return "NaN";
        if(sec === 0) return "0s";

        if(props.singleUnit) {
            return this.formatValueSingleUnit(sec);
        } else {
            return this.formatValueYdhms(sec);
        }
    }
}
