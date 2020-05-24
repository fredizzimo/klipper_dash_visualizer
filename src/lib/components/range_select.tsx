import React, {Component} from "react";
import { Slider } from "@material-ui/core";

type State = {
    current_selection: Array<number>;
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
        this.state = {
            current_selection: this.get_new_selection()
        }
    }

    get_new_selection() {
        const t = this.props.selected_time;
        return [t[0], (t[0] + t[1]) / 2, t[1]];
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.props.selected_time != prevProps.selected_time) {
            this.setState({
                current_selection: this.get_new_selection()
            })
        }
    }

    onTimeSliderChange = (event: any, new_value: number[]) => {
        console.log("new time " + new_value)
        this.setState({current_selection: new_value})
    };

    onTimeSliderCommitted = (event: any, new_value: number[]) => {
        let selected_time = [new_value[0], new_value[2]]
        console.log("time committed" + selected_time)
        this.props.onTimeSelected(selected_time)
    }

    render() {
        return <Slider
            value={this.state.current_selection}
            onChange={this.onTimeSliderChange}
            onChangeCommitted={this.onTimeSliderCommitted}
            min={this.props.selected_time[0] - 10}
            max={this.props.selected_time[1] + 10}
        />
    }
}