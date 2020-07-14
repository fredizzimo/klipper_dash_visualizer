import React, {Component, FunctionComponent, useState, useEffect} from "react";
import {RelativeSlider} from "./relative_slider"
import { Grid, Box } from "@material-ui/core";
import { TimeSlider } from "./time_slider";

const margin = 2
const spacing = 2

interface FullSliderProps {
    min: number
    max: number
    value: number
    onChange: (time: number) => void
}

const FullSlider: FunctionComponent<FullSliderProps> = (props) => {
    const full_range_steps = 200
    return (
        <TimeSlider
            min={props.min}
            max={props.max}
            value={props.value}
            onChange={props.onChange}
            step={(props.max-props.min) / full_range_steps}
            max_steps={1000}
        />
    )
}

interface Props {
    selected_time: Array<number>;
    min_max_time: Array<number>;
    onTimeSelected : (time: Array<number>) => void;
}

export const RangeSelect: FunctionComponent<Props> = (props) => {

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

    return (
        <Box m={margin}>
            <Grid
                container
                spacing={spacing}
            >
                <Grid item xs={4}>
                    <FullSlider
                        min={min_time}
                        max={end}
                        value={start}
                        onChange={onMinTimeChanged}
                    />
                </Grid>
                <Grid item xs={4}>
                    <FullSlider
                        min={min_time + range*0.5}
                        max={max_time - range*0.5}
                        value={current_time}
                        onChange={onCurrentTimeChanged}
                    />
                </Grid>
                <Grid item xs={4}>
                    <FullSlider
                        min={start}
                        max={max_time}
                        value={end}
                        onChange={onMaxTimeChanged}
                    />
                </Grid>
            </Grid>
        </Box>
    )
}