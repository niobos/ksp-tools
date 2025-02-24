import * as React from "react"
import {FloatInput} from "formattedInput"
import {KspFund} from "./kspIcon"

export type FuelTankInfo = {
    fullEmptyRatio: number,
    cost: number,
}
export interface FuelTankProps {
    value: FuelTankInfo
    onChange: (value: FuelTankInfo) => void
}
export default function FuelTank({
    value,
    onChange,
}: FuelTankProps) {
    return <div>
        Full:Empty ratio: <FloatInput
            value={value.fullEmptyRatio} decimals={2}
            onChange={(v) => onChange({fullEmptyRatio: v, cost: value.cost})}
        /><br/>
        Cost: <FloatInput value={value.cost} decimals={0}
                          onChange={(v) => onChange({fullEmptyRatio: value.fullEmptyRatio, cost: v})}
        /><KspFund/>/t
    </div>
}
