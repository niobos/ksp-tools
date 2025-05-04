import * as React from "react";
import KspHierBody from "../components/kspHierBody"
import {SiInput} from "formattedInput"
import {useState} from "react"
import {KspSystem, Body as BodyData, GRAVITATIONAL_CONSTANT} from "../utils/kspSystems"
import {HierarchicalBodySelect} from "../components/kspSystemSelect";

interface BodyProps {
    system: KspSystem
    value: BodyData
    onChange?: (value: BodyData) => void
}

export default function Body(props: BodyProps) {
    const [preset, setPreset] = useState("Kerbin")
    const namelessValue = props.value.copy({name: null})

    return <table><tbody>
        <tr><td>Preset body</td><td>
            <HierarchicalBodySelect
                system={props.system}
                customValue="custom"
                value={preset}
                onChange={(bodyName) => {
                    setPreset(bodyName)
                    props.onChange(props.system.bodies[bodyName])
                }}/>
        </td></tr>
        <tr><td>Gravity</td><td>
            <SiInput
                value={props.value.gravity}
                onChange={(g) => {
                    setPreset("")
                    props.onChange(namelessValue.copy({mass: g / GRAVITATIONAL_CONSTANT}))
                }}
            />m<sup>3</sup>/s<sup>2</sup>
        </td></tr>
        <tr><td>Body radius</td><td>
            <SiInput
                value={props.value.radius}
                onChange={(r) => {
                    setPreset("")
                    props.onChange(namelessValue.copy({radius: r}))
                }}/>m
        </td></tr>
        <tr><td>Atmosphere height</td><td>
            <SiInput
                value={props.value.atmosphereHeight}
                onChange={(h) => {
                    setPreset("")
                    props.onChange(namelessValue.copy({atmosphereHeight: h}))
                }}/>m
        </td></tr>
        <tr><td>Sphere of Influence</td><td>
            <SiInput
                value={props.value.soi}
                onChange={(soi) => {
                    setPreset("")
                    props.onChange(namelessValue.copy({soi: soi}))
                }}/>m
        </td></tr>
        </tbody></table>
}