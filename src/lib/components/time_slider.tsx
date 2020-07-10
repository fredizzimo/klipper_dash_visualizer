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
    onChange : (value: number) => void
}

export const TimeSlider: FunctionComponent<Props> = (props) => {
    const [current_step, setCurrentStep] = useState(0);
    const [original_value, setOriginalValue] = useState(props.value)
    const [original_min, setOriginalMin] = useState(props.min)
    const [original_max, setOriginalMax] = useState(props.max)
    const [changing, setChanging] = useState(false)

    useEffect(()=> {
        if (!changing) {
            setCurrentStep(0)
            setOriginalMin(props.min)
            setOriginalMax(props.max)
            setOriginalValue(props.value)
        }
    }, [changing, props.min, props.max, props.value])

    const total_steps = 501;

    const range_min = original_value - original_min
    const range_max = original_max - original_value
    const ratio = range_min / (range_min + range_max)
    // Note zero is included in the max range
    const range_min_steps = Math.round((total_steps-1) * ratio)
    const range_max_steps = total_steps - 1 - range_min_steps

    const getActualValue = function(step: number) {
        if (step==0) {
            return original_value
        } else if (step < 0) {
            return original_value + step * (range_min/range_min_steps)
        } else {
            return original_value + step * (range_max/range_max_steps)
        }   
    }

    const onChangeCb = function(_:any, new_step: number) {
        setCurrentStep(new_step)
        setChanging(true)
        const actual_value = getActualValue(new_step)
        props.onChange(actual_value)
    }

    const onChangeCommittedCb = function(_:any, new_step: number) {
        setChanging(false)
        const actual_value = getActualValue(new_step)
        props.onChange(actual_value)
    }

    return (
        <StyledSlider
            min={-range_min_steps}
            max={range_max_steps}
            value={current_step}
            onChange={onChangeCb}
            onChangeCommitted={onChangeCommittedCb}
            valueLabelDisplay="auto"
            scale={(x: number) => { return getActualValue(x) }}
        />
    )
}