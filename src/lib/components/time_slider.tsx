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
    max_steps: number
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
        return Math.min(Math.max(value, props.min), props.max)
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
    // Material-Ui automatically calculates the step precision, and all the returned values are rounded to that
    // Add a small delta to work around that
    const step_precision_force = 1e-16

    const mid_value = changing ? originalValue : props.value

    const min_range = mid_value - props.min
    let num_min_intervals = Math.floor(min_range / props.step)
    let rest = min_range - num_min_intervals * props.step
    if (rest >= tolerance) {
        num_min_intervals++
    }

    let start = originalValue - num_min_intervals*props.step

    const full_range = props.max - start
    let num_full_intervals = Math.floor(full_range / props.step)
    rest = full_range - num_full_intervals * props.step
    if (rest >= tolerance) {
        num_full_intervals++;
    }
    let end = start + num_full_intervals * props.step

    // Make sure that we don't exceed the maximum allowed steps
    if (num_full_intervals + 1 > props.max_steps) {
        const min_half = Math.floor(props.max_steps / 2.0)
        const min_start = mid_value - min_half*props.step

        // Start is the absolute minimum allowed
        start = Math.max(start, min_start)

        const new_end = start + props.max_steps*props.step

        // If we exceed the end, shift the range
        if (new_end > end) {
            start -= new_end - end
            end = end
        } else {
            end = new_end
        }
    }

    return (
        <StyledSlider
            min={start}
            max={end}
            value={props.value}
            step={props.step + step_precision_force}
            onChange={onChangeCb}
            onChangeCommitted={onChangeCommittedCb}
            valueLabelDisplay="auto"
            scale={(x: number) => { return getActualValue(x) }}
        />
    )
}