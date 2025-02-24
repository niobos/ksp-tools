import {bodiesHierFind} from "./kspBody";

describe('hierarchical bodies', () => {
    it('should find Minmus', () => {
        const loc = bodiesHierFind('Minmus');
        expect(loc).toEqual(['Kerbol', 'Kerbin', 'Minmus']);
    });
    it('should find Dres', () => {
        const loc = bodiesHierFind('Dres');
        expect(loc).toEqual(['Kerbol', 'Dres']);
    });
});
