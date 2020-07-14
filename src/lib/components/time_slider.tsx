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
    // Material-Ui automatically calculates the step precision, and all the returned values are rounded to that
    // Add a small delta to work around that
    const step_precision_force = 1e-13

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

    const shiftRoundedMouseValueToActual = (value: number, step_multiplier: number) => {
        const shift = getMouseStepShift(step_multiplier)
        return value + shift * props.step
    }

    const getNumberOfIntervals = (start: number, end: number) => {
        const range = end - start
        const num_intervals = Math.floor(range / props.step)
        const rest = range - num_intervals * props.step
        if (rest >= tolerance) {
            return num_intervals + 1
        }
        else {
            return num_intervals
        }
    }

    const roundValueToStep = (value: number, step: number, min: number) => {
        return Math.round((value - min) / step) * step + min;
    }

    const mid_value = changing ? originalValue : props.value

    const num_min_intervals = getNumberOfIntervals(props.min, mid_value)
    let start = originalValue - num_min_intervals*props.step

    const num_full_intervals = getNumberOfIntervals(start, props.max)
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
    // Modify the step multiplier when dragging, and there's not enough pixels for full steps
    if (draggingMouse) {
        value = roundValueToMouseStep(props.value, step_multiplier)
        const rect = ref.current.getBoundingClientRect()
        step_multiplier = getMouseStepMultiplier(rect)
    }

    const step = props.step * step_multiplier + step_precision_force

    useEffect(()=> {
        if (!changing) {
            setOriginalValue(props.value)
            setDraggingMouse(false)
        } else {
            if (!draggingMouse) {
                // When starting to drag the mouse, we might have to shift the reported value a bit
                const rect = ref.current.getBoundingClientRect()
                const step_multiplier = getMouseStepMultiplier(rect)
                let value = roundValueToMouseStep(props.value, step_multiplier)
                value = shiftRoundedMouseValueToActual(value, step_multiplier)
                if (Math.abs(value - props.value) > tolerance) {
                    props.onChange(value)
                }
                setDraggingMouse(true)
            }
        }
    }, [changing, props.value])

    const getActualValue = function(event: any, value: number) {
        value = roundValueToStep(value, props.step, start)

        if (draggingMouse) {
            const rect = ref.current.getBoundingClientRect()
            if (event instanceof MouseEvent && event.clientX < rect.x) {
                value = start
            }
            else
            {
                const step_multiplier = getMouseStepMultiplier(rect)
                value = shiftRoundedMouseValueToActual(value, step_multiplier)
            }
        }
        const allowed_min = Math.max(start, props.min)
        const allowed_max = Math.min(end, props.max)

        return Math.min(Math.max(value, allowed_min), allowed_max)
    }

    const onChangeCb = function(event: any, new_step: number) {
        // We use a slightly hacky way to detect if we are using the mouse or not
        // When using the keyboard commit is called immediately
        // But if it's not then we assume it's a mouse (or touch drag)
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
            step={step}
            onChange={onChangeCb}
            onChangeCommitted={onChangeCommittedCb}
            valueLabelDisplay="auto"
        />
    )
}