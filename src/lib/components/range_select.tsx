import React, {Component} from "react";
import { Slider } from "@material-ui/core";

type State = {
    current_selection: Array<number>;
}

type Props = {
    min_max_time: Array<number>;

}

export class RangeSelect extends Component<Props, State>
{
    constructor(props: Props) {
        super(props)
        const min_max_time = this.props.min_max_time;
        this.state = {
            current_selection: [min_max_time[0], (min_max_time[1] + min_max_time[0]) / 2, min_max_time[1]]
        }

    }

    onTimeSliderChange = (event: any, newValue: number[]) => {
        console.log("new time " + newValue)
        this.setState({current_selection: newValue})
    };

    render() {
        return <Slider
            value={this.state.current_selection}
            onChange={this.onTimeSliderChange}
            min={this.props.min_max_time[0]}
            max={this.props.min_max_time[1]}
        />
    }
}