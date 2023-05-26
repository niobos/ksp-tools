import Orbit from "../utils/orbit";
import Vector from "../utils/vector";

export type WorkerInput = {
    requestId?: any
    departingPlanetOrbit: Orbit
    parkingOrbitAroundDepartingPlanet: Orbit
    minPeriapsis?: number
    targetPlanetOrbit: Orbit
    targetPlanetGravity: number
    targetPlanetParkingOrbitRadius: number
    targetPlanetSoi: number
    departureAndTravelTimes: [number, number][]
}
export type TransferResult = {
    diveBurnPrn: Vector
    diveOrbit: Orbit
    escapeBurnPrn: Vector
    escapeOrbit: Orbit
    transferOrbit: Orbit
    captureBurnPrn: Vector
    circularizationBurnPrn: Vector
    totalDv: number
}
export type SingleOutput = {
    departureTime: number
    travelTime: number
} & Partial<TransferResult>
export type WorkerOutput = {
    requestId?: any
    result: SingleOutput[]
}


function calcOne(
    departingPlanetOrbit: Orbit,
    parkingOrbitAroundDepartingPlanet: Orbit,
    minDepartingPeriapsis: number | null,
    targetPlanetOrbit: Orbit,
    targetPlanetGravity: number,
    targetParkingOrbitRadius: number,
    targetPlanetSoi: number,
    departureTime: number,
    travelTime: number,
): TransferResult {
    if(travelTime <= 0) return null

    const parkingOrbitAroundDepartingPlanetTaAtStart = parkingOrbitAroundDepartingPlanet.taAtT(departureTime)
    const probePositionAtStart = parkingOrbitAroundDepartingPlanet.positionAtTa(parkingOrbitAroundDepartingPlanetTaAtStart)

    let interplanetaryDepartureTime = departureTime
    let interplanetaryTravelTime = travelTime
    let diveOrbit = null
    if(minDepartingPeriapsis != null) {
        // Dive into planet's gravity well
        diveOrbit = Orbit.FromOrbitalElements(
            parkingOrbitAroundDepartingPlanet.gravity,
            Orbit.smaEFromApsides(probePositionAtStart.norm, minDepartingPeriapsis),
        )

        // Orientation of this orbit still needs to be determined, but we only need the period for now
        const diveTravelTime = diveOrbit.period / 2
        interplanetaryDepartureTime = departureTime + diveTravelTime
        interplanetaryTravelTime = travelTime - diveTravelTime
        if(interplanetaryTravelTime <= 0) return null
    }

    const departingPlanetPositionAtDeparture = departingPlanetOrbit.positionAtT(interplanetaryDepartureTime)
    const interplanetaryArrivalTime = interplanetaryDepartureTime + interplanetaryTravelTime;
    const targetPlanetPositionAtEnd = targetPlanetOrbit.positionAtT(interplanetaryArrivalTime)

    const interplanetaryTransferOrbit = Orbit.FromLambert(
        departingPlanetOrbit.gravity,
        departingPlanetPositionAtDeparture, targetPlanetPositionAtEnd, interplanetaryTravelTime,
        "prograde", interplanetaryDepartureTime,
    )

    const interplanetaryDepartureVelocity = interplanetaryTransferOrbit.velocityAtT(interplanetaryDepartureTime)
    const departurePlanetEscapeVelocity = interplanetaryDepartureVelocity.sub(departingPlanetOrbit.velocityAtT(interplanetaryDepartureTime))

    const probeVelocityAtStart = parkingOrbitAroundDepartingPlanet.velocityAtT(departureTime)
    let diveBurnPrn = null
    let probePositionEscapeBurn = probePositionAtStart
    if(minDepartingPeriapsis != null) {
        const diveSpeedAtStart = diveOrbit.speedAtTa(Math.PI)
        /* Now determine the direction of the diveVelocityAtStart vector
         * It should be in the plane defined by probePositionAtStart and departurePlanetEscapeVelocity,
         * and be perpendicular to probePositionAtStart (since we're at apoapsis of the dive orbit)
         * Also, it should point away from the Escape Velocity vector, since we'll be swinging around the planet
         */
        const diveVelocityDirectionAtStart = probePositionAtStart.cross_product(probePositionAtStart.cross_product(departurePlanetEscapeVelocity))
        const diveVelocityAtStart = diveVelocityDirectionAtStart.mul(diveSpeedAtStart/diveVelocityDirectionAtStart.norm)

        diveBurnPrn = parkingOrbitAroundDepartingPlanet.globalToPrn(
            diveVelocityAtStart.sub(probeVelocityAtStart),
            parkingOrbitAroundDepartingPlanetTaAtStart,
        )
        diveOrbit = Orbit.FromStateVector(
            parkingOrbitAroundDepartingPlanet.gravity,
            probePositionAtStart, diveVelocityAtStart, departureTime,
        )

        probePositionEscapeBurn = diveOrbit.positionAtT(interplanetaryDepartureTime)
    }

    const escapeOrbit = Orbit.FromPositionAndHyperbolicExcessVelocityVector(
        parkingOrbitAroundDepartingPlanet.gravity,
        probePositionEscapeBurn, departurePlanetEscapeVelocity,
        "direct", interplanetaryDepartureTime
    )
    if(escapeOrbit == null) return null
    const escapeOrbitVelocityAtStart = escapeOrbit.velocityAtT(interplanetaryDepartureTime)
    const orbitBeforeEscape = diveOrbit != null ? diveOrbit : parkingOrbitAroundDepartingPlanet
    const escapeBurnPrn = orbitBeforeEscape.globalToPrn(
        escapeOrbitVelocityAtStart.sub(orbitBeforeEscape.velocityAtT(interplanetaryDepartureTime)),
        orbitBeforeEscape.taAtT(interplanetaryDepartureTime),
    )

    /* Capture orbit is easier, since we know we'll do the capture burn at periapsis
     */
    const interplanetaryArrivalVelocity = interplanetaryTransferOrbit.velocityAtT(interplanetaryArrivalTime)
    const arrivalPlanetEnterVelocity = interplanetaryArrivalVelocity.sub(targetPlanetOrbit.velocityAtT(interplanetaryArrivalTime))
    const captureSma = targetPlanetGravity / (arrivalPlanetEnterVelocity.norm * arrivalPlanetEnterVelocity.norm)  // From [OMES 2.102]
    const interceptSpeedAtParkingAltitude = Math.sqrt(
        targetPlanetGravity / captureSma + 2 * targetPlanetGravity / targetParkingOrbitRadius
    ) // From [OMES 2.101]

    const captureSpeed = Orbit.FromOrbitalElements(
        targetPlanetGravity,
        Orbit.smaEFromApsides(targetParkingOrbitRadius, targetPlanetSoi),
    ).speedAtTa(0)
    const captureBurnPrn = new Vector(captureSpeed - interceptSpeedAtParkingAltitude, 0, 0)

    const parkingOrbitSpeed = Orbit.FromOrbitalElements(
        targetPlanetGravity,
        {sma: targetParkingOrbitRadius}
    ).speedAtTa(0)
    const circularizationBurnPrn = new Vector(parkingOrbitSpeed - captureSpeed, 0, 0)

    return {
        diveBurnPrn,
        diveOrbit,
        escapeBurnPrn,
        escapeOrbit,
        transferOrbit: interplanetaryTransferOrbit,
        captureBurnPrn,
        circularizationBurnPrn,
        totalDv: (diveBurnPrn != null ? diveBurnPrn.norm : 0) +
            escapeBurnPrn.norm + captureBurnPrn.norm + circularizationBurnPrn.norm,
    }
}

self.onmessage = (m) => {
    //const startTime = +(new Date())
    const input: WorkerInput = m.data
    input.departingPlanetOrbit = Orbit.FromObject(input.departingPlanetOrbit)
    input.parkingOrbitAroundDepartingPlanet = Orbit.FromObject(input.parkingOrbitAroundDepartingPlanet)
    input.targetPlanetOrbit = Orbit.FromObject(input.targetPlanetOrbit)
    //console.log(`Starting ${input.requestId}`)

    const out: WorkerOutput = {
        requestId: input.requestId,
        result: [],
    }
    for(let t0dt of input.departureAndTravelTimes) {
        let transfer = null
        try {
            transfer = calcOne(
                input.departingPlanetOrbit,
                input.parkingOrbitAroundDepartingPlanet,
                input.minPeriapsis,
                input.targetPlanetOrbit,
                input.targetPlanetGravity,
                input.targetPlanetParkingOrbitRadius,
                input.targetPlanetSoi,
                t0dt[0],
                t0dt[1],
            );
        } catch(e) {
            console.log(e)
        }
        out.result.push({
            departureTime: t0dt[0],
            travelTime: t0dt[1],
            ...transfer,
        })
    }

    self.postMessage(out)
    //const duration = (+(new Date()) - startTime)
    //console.log(`Worker did ${out.result.length} in ${duration} => ${duration / out.result.length} per item`)
}
