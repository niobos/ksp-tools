import Orbit from "../utils/orbit";
import Vector from "../utils/vector";

export type WorkerInput = {
    requestId?: any
    departingPlanetOrbit: Orbit
    parkingOrbitAroundDepartingPlanet: Orbit
    minPeriapsis: number
    targetPlanetOrbit: Orbit
    targetPlanetGravity: number
    targetPlanetParkingOrbitRadius: number
    departureAndTravelTimes: [number, number][]
}
export type TransferResult = {
    transferOrbit: Orbit
    totalDv: number
    escapeBurnPrn: Vector
    captureBurn: number
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
    minDepartingPeriapsis: number,
    targetPlanetOrbit: Orbit,
    targetPlanetGravity: number,
    targetParkingOrbitRadius: number,
    departureTime: number,
    travelTime: number,
): TransferResult {
    if(travelTime <= 0) return null

    const r1 = departingPlanetOrbit.positionAtT(departureTime)
    const arrivalTime = departureTime + travelTime
    const r2 = targetPlanetOrbit.positionAtT(arrivalTime)
    const transferOrbit = Orbit.FromLambert(departingPlanetOrbit.gravity, r1, r2, travelTime, "prograde", departureTime)

    const planetV0 = departingPlanetOrbit.velocityAtT(departureTime)
    const transferV0 = transferOrbit.velocityAtT(departureTime)
    const departureHev = transferV0.sub(planetV0)

    const escapeOrbit = Orbit.FromPositionAndHyperbolicExcessVelocityVector(
        parkingOrbitAroundDepartingPlanet.gravity,
        parkingOrbitAroundDepartingPlanet.positionAtT(departureTime),
        departureHev,
        "direct",
        departureTime,
    )
    if(escapeOrbit == null) return null
    const parkingOrbitVelocityAtDeparture = parkingOrbitAroundDepartingPlanet.velocityAtT(departureTime);
    const escapeVelocityAtDeparture = escapeOrbit.velocityAtT(departureTime);
    const escapeBurn = escapeVelocityAtDeparture.sub(parkingOrbitVelocityAtDeparture)

    const transferV1 = transferOrbit.velocityAtT(arrivalTime)
    const planetV1 = targetPlanetOrbit.velocityAtT(arrivalTime)
    const arrivalHev = planetV1.sub(transferV1)

    const targetParkingOrbitSpeed = Orbit.FromOrbitalElements(
        targetPlanetGravity,
        {sma: targetParkingOrbitRadius}
    ).speedAtTa(0)
    const arrivalOrbit = Orbit.FromOrbitalElements(
        targetPlanetGravity,
        Orbit.semiMajorAxisEFromPeriapsisHyperbolicExcessVelocity(
            targetPlanetGravity,
            targetParkingOrbitRadius,
            arrivalHev.norm,
        )
    )
    const arrivalPeriapsisSpeed = arrivalOrbit.speedAtTa(0)
    const captureBurn = Math.abs(targetParkingOrbitSpeed - arrivalPeriapsisSpeed)

    return {
        transferOrbit,
        escapeBurnPrn: parkingOrbitAroundDepartingPlanet.globalToPrn(
            escapeBurn,
            parkingOrbitAroundDepartingPlanet.taAtT(departureTime),
        ),
        captureBurn,
        totalDv: escapeBurn.norm + captureBurn,
    };
}

self.onmessage = (m) => {
    //const startTime = +(new Date())
    const input: WorkerInput = m.data
    input.departingPlanetOrbit = Orbit.FromObject(input.departingPlanetOrbit)
    input.parkingOrbitAroundDepartingPlanet = Orbit.FromObject(input.parkingOrbitAroundDepartingPlanet)
    input.targetPlanetOrbit = Orbit.FromObject(input.targetPlanetOrbit)

    const out: WorkerOutput = {
        requestId: input.requestId,
        result: [],
    }
    for(let t0dt of input.departureAndTravelTimes) {
        const transfer = calcOne(
            input.departingPlanetOrbit,
            input.parkingOrbitAroundDepartingPlanet,
            input.minPeriapsis,
            input.targetPlanetOrbit,
            input.targetPlanetGravity,
            input.targetPlanetParkingOrbitRadius,
            t0dt[0],
            t0dt[1],
        );
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
