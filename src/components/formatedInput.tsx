import React from "react";

function equalNaNCompatible(a: number, b: number): boolean {
    /* Return true if a === b,
     * but also if both a and b are NaN
     */
    if(isNaN(a) && isNaN(b)) return true;
    return a === b;
}

interface FormattedInputProps {
    value: any
    onChange?: (newValue: number) => void
    onBlur?: (finalValue: number) => void
    style?: object
    styleFunc?: (value: number) => object
    className?: string[]
    classNameFunc?: (value: number) => string[]
    disabled?: boolean
    placeholder?: string
}

interface FormattedInputState {
    text: string
    value: number
}

export default class FormattedInput<TProps extends FormattedInputProps>
        extends React.PureComponent<TProps, FormattedInputState> {
    props: TProps
    state: FormattedInputState
    setState: (object) => void

    static defaultProps = {
        // value: ...
        onChange: () => null,  // User is changing input: (newValue) => ...
        onBlur: () => null,  // User has done changing input: (finalValue) => ...
        style: {},  // style passed straight through
        styleFunc: () => {},  // style based on value
        className: [],  // additional className's passed straight through
        classNameFunc: () => [],  // className's based on value
        disabled: false,  // Is the input field disabled?
        placeholder: "",  // placeholder when undefined
    }

    constructor(props: TProps) {
        super(props);
        const value = this.parseInput(this.props.value);
        const text = this.formatValue(value);
        this.state = {text, value};
    }

    parseInput(rawText: string): number {
        // To override
        return parseFloat(rawText);
    }

    formatValue(value: number): string {
        // To override
        return '' + value;
    }

    onChange(e): void {
        const rawText = e.target.value;
        this.setState({text: rawText});

        let value = this.parseInput(rawText);
        if(value !== undefined) {
            this.setState({value: value});
        }
    }

    onBlur(e): void {
        const rawText = e.target.value;
        let value = this.parseInput(rawText);
        if(value === undefined) value = 0;
        const formattedText = this.formatValue(value);
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
            const value = this.parseInput(this.props.value);
            const text = this.formatValue(value)
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
            [this.constructor.name],
        );

        return <input
            style={style}
            className={className.join(' ')}
            type="text"
            value={this.state.text}
            placeholder={this.props.placeholder}
            onChange={(e) => this.onChange(e)}
            onBlur={(e) => this.onBlur(e)}
            readOnly={this.props.onChange === undefined}
            disabled={this.props.disabled}
        />;
    }
}

interface FloatInputProps extends FormattedInputProps {
    decimals?: number
}

export class FloatInput<TProps extends FloatInputProps>
        extends FormattedInput<TProps> {
    static defaultProps = {
        ...FormattedInput.defaultProps,
        decimals: 3,
    }

    parseInput(rawText: string): number {
        const f = parseFloat(rawText);
        if(isNaN(f)) return 0;  // Needed to parse "." when starting to type ".5"
        return parseFloat(rawText);
    }

    formatValue(value: number): string {
        return value.toFixed(this.props.decimals);
    }
}

interface SiInputProps extends FormattedInputProps {
    significantDigits?: number
    emptyValue?: number | null
}

export class SiInput
        extends FormattedInput<SiInputProps> {
    static defaultProps = {
        ...FormattedInput.defaultProps,
        significantDigits: 3,
        emptyValue: 0,  // value when input is empty
    }

    static format(value: number, significantDigits: number = 3): string {
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
        if(value === null) return "";
        if(value === 0) return "0";
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

    formatValue(value: number): string {
        const {significantDigits = 3} = this.props || {};
        return SiInput.format(value, significantDigits);
    }

    parseInput(rawText: string | undefined): number {
        if(rawText === "" || rawText === undefined) return this.props.emptyValue;

        const re = /^\s*(?<sign>[+-]?)(?<int_part>[0-9 ]*)(?:[.,](?<frac_part>[0-9 ]*))?([eE](?<exp_part>[+-]?\d+))? *(?<prefix>[EPTGMkmuµnpfa])?\s*$/
        const match = re.exec(rawText);
        if(match === null) return undefined;

        const sign_s = match.groups['sign'];
        let int_part_s = match.groups['int_part'] || "0";
        let frac_part_s = match.groups['frac_part'] || "0";
        let exp_part_s = match.groups['exp_part'] || "0";
        const prefix_s = match.groups['prefix'] || "";

        int_part_s = int_part_s.replace(' ', '');
        frac_part_s = frac_part_s.replace(' ', '');
        exp_part_s = exp_part_s.replace(' ', '');

        const sign = (sign_s === '-' ? -1 : 1);
        const int_part = parseInt(int_part_s);
        const frac_part = parseFloat("0." + frac_part_s);
        let exp_part = parseInt(exp_part_s);
        if(prefix_s === "") {
            // Do nothing
        } else {
            //         0123456789012
            const i = "EPTGMkmuµnpfa".indexOf(prefix_s);
            if(i <= 5) exp_part += 3*(6-i);
            else exp_part -= 3*(i-5);
        }

        return sign*(int_part + frac_part)*Math.pow(10, exp_part);
    }
}

interface KerbalYdhmsInputProps extends FormattedInputProps {
    singleUnit?: boolean
}

export class KerbalYdhmsInput
        extends FormattedInput<KerbalYdhmsInputProps> {
    parseInput(rawText): number {
        if(rawText === Infinity || rawText === "∞") return Infinity;

        const re = /^((?<y>\d+) *y)? *((?<d>\d+) *d)? *((?<h>\d+) *h)? *((?<m>\d+) *m)? *((?<s>\d+(.\d*)?) *s?)?$/;
        const match = re.exec(rawText);
        if(match === null) return undefined;
        const i : {y?: number, d?: number, h?: number, m?: number, s?: number} = {};
        for(const unit of ['y', 'd', 'h', 'm']) {
            i[unit] = parseInt(match.groups[unit]) || 0;
        }
        i.s = parseFloat(match.groups.s) || 0.;
        return (((((i.y*426) + i.d)*6 + i.h)*60 + i.m)*60) + i.s;
    }

    static formatValueYdhms(sec: number): string {
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

    static formatValueSingleUnit(sec: number): string {
        const factors = [60, 60, 6, 426];
        const units = ['s', 'm', 'h', 'd'];
        while(sec >= factors[0]) {
            sec /= factors[0];
            units.shift();
            factors.shift();
        }
        return sec.toFixed(1) + units[0];
    }

    formatValue(sec: number): string {
        if(sec === undefined) return "undefined";
        if(sec === null) return "null";
        if(isNaN(sec)) return "NaN";
        if(sec === 0) return "0s";
        if(sec === Infinity) return "∞";

        if(this.props.singleUnit) {
            return (this.constructor as typeof KerbalYdhmsInput).formatValueSingleUnit(sec);
        } else {
            return (this.constructor as typeof KerbalYdhmsInput).formatValueYdhms(sec);
        }
    }
}