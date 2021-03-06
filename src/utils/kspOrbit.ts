import {bodies} from "./kspBody";
import Orbit from "./orbit";

export const orbits = {
    'Moho': Orbit.FromOrbitalElements(bodies['Kerbol'].gravity,
        {sma: 5_263_138_304, e: 0.2, argp: 15/180*Math.PI, inc: 7/180*Math.PI, lon_an: 70/180*Math.PI},
        {ma0: 3.14}),
    'Eve': Orbit.FromOrbitalElements(bodies['Kerbol'].gravity,
        {sma: 9_832_684_544, e: 0.01, argp: 0, inc: 2.1/180*Math.PI, lon_an: 15/180*Math.PI},
        {ma0: 3.14}),
    'Gilly': Orbit.FromOrbitalElements(bodies['Eve'].gravity,
        {sma: 31_500_000, e: 0.55, argp: 10/180*Math.PI, inc: 12/180*Math.PI, lon_an: 80/180*Math.PI},
        {ma0: 0.9}),
    'Kerbin': Orbit.FromOrbitalElements(bodies['Kerbol'].gravity,
        {sma: 13_599_840_256, e: 0, argp: 0, inc: 0, lon_an: 0},
        {ma0: 3.14}),
    'Mun': Orbit.FromOrbitalElements(bodies['Kerbin'].gravity,
        {sma: 12_000_000, e: 0, argp: 0, inc: 0, lon_an: 0},
        {ma0: 1.7}),
    'Minmus': Orbit.FromOrbitalElements(bodies['Kerbin'].gravity,
        {sma: 47_000_000, e: 0, argp: 38/180*Math.PI, inc: 6/180*Math.PI, lon_an: 78/180*Math.PI},
        {ma0: 0.9}),
    'Duna': Orbit.FromOrbitalElements(bodies['Kerbol'].gravity,
        {sma: 20_726_155_264, e: 0.051, argp: 0, inc: 0.06/180*Math.PI, lon_an: 135.5/180*Math.PI},
        {ma0: 3.14}),
    'Ike': Orbit.FromOrbitalElements(bodies['Duna'].gravity,
        {sma: 3_200_000, e: 0.03, argp: 0, inc: 0.2/180*Math.PI, lon_an: 0},
        {ma0: 1.7}),
    'Dres': Orbit.FromOrbitalElements(bodies['Kerbol'].gravity,
        {sma: 40_839_348_203, e: 0.145, argp: 90/180*Math.PI, inc: 5/180*Math.PI, lon_an: 280/180*Math.PI},
        {ma0: 3.14}),
    'Jool': Orbit.FromOrbitalElements(bodies['Kerbol'].gravity,
        {sma: 68_773_560_320, e: 0.05, argp: 0, inc: 1.304/180*Math.PI, lon_an: 52/180*Math.PI},
        {ma0: 0.1}),
    'Laythe': Orbit.FromOrbitalElements(bodies['Jool'].gravity,
        {sma: 27_184_000, e: 0, argp: 0, inc: 0, lon_an: 0},
        {ma0: 3.14}),
    'Vall': Orbit.FromOrbitalElements(bodies['Jool'].gravity,
        {sma: 43_152_000, e: 0, argp: 0, inc: 0, lon_an: 0},
        {ma0: 0.9}),
    'Tylo': Orbit.FromOrbitalElements(bodies['Jool'].gravity,
        {sma: 68_500_000, e: 0, argp: 0, inc: 0.025/180*Math.PI, lon_an: 0},
        {ma0: 3.14}),
    'Bop': Orbit.FromOrbitalElements(bodies['Jool'].gravity,
        {sma: 128_500_000, e: 0.235, argp: 25/180*Math.PI, inc: 15/180*Math.PI, lon_an: 10/180*Math.PI},
        {ma0: 0.9}),
    'Pol': Orbit.FromOrbitalElements(bodies['Jool'].gravity,
        {sma: 179_890_000, e: 0.171, argp: 15/180*Math.PI, inc: 4.25/180*Math.PI, lon_an: 2/180*Math.PI},
        {ma0: 0.9}),
    'Eeloo': Orbit.FromOrbitalElements(bodies['Kerbol'].gravity,
        {sma: 90_118_820_000, e: 0.26, argp: 260/180*Math.PI, inc: 6.15/180*Math.PI, lon_an: 50/180*Math.PI},
        {ma0: 3.14}),
};
