import React, {Component} from "react";
import { Slider, Theme } from "@material-ui/core";
import { withStyles, createStyles } from "@material-ui/styles";

const slider_styles = ({palette}: Theme) => createStyles({
    valueLabel: {
        zIndex: 1500,
        color: palette.primary.light,
    }
})

const StyledSlider = withStyles(slider_styles)(Slider)

type State = {
    original_min: number,
    original_max: number,
    original_value: number,
    changing: boolean,
    current_selection: number,
}

type Props = {
    min: number,
    max: number,
    value: number,
    onChange : (value: number) => void;
}

export class RelativeSlider extends Component<Props, State>
{
    total_steps = 500
    min_step = 0.0001
    min_step_log = Math.log10(this.min_step)

    constructor(props: Props) {
        super(props)
        const mid = 0
        this.state = {
            original_min: props.min,
            original_max: props.max,
            original_value: props.value,
            changing: false,
            current_selection: 0
        }
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (!this.state.changing) {
            if (
                prevState.original_min != this.props.min ||
                prevState.original_max != this.props.max ||
                prevState.original_value != this.props.value ||
                prevState.current_selection != 0)
            {
                this.setState({
                    original_min: this.props.min,
                    original_max: this.props.max,
                    original_value: this.props.value,
                    current_selection: 0
                })
            }
        }
    }

    onChange = (event: any, new_value: number) => {
        console.log("new time " + new_value)
        const actual_value = this.getActualValue(new_value)
        this.setState({
            current_selection: new_value,
            changing: true,
        })
        this.props.onChange(actual_value)
    };

    onCommit = (event: any, new_value: number) => {
        console.log("time committed " + new_value)
        const actual_value = this.getActualValue(new_value)
        this.setState({
            changing: false,
            original_value: actual_value,
            current_selection: 0 
        })
    }

    getActualValue(x: number) {
        const info = this.getRangeInformation()
        if (x < 0) {
            x = -x
            return this.state.original_value - 10 ** (this.min_step_log + info.range_min_x_step*x)
        } else if (x > 0) {
            return this.state.original_value + 10 ** (this.min_step_log + info.range_max_x_step*x)
        } else {
            return this.state.original_value
        }
    }

    getRangeInformation() {
        const range_min = this.state.original_value - this.state.original_min
        const range_max = this.state.original_max - this.state.original_value
        // TODO: Handle ranges with less than min_step
        const range_min_log = Math.log10(range_min)
        const range_max_log = Math.log10(range_max)
        const ratio = range_min_log / (range_min_log + range_max_log)
        const range_min_steps = Math.round(this.total_steps * ratio)
        const range_max_steps = this.total_steps - range_min_steps
        const range_min_x_step = (range_min_log - this.min_step_log) / range_min_steps
        const range_max_x_step = (range_max_log - this.min_step_log) / range_max_steps

        return {
            range_min,
            range_max,
            range_min_log,
            range_max_log,
            range_min_steps,
            range_max_steps,
            range_min_x_step,
            range_max_x_step,
        }
    }

    render() {
        const info = this.getRangeInformation()
        const min = -info.range_min_steps
        const max = info.range_max_steps
        const step = 1

        return <StyledSlider
            value={this.state.current_selection}
            onChange={this.onChange}
            onChangeCommitted={this.onCommit}
            min={min}
            max={max}
            step={step}
            valueLabelDisplay="auto"
            scale={(x: number) => { return this.getActualValue(x) }}
        />
    }
}
