import FormattedInput, {FormattedInputProps} from "formattedInput";

export type Seconds = number

export function splitSecondsToYdhms(sec: Seconds): [number, number, number, number, number] {
    const s = sec % 60; sec = (sec - s) / 60;
    const m = sec % 60; sec = (sec - m) / 60;
    const h = sec % 6; sec = (sec - h) / 6;
    const d = sec % 426; sec = (sec - d) / 426;
    const y = sec;
    return [y, d, h, m, s];
}
export function formatValueYdhms(seconds: Seconds): string {
    if(isNaN(seconds)) return 'NaN';

    let values: any[] = splitSecondsToYdhms(seconds);
    let units: string[] = ['y', 'd', 'h', 'm', 's'];

    values[4] = values[4].toFixed(1);
    while(values[0] === 0) {
        values = values.slice(1);
        units = units.slice(1);
    }
    while(values[values.length-1] === 0 || values[values.length-1] === "0.0") {
        values = values.slice(0, values.length-1);
        units = units.slice(0, units.length-1);
    }

    if(values.length === 0) return "0";
    const parts = values.map((v, i) => '' + v + units[i]);
    return parts.join(' ');
}
export function parseToYdhms(text: string): [number, number, number, number, number] {
    const re = /^((?<y>\d+) *y)? *((?<d>\d+) *d)? *((?<h>\d+) *h)? *((?<m>\d+) *m)? *((?<s>\d+(.\d*)?) *s?)?$/;
    const match = re.exec(text);
    if(match === null) return undefined;
    const i : {y?: number, d?: number, h?: number, m?: number, s?: number} = {};
    for(const unit of ['y', 'd', 'h', 'm']) {
        i[unit] = parseInt(match.groups[unit]) || 0;
    }
    i.s = parseFloat(match.groups.s) || 0.;
    return [i.y, i.d, i.h, i.m, i.s];
}
export function parseValueYdhms(text: string | number): Seconds {
    if(text === Infinity || text === "∞") return Infinity;

    try {
        const [y, d, h, m, s] = parseToYdhms('' + text);
        return (((((y * 426) + d) * 6 + h) * 60 + m) * 60) + s;
    } catch {
        return 0;
    }
}
export function KerbalYdhmsInput(props: Omit<FormattedInputProps<Seconds>, "formatValue" | "parseString">) {
    const formatedInputProps = Object.assign({}, props, {
        formatValue: formatValueYdhms,
        parseString: parseValueYdhms,
        className: (props.className || '') + ' KerbalYdhmsInput',
    });
    return FormattedInput(formatedInputProps);
}

export function formatValueYdhmsAbs(seconds: Seconds): string {
    let [y, d, h, m, s] = splitSecondsToYdhms(seconds);
    return `Y${y+1}, ` +
        `D${d+1}, ` +
        `${h.toString().padStart(2, '0')}` +
        `:${m.toString().padStart(2, '0')}` +
        `:${s.toFixed(1).padStart(4, '0')}`;
}
export function parseToYdhmsAbs(text: string): [number, number, number, number, number] {
    const re = /^[Yy] *((?<y>\d+)) *,? *[Dd]( *(?<d>\d+)) *,? *((?<h>\d+)):((?<m>\d+)):((?<s>\d+(.\d*)?))$/;
    const match = re.exec(text);
    if(match === null) return undefined;
    const i : {y?: number, d?: number, h?: number, m?: number, s?: number} = {};
    for(const unit of ['y', 'd', 'h', 'm']) {
        i[unit] = parseInt(match.groups[unit]) || 0;
    }
    i.s = parseFloat(match.groups.s) || 0.;
    return [i.y, i.d, i.h, i.m, i.s];
}
export function parseValueYdhmsAbs(text: string | number): Seconds {
    try {
        const [y, d, h, m, s] = parseToYdhmsAbs('' + text);
        return ((((((y-1) * 426) + (d-1)) * 6 + h) * 60 + m) * 60) + s;
    } catch {
        return 0;
    }
}
export function KerbalAbsYdhmsInput(props: Omit<FormattedInputProps<Seconds>, "formatValue" | "parseString">) {
    const formatedInputProps = Object.assign({}, props, {
        formatValue: formatValueYdhmsAbs ,
        parseString: parseValueYdhmsAbs,
        className: (props.className || '') + ' KerbalAbsYdhmsInput',
    });
    return FormattedInput(formatedInputProps);
}

export type Degrees = number

export function formatValueDegrees(value: Degrees | null): string {
    if(value == null) return "";
    return (value / Math.PI * 180).toFixed(1);
}
export function parseValueDegrees(
    rawText: string | number,
    {emptyValue = 0}: {emptyValue?: Degrees} = {}
): Degrees {
    if(typeof rawText === 'number') return rawText;
    if(rawText === "" || rawText === undefined) return emptyValue;

    const f = parseFloat(rawText);
    if(isNaN(f)) return undefined;
    const rad = f / 180. * Math.PI;
    return rad % (2 * Math.PI);
}
export interface DegreesInputProps {
    emptyValue?: Degrees
}
export function DegreesInput(props: Omit<FormattedInputProps<Degrees>, "formatValue" | "parseString"> & DegreesInputProps) {
    const formattedInputProps = Object.assign({}, props, {
        formatValue: formatValueDegrees,
        parseString: s => parseValueDegrees(s, {
            emptyValue: props.emptyValue,
        }),
        className: (props.className || '') + ' DegreesInput',
    })
    return FormattedInput(formattedInputProps);
}
