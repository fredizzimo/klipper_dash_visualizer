import React, {Component, FunctionComponent, useState, useEffect} from "react";
import {RelativeSlider} from "./relative_slider"
import { Grid, Box } from "@material-ui/core";
import { TimeSlider } from "./time_slider";

const margin = 2
const spacing = 2

interface Props {
    selected_time: Array<number>;
    min_max_time: Array<number>;
    onTimeSelected : (time: Array<number>) => void;
}

interface SliderRowProps extends Props{
    step?: number
    num_steps?: number
    max_steps: number
}

const SliderRow: FunctionComponent<SliderRowProps> = (props) => {

    const onMinTimeChanged=(time: number)=> {
        props.onTimeSelected([time, props.selected_time[1]])
    }

    const onMaxTimeChanged=(time: number)=> {
        props.onTimeSelected([props.selected_time[0], time])
    }

    const onCurrentTimeChanged=(time: number)=> {
        const span = props.selected_time[1] - props.selected_time[0]
        const half_span = span*0.5
        const start = time - half_span
        const end = time + half_span
        props.onTimeSelected([start, end])
    }

    const [min_time, max_time] = props.min_max_time
    const [start, end] = props.selected_time
    const current_time = 0.5 * (start + end)
    const range = end - start


    const min=[min_time, min_time + range*0.5, start]
    const max=[end, max_time - range*0.5, max_time]
    let step: number[]

    if (props.step == undefined) {
        const get_num_steps = (min: number, max: number) => {
            return (max - min) / props.num_steps
        }
        step = [
            get_num_steps(min[0], max[0]),
            get_num_steps(min[1], max[1]),
            get_num_steps(min[2], max[2])
        ]
    }
    else {
        step=[props.step, props.step, props.step]
    }

    return (
        <Grid
            container
            spacing={spacing}
        >
            <Grid item xs={4}>
                <TimeSlider
                    min={min[0]}
                    max={max[0]}
                    value={start}
                    onChange={onMinTimeChanged}
                    step={step[0]}
                    max_steps={props.max_steps}
                />
            </Grid>
            <Grid item xs={4}>
                <TimeSlider
                    min={min[1]}
                    max={max[1]}
                    value={current_time}
                    onChange={onCurrentTimeChanged}
                    step={step[1]}
                    max_steps={props.max_steps}
                />
            </Grid>
            <Grid item xs={4}>
                <TimeSlider
                    min={min[2]}
                    max={max[2]}
                    value={end}
                    onChange={onMaxTimeChanged}
                    step={step[2]}
                    max_steps={props.max_steps}
                />
            </Grid>
        </Grid>
    )
}

export const RangeSelect: FunctionComponent<Props> = (props) => {
    return (
        <Box m={margin}>
            <SliderRow
                {...props}
                num_steps={200}
                max_steps={1000}
            /> 
            <SliderRow
                {...props}
                step={30}
                max_steps={120}
            /> 
            <SliderRow
                {...props}
                step={0.5}
                max_steps={120}
            /> 
            <SliderRow
                {...props}
                step={0.01}
                max_steps={100}
            /> 
        </Box>
    )
}