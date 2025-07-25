/* A set of function related to the rocket equation
 */

export const g0 = 9.80665;  // https://wiki.kerbalspaceprogram.com/wiki/Specific_impulse

export function dvForDm(startMass: number, endMass: number, isp: number): number {
    /* Tsiolkovsky rocket equation
     */
    const ve = isp * g0
    return ve * Math.log(startMass / endMass)
}
export function massAfterDv(startMass: number, dv: number, isp: number): number {
    /* ∆v = Isp * g0 * ln(m0 / mf)
     * => exp( ∆v / (Isp*g0) ) = m0 / mf
     * => mf = m0 / exp( ∆v / (Isp*g0) )
     */
    const ve = isp * g0
    return startMass / Math.exp( dv / ve )
}
export function massBeforeDv(endMass: number, dv: number, isp: number): number {
    /* ∆v = Isp * g0 * ln(m0 / mf)
     * => exp( ∆v / (Isp*g0) ) = m0 / mf
     * => m0 = mf * exp( ∆v / (Isp*g0) )
     */
    const ve = isp * g0
    return endMass * Math.exp(dv / ve)
}

export function dtForDv(dv: number, startMass: number, thrust: number, isp: number): number {
    /* Calculate the time needed to perform a burn given
     *  - the desired ∆v in m/s
     *  - the starting mass in kg
     *  - the (combined) thrust of the engines in N
     *  - the (combined) ISP of the engines in s
     *
     * Starting mass can also be given in tons, if thrust is in kN
     */
    // https://www.reddit.com/r/KerbalAcademy/comments/1oremg/comment/ccuwdmm/
    // https://space.stackexchange.com/a/27376
    const ve = isp * g0
    return startMass * ve / thrust * (1 - Math.exp(-dv/ve))
}
export function dvForDt(dt: number, startMass: number, thrust: number, isp: number): number {
    /* Calculate the resulting ∆v from burning for a given amount of time, given:
     *   - the burn duration in s
     *   - the starting mass in kg
     *   - the (combined) thrust of the engines in N
     *   - the (combined) ISP of the engines in s
     *
     * Starting mass can also be given in tons, if thrust is in kN
     */
    /* https://www.reddit.com/r/KerbalAcademy/comments/1oremg/comment/ccuwdmm/
     * https://space.stackexchange.com/a/27376
     * ∆t = m0 * ve / F * (1 - exp(-∆v/ve))
     * => ∆t * F / (m0 * ve) = 1 - exp(-∆v/ve)
     * => exp(-∆v/ve) = 1 - ∆t * F / (m0 * ve)
     * => -∆v/ve = ln(1 - ∆t * F / (m0 * ve))
     * => ∆v = -ln(1 - ∆t * F / (m0 * ve)) * ve
     */
    const ve = isp * g0
    return -Math.log(1 - dt * thrust / (startMass * ve)) * ve
}

export function thrustFromIspMdot(isp: number, mDot: number): number {
    /* Calculate the engine thrust (in N) from the ISP (in s) and mass flow rate ṁ (dm/dt in kg/s)
     */
    return isp * g0 * mDot
}
