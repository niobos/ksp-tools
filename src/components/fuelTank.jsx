import React from "react";
import {FloatInput} from "./formatedInput";
import {KspFund} from "./kspIcon";

export default function FuelTank(props) {
    return <div>
        Full:Empty ratio: <FloatInput
        value={props.value.fullEmptyRatio} decimals={2}
        onChange={(v) => props.onChange({fullEmptyRatio: v, cost: props.value.cost})}
        /><br/>
        Cost: <FloatInput value={props.value.cost} decimals={0}
                          onChange={(v) => props.onChange({fullEmptyRatio: props.value.fullEmptyRatio, cost: v})}
        /><KspFund/>/t
    </div>;
}