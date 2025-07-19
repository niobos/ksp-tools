import {_fuelTanks, _nearFuture, _farFuture} from "./kspParts-fuelTanks";

test('name duplicates', () => {
    const fullList = [..._fuelTanks, ..._nearFuture, ..._farFuture]
    const names = {}
    for(let engine of fullList) {
        if(engine.name in names) throw new Error(`Duplicate name: ${engine.name}`)
        names[engine.name] = engine
    }
})