import * as React from "react";
import {default as BodyData, bodies as kspBodies, GRAVITATIONAL_CONSTANT} from "../utils/kspBody"
import KspHierBody from "../components/kspHierBody"
import {SiInput} from "formattedInput"
import {useState} from "react";

interface BodyProps {
    value: BodyData
    onChange?: (value: BodyData) => void
}

export default function Body(props: BodyProps) {
    const [preset, setPreset] = useState("Kerbin")
    const namelessValue = props.value.copy({name: null})

    return <table><tbody>
        <tr><td>Preset body</td><td>
            <KspHierBody
                customValue="custom"
                value={preset}
                onChange={(bodyName) => {
                    setPreset(bodyName)
                    props.onChange(kspBodies[bodyName])
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
                value={props.value.atmosphere}
                onChange={(h) => {
                    setPreset("")
                    props.onChange(namelessValue.copy({atmosphere: h}))
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