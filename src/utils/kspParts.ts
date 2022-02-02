import {Data} from "dataclass";

export class Resources extends Data {
    static price = {
        'lf': 0.8,
        'ox': 0.16,
        'sf': 0.6,
        'mono': 1.2,
        'xe': 4.0,
        'el': 0,
        'ore': 0.02,
    };
    static mass = {
        'lf': 0.005,
        'ox': 0.005,
        'sf': 0.0075,
        'mono': 0.004,
        'xe': 0.0001,
        'el': 0,
        'ore': 0.010,
    };

    lf: number = 0;
    ox: number = 0;
    air: number = 0;
    mono: number = 0;
    sf: number = 0;
    xe: number = 0;
    el: number = 0;
    ore: number = 0;

    get mass() {
        let m = 0;
        for(let resource in Resources.mass) {
            m += this[resource] * Resources.mass[resource];
        }
        return m;
    }

    get cost() {
        let m = 0;
        for(let resource in Resources.price) {
            m += this[resource] * Resources.price[resource];
        }
        return m;
    }

    scaled(factor: number): Resources {
        return Resources.create({
            lf: this.lf * factor,
            ox: this.ox * factor,
            air: this.air * factor,
            mono: this.mono * factor,
            sf: this.sf * factor,
            xe: this.xe * factor,
            el: this.el * factor,
            ore: this.ore * factor,
        })
    }
}

export class Size {
    // https://wiki.kerbalspaceprogram.com/wiki/Radial_size
    static readonly TINY = new Size('TINY', 'T', 'Tiny (.625m)');
    static readonly SMALL = new Size('SMALL', 'S/Mk1', 'Small/Mk1 (1.25m)');
    static readonly MEDIUM = new Size('MEDIUM', 'M', 'Medium (1.875m)');
    static readonly LARGE = new Size('LARGE', 'L', 'Large (2.5m)');
    static readonly EXTRA_LARGE = new Size('EXTRA_LARGE', 'XL', 'Extra Large (3.75m)');
    static readonly HUGE = new Size('HUGE', 'H', 'Huge (5m)');
    static readonly MK2 = new Size('MK2', 'Mk2', 'Mk2');
    static readonly MK3 = new Size('MK3', 'Mk3', 'Mk3 (3.75m)');
    static readonly RADIAL = new Size('RADIAL', 'R', 'Radial mounted');

    private constructor(
        public readonly key: string,
        public readonly shortDescription: string,
        public readonly longDescription: string
    ) {}
}

export default class Part extends Data {
    cost: number;
    mass: number;
    size: Set<Size>;
    content: Resources = Resources.create();
    consumption: Resources = Resources.create();
    wikiUrl: string = undefined;

    emptied() {
        let {cost, mass, content} = this;
        for(const resource in Resources.price) {
            cost -= this.content[resource] * Resources.price[resource];
            mass -= this.content[resource] * Resources.mass[resource];
            content = content.copy({[resource]: 0});
        }
        // @ts-ignore
        return this.copy({
            cost,
            mass,
            content,
        });
    }
}
