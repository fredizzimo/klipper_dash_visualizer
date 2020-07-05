import React, {Component} from "react";
import {RelativeSlider} from "./relative_slider"

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

    onCurrentTimeChanged=(time: number)=> {
        const span = this.props.selected_time[1] - this.props.selected_time[0]
        const half_span = span*0.5
        const start = time - half_span
        const end = time + half_span
        this.props.onTimeSelected([start, end])
    }

    render() {
        const current_time = 0.5 * (this.props.selected_time[0] + this.props.selected_time[1])
        return <RelativeSlider
            min={this.props.min_max_time[0]}
            max={this.props.min_max_time[1]}
            value={current_time}
            onChange={this.onCurrentTimeChanged}
       />
    }
}