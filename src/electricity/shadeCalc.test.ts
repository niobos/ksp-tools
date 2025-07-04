import {calcShade} from "./shadeCalc"
import kspSystems from "../utils/kspSystems"

const system = kspSystems["Stock"]

it("should work with empty content", () => {
    const shade = calcShade(system, []);
    expect(shade.duration).toEqual(0);
    expect(shade.interval).toEqual(Infinity);
});

it("should work with zero duration item", () => {
    const shade = calcShade(system, [
        {d: 0, i: 7},
    ]);
    expect(shade.duration).toEqual(0);
    expect(shade.interval).toEqual(Infinity);
});

it('should return the single custom', () => {
    const shade = calcShade(system, [
        {d: 5, i: 7},
    ]);
    expect(shade.duration).toEqual(5);
    expect(shade.interval).toEqual(7);
});

it('should calculate nighttime on Kerbin', () => {
    const shade = calcShade(system, [
        {s: 'Kerbin'},
    ]);
    expect(shade.duration).toEqual(3*60*60);
    expect(shade.interval).toEqual(6*60*60);
});

it('should calculate orbital darkness around Kerbin', () => {
    const shade = calcShade(system, [
        {o: 'Kerbin', a: 100_000},
    ]);
    expect(shade.duration).toBeCloseTo(641.8, 1);
    expect(shade.interval).toBeCloseTo(1958.1, 1);
});

it('should combine correctly', () => {
    const shade = calcShade(system, [
        {d: 10, i: 100},
        {d: 30, i: 1000},
    ]);
    expect(shade.duration).toEqual(30);
    expect(shade.interval).toEqual(300);
});
