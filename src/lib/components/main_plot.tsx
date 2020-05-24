import React, {Component} from "react";
import Plot, {Figure} from "react-plotly.js"
import {PlotRelayoutEvent} from "plotly.js";
import {range_start, range_end, get_min_max} from "../helpers"
import { Theme, createStyles, WithStyles, withStyles } from "@material-ui/core";

const styles = (theme: Theme) => createStyles({
    graph: {
        width: "100%"
    }
});

interface Props extends WithStyles<typeof styles> {
    figure: Figure;
    selected_time: Array<number>;
    onTimeSelected : (time: Array<number>) => void;
};

type State =
{
    graph_revision: number
};

const MainPlot = withStyles(styles)(
    class extends Component<Props, State> {
        relayout_called: boolean

        constructor(props: Props) {
            super(props);
            this.state = {
                graph_revision: 1
            }
            this.relayout_called = false;
            (this.props.figure.layout as any).datarevision = 1;
        }

        onPlotRelayout=(event: PlotRelayoutEvent)=> {
            this.relayout_called = true;
        }

        componentDidUpdate(prevProps: Props, prevState: State) {
            if (this.props.selected_time != prevProps.selected_time) {
                let graph_time = this.props.figure.layout.xaxis.range
                if (graph_time[0] != this.props.selected_time[0] || graph_time[1] != this.props.selected_time[1]) {
                    this.props.figure.layout.xaxis.range = [this.props.selected_time[0], this.props.selected_time[1]];
                    this.props.figure.layout.xaxis.autorange = false;
                    (this.props.figure.layout as any).datarevision++;
                    this.updateGraphRevision()
                }
                this.zoomFigureY()
            }
        }

        onPlotUpdate=(figure: Figure)=> {
            if (this.relayout_called) {
                this.relayout_called = false;
                this.updateSelectedTime();
            }
        }

        onPlotInitialized=(figure: Figure)=> {
            this.updateSelectedTime();
        }

        updateSelectedTime() {
            let selected_time = this.props.figure.layout.xaxis.range
            if (this.props.selected_time == null || 
                    this.props.selected_time[0] != selected_time[0] ||
                    this.props.selected_time[1] != selected_time[1])
            {
                this.props.onTimeSelected([...selected_time]);
            }
        }

        zoomFigureY()
        {
            let fig = this.props.figure
            var x_range = fig.layout.xaxis.range
            for (let i=0;i<fig.data.length;i++) {
                let element = fig.data[i];
                let y_range = this.zoomTraceY(element.x as ArrayLike<number>, element.y as ArrayLike<number>, x_range[0], x_range[1]);
                let axis_name = "yaxis"
                if (i > 0) {
                    axis_name = axis_name + (i+1);
                }
                (fig.layout as any)[axis_name].range = y_range;
                (fig.layout as any)[axis_name].autorange = false;
            }
            (fig.layout as any).datarevision++;
            this.updateGraphRevision()
        }

        zoomTraceY(xvals: ArrayLike<number>, yvals: ArrayLike<number>, start: number, end: number)
        {
            if (xvals.length == 0) {
                return [-100, 100];
            }
            var i_low = range_start(xvals, start);
            var i_high = range_end(xvals, end);
            var num_steps = xvals.length;
            if (i_low >= num_steps) {
                var range_low = yvals[yvals.length - 1];
                var range_high = range_low;
            } else if (i_low == i_high) {
                var range_low = yvals[i_low];
                var range_high = range_low;
            } else {
                let min_max = get_min_max(yvals, i_low, i_high+1);
                var range_low = min_max[0];
                var range_high = min_max[1]
            }
            var diff = range_high - range_low;
            var margin = diff * 0.1;
            range_high += margin;
            range_low -= margin;
            return [range_low, range_high];
        }

        updateGraphRevision() {
            this.setState((prevState, props) => ({
                graph_revision: prevState.graph_revision + 1
            })); 
        }

        render() {
            return ( 
                <Plot
                    className={this.props.classes.graph}
                    data={this.props.figure.data}
                    layout={this.props.figure.layout}
                    frames={this.props.figure.frames}
                    revision={this.state.graph_revision}
                    onRelayout={this.onPlotRelayout}
                    onUpdate={this.onPlotUpdate}
                    onInitialized={this.onPlotInitialized}
                    useResizeHandler={true}
                />
            )
        }
    }
)

export default MainPlot;