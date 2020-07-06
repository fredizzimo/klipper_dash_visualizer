import React, {Component} from "react";
import {RelativeSlider} from "./relative_slider"
import { Grid, Box } from "@material-ui/core";
import { TimeSlider } from "./time_slider";

const margin = 2
const spacing = 2

type State = {
}

type Props = {
    selected_time: Array<number>;
    min_max_time: Array<number>;
    onTimeSelected : (time: Array<number>) => void;
}

export class RangeSelect extends Component<Props, State>
{
    constructor(props: Props) {
        super(props)
    }

    onMinTimeChanged=(time: number)=> {
        this.props.onTimeSelected([time, this.props.selected_time[1]])
    }

    onMaxTimeChanged=(time: number)=> {
        this.props.onTimeSelected([this.props.selected_time[0], time])
    }

    onCurrentTimeChanged=(time: number)=> {
        const span = this.props.selected_time[1] - this.props.selected_time[0]
        const half_span = span*0.5
        const start = time - half_span
        const end = time + half_span
        this.props.onTimeSelected([start, end])
    }

    render() {
        const current_time = 0.5 * (this.props.selected_time[0] + this.props.selected_time[1])
        return (
            <Box m={margin}>
                <Grid
                    container
                    spacing={spacing}
                >
                    <Grid item xs={4}>
                        <TimeSlider
                            min={this.props.min_max_time[0]}
                            max={this.props.selected_time[1]}
                            value={this.props.selected_time[0]}
                            onChange={this.onMinTimeChanged}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <RelativeSlider
                            min={this.props.min_max_time[0]}
                            max={this.props.min_max_time[1]}
                            value={current_time}
                            onChange={this.onCurrentTimeChanged}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <RelativeSlider
                            min={this.props.selected_time[0]}
                            max={this.props.min_max_time[1]+20}
                            value={this.props.selected_time[1]}
                            onChange={this.onMaxTimeChanged}
                        />
                    </Grid>
                </Grid>
            </Box>
        )
    }
}