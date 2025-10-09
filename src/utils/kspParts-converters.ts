import Part, {Resources} from "./kspParts";
import {setEq} from "./utils";

export class ConversionRecipe extends Part {
    engineerComment?: string
}

const converterRecipes = [
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → LF',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.45, El: 30, LF: -0.9, Heat: -200}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.55, El: 30, Ox: -1.1, Heat: -200}),
   }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → LF + Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.50, El: 30, LF: -0.45, Ox: -0.55, Heat: -200}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → Mono',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.50, El: 30, Mono: -1, Heat: -200}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → LF',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.25, El: 30, LF: -0.45, Heat: -100}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.75, El: 30, Ox: -0.55, Heat: -100}),
   }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → LF + Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.50, El: 30, LF: -0.22, Ox: -0.28, Heat: -100}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → Mono',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.50, El: 30, Mono: -0.50, Heat: -100}),
    }),

    ConversionRecipe.create({
        name: '[Drill-O-Matic] Planet',
        engineerComment: "Efficiency: Ore concentration × (5 + 20 × engineer level)%",
        consumption: new Resources({El: 15, Ore: -1.5}),  // TODO: electricity scales with engineer level, but not with ore concentration
    }),
    ConversionRecipe.create({
        name: '[Drill-O-Matic] Asteroid',
        engineerComment: "Efficiency: Ore concentration × (5 + 20 × engineer level)%",
        consumption: new Resources({El: 1.5, Ore: -5}),
    }),

    ConversionRecipe.create({
        name: '[Drill-O-Matic Jr] Planet',
        engineerComment: "Efficiency: Ore concentration × (5 + 20 × engineer level)%",
        consumption: new Resources({El: 3, Ore: -0.3}),  // TODO: electricity scales with engineer level, but not with ore concentration
    }),
    ConversionRecipe.create({
        name: '[Drill-O-Matic Jr] Asteroid',
        engineerComment: "Efficiency: Ore concentration × (5 + 20 × engineer level)%",
        consumption: new Resources({El: 0.3, Ore: -1.0}),
    }),
]

const nearFuture = [
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → LH2',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.45, El: 30, LH2: -63.45, Heat: -40}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → LH2 + Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.50, El: 30, LH2: -12.37, Ox: -0.82, Heat: -40}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → LCH4',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.45, El: 30, LCH4: -10.57, Heat: -40}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → LCH4 + Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 0.5, El: 30, LCH4: -2.38, Ox: 0.80, Heat: -40}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 250] Ore → Li',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 1, El: 50, Li: -18.7, Heat: -80}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → LH2',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.25, El: 30, LH2: -31.73, Heat: -20}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → LH2 + Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.50, El: 30, LH2: -6.19, Ox: -0.41, Heat: -20}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → LCH4',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.25, El: 30, LCH4: -5.29, Heat: -20}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → LCH4 + Ox',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 2.5, El: 30, LCH4: -1.19, Ox: 0.40, Heat: -20}),
    }),
    ConversionRecipe.create({
        name: '[Convert-o-Tron 125] Ore → Li',
        engineerComment: "Efficiency: (5 + 20 × engineer level)%",
        consumption: new Resources({Ore: 5.00, El: 50, Li: -9.30, Heat: -40}),
    }),
    ConversionRecipe.create({
        name: "[Nuclear Reprocessor] DeplU → EnrU",
        consumption: new Resources({DeplU: 0.10, El: 200, EnrU: -0.05, Heat: -175}),
    }),
    ConversionRecipe.create({
        name: "[Nuclear Reprocessor] DeplU → Xe",
        consumption: new Resources({DeplU: 36/3600, El: 100, Xe: -0.25, Heat: -75}),
    }),
    ConversionRecipe.create({
        name: "[Nuclear Reprocessor] Ore → EnrU",
        consumption: new Resources({Ore: 1, El: 200, EnrU: -3.6/3600, Heat: -175}),
    }),
]

const farFuture = [
    ConversionRecipe.create({
        name: "[Nuclear Smelter] Ore + EnrU → NSW",
        consumption: new Resources({Ore: 1, EnrU: 18/3600, El: 15, NSW: -5, Heat: -200}),
    }),
    ConversionRecipe.create({
        name: "[Nuclear Smelter] EnrU → Frag",
        consumption: new Resources({EnrU: 1, El: 150, Frag: -10, Heat: -100}),
    }),
    ConversionRecipe.create({
        name: "[Nuclear Smelter] EnrU → FIP",
        consumption: new Resources({EnrU: 1, El: 150, FIP: -10, Heat: -150}),
    }),
    ConversionRecipe.create({
        name: "[Antimatter Factory] LH2 → Anti",
        consumption: new Resources({LH2: 1, El: 10_000, Anti: -5}),
    }),
    ConversionRecipe.create({
        name: "[Antimatter Factory] FIP → Anti",
        consumption: new Resources({FIP: 1, El: 10_000, Anti: -500, Heat: -10_000}),
    }),
]

function conversionRecipesWithMods_(activeMods: Set<string> = new Set()): Record<string, ConversionRecipe> {
    let recipes: Record<string, ConversionRecipe> = converterRecipes.reduce(
        (acc, e) => {acc[e.name] = e; return acc},
        {}
    )
    if(activeMods.has("NFT")) {
        recipes = nearFuture.reduce(
            (acc, e) => {acc[e.name] = e; return acc},
            recipes,
        )
    }
    if(activeMods.has("FFT")) {
        recipes = farFuture.reduce(
            (acc, e) => {acc[e.name] = e; return acc},
            recipes,
        )
    }
    return recipes
}

let conversionRecipesCache: null | {activeMods: Set<string>, recipes: Record<string, ConversionRecipe>} = null
export function conversionRecipesWithMods(activeMods: Set<string> = new Set()): Record<string, ConversionRecipe> {
    if(conversionRecipesCache == null || !setEq(conversionRecipesCache.activeMods, activeMods)) {
        conversionRecipesCache = {
            activeMods: new Set(activeMods),
            recipes: conversionRecipesWithMods_(activeMods),
        }
    }
    return conversionRecipesCache.recipes
}
