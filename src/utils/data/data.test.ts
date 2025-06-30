import {Data} from './data'

test('create', () => {
    class C extends Data {
        a: string
        b: number
        c?: number

        _postCreate() {
            if(this.c == null) this.c = this.b
        }

        meth(): number { return this.c }
    }

    const c = C.create({a: "1", b: 2})
    expect(c.meth()).toEqual(2)
    const d = C.create({a: "1", b: 2, c: 3})
    expect(d.meth()).toEqual(3)
})
