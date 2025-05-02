export function randomNormal2(): [number, number] {
    /* Returns 2 normally distributed random numbers
     */
    /* Sources:
     *  - https://stackoverflow.com/a/36481059
     *  - https://mika-s.github.io/javascript/random/normal-distributed/2019/05/15/generating-normally-distributed-random-numbers-in-javascript.html
     */
    const u = 1 - Math.random() // Converting [0,1) to (0,1]
    const v = Math.random()
    const z1 = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
    const z2 = Math.sqrt( -2.0 * Math.log( u ) ) * Math.sin( 2.0 * Math.PI * v )
    return [z1, z2]
}

let randomNormal2Buffer: null | number = null
export function randomNormal(): number {
    /* Returns a normally distributed random number.
     * I.e. mean 0, stdev 1, unbounded
     */
    if(randomNormal2Buffer == null) {
        const [z1, z2] = randomNormal2()
        randomNormal2Buffer = z2
        return z1
    }
    const z = randomNormal2Buffer
    randomNormal2Buffer = null
    return z
}


let randomBoolBuffer: boolean[] = []
export function randomBool(): boolean {
    /* Returns a random bit, 50/50 true/false
     */
    if(randomBoolBuffer.length == 0) {
        const r = Math.random()  // returns a 64-bit IEEE 754 float
        // r contains 52 bits of randomness in its mantissa, extract these
        const bits = Math.floor(r * 2**52).toString(2).padStart(52, "0")
        randomBoolBuffer = bits.split('').map(s => s == '1')
    }
    return randomBoolBuffer.shift()
}
