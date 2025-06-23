export type ModInfo = {
    name: string
}

const kspMods: Record<string, ModInfo> = {
    MH: {name: "Making History DLC"},
    BG: {name: "Breaking Ground DLC"},
    OPM: {name: "Outer Planets"},
    KS: {name: "Kcalbeloh System"},
    NFT: {name: "Near Future Tech"},
    FFT: {name: "Far Future Tech"},
}

export default kspMods
