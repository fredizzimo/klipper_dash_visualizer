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

    useEffect(()=> {
        if (!changing) {
        }
    }, [changing])

    const getActualValue = function(step: number) {
        return step
    }

    const onChangeCb = function(_:any, new_step: number) {
        setChanging(true)
        props.onChange(new_step)
    }

    const onChangeCommittedCb = function(_:any, new_step: number) {
        setChanging(false)
        props.onChange(new_step)
    }

    return (
        <StyledSlider
            min={props.min}
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