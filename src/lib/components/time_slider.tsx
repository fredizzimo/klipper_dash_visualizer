import React, { useState, useEffect, useRef, FunctionComponent } from "react";
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
    const tolerance = 1e-12

    const [changing, setChanging] = useState(false)
    const [originalValue, setOriginalValue] = useState(props.value)
    const [draggingMouse, setDraggingMouse] = useState(false)

    const ref = useRef<HTMLSpanElement>()

    const getMouseStepMultiplier = (rect: DOMRect) => {
        if (!changing) {
            return 1
        }

        let multiplier = 1
        while(rect.width < props.max_steps / multiplier) {
            multiplier++
        }
        return multiplier
    }

    const getValueSteps = (value: number) => {
        const range = value - props.min + tolerance
        return Math.floor(range / props.step)
    }

    const getMouseStepShift = (step_multiplier: number) => {
        const num_steps = getValueSteps(originalValue)
        return Math.round(num_steps % step_multiplier)
    }

    const roundValueToMouseStep = (value: number, step_multiplier: number) => {
        const value_steps = getValueSteps(value)
        const diff = Math.round(value_steps % step_multiplier)
        return value - diff*props.step
    }

    const shiftValueToActual = (value: number, step_multiplier: number) => {
        const shift = getMouseStepShift(step_multiplier)
        return value + shift * props.step
    }

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

    let value = props.value
    let step_multiplier = 1
    if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        step_multiplier = getMouseStepMultiplier(rect)

    }
    if (draggingMouse) {
        value = roundValueToMouseStep(props.value, step_multiplier)
    }


    useEffect(()=> {
        if (!changing) {
            setOriginalValue(props.value)
            setDraggingMouse(false)
        } else {
            if (!draggingMouse) {
                const rect = ref.current.getBoundingClientRect()
                const step_multiplier = getMouseStepMultiplier(rect)
                let value = roundValueToMouseStep(props.value, step_multiplier)
                value = shiftValueToActual(value, step_multiplier)
                if (Math.abs(value - props.value) > tolerance) {
                    props.onChange(value)
                }
                setDraggingMouse(true)
            }
        }
    }, [changing, props.value])

    const getActualValue = function(event: any, value: number) {
        if (draggingMouse) {
            const rect = ref.current.getBoundingClientRect()
            if (event instanceof MouseEvent && event.clientX < rect.x) {
                value = start
            }
            else
            {
                const step_multiplier = getMouseStepMultiplier(rect)
                value = shiftValueToActual(value, step_multiplier)
            }
        }
        const allowed_min = Math.max(start, props.min)
        const allowed_max = Math.min(end, props.max)

        return Math.min(Math.max(value, allowed_min), allowed_max)
    }

    const onChangeCb = function(event: any, new_step: number) {
        setChanging(true)
        const actual_value = getActualValue(event, new_step)
        props.onChange(actual_value)
    }

    const onChangeCommittedCb = function(event: any, new_step: number) {
        setChanging(false)
        const actual_value = getActualValue(event, new_step)
        setOriginalValue(actual_value)
        setDraggingMouse(false)
        props.onChange(actual_value)
    }
    return (
        <StyledSlider
            ref={ref}
            min={start}
            max={end}
            value={value}
            step={props.step * step_multiplier + step_precision_force}
            onChange={onChangeCb}
            onChangeCommitted={onChangeCommittedCb}
            valueLabelDisplay="auto"
        />
    )
}