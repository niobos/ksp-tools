import {bodiesHierFind} from "./kspBody";

describe('hierarchical bodies', () => {
    it('should find Minmus', () => {
        const loc = bodiesHierFind('Minmus');
        expect(loc).toEqual(['Kerbol', 'Kerbin', 'Minmus']);
    });
});