import React, { useState, useEffect, FunctionComponent } from "react";
import { Slider, Theme } from "@material-ui/core";
import { withStyles, createStyles } from "@material-ui/styles";

const slider_styles = ({palette}: Theme) => createStyles({
    valueLabel: {
        zIndex: 1500,
        color: palette.primary.light,
    }
})

const StyledSlider = withStyles(slider_styles)(Slider)

interface Props {
    value: number
    min: number
    max: number
    step: number
    num_steps: number
    onChange : (value: number) => void
}

export const TimeSlider: FunctionComponent<Props> = (props) => {
    const [changing, setChanging] = useState(false)
    const [originalValue, setOriginalValue] = useState(props.value)

    useEffect(()=> {
        if (!changing) {
            setOriginalValue(props.value)
        }
    }, [changing, props.value])

    const getActualValue = function(value: number) {
        return Math.max(value, props.min) 
    }

    const onChangeCb = function(_:any, new_step: number) {
        setChanging(true)
        const actual_value = getActualValue(new_step)
        props.onChange(actual_value)
    }

    const onChangeCommittedCb = function(_:any, new_step: number) {
        setChanging(false)
        const actual_value = getActualValue(new_step)
        setOriginalValue(actual_value)
        props.onChange(actual_value)
    }
    const tolerance = 1e-12

    const mid_value = changing ? originalValue : props.value

    const min_range = mid_value - props.min
    let num_min_steps = Math.floor(min_range) / props.step
    const rest = min_range - num_min_steps * props.step
    if (rest >= tolerance) {
        num_min_steps++
    }

    const start = originalValue - num_min_steps*props.step

    return (
        <StyledSlider
            min={start}
            max={props.max}
            value={props.value}
            step={props.step}
            onChange={onChangeCb}
            onChangeCommitted={onChangeCommittedCb}
            valueLabelDisplay="auto"
            scale={(x: number) => { return getActualValue(x) }}
        />
    )
}