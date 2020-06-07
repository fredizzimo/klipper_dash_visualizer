import React, {Component} from "react";
import Plot, {Figure} from "react-plotly.js"
import {PlotRelayoutEvent} from "plotly.js";
import {range_start, range_end, get_min_max} from "../helpers"
import { Theme, createStyles, WithStyles, withStyles } from "@material-ui/core";
// The theme is the default plotly theme copied from the python package
import theme from "./plot_theme.json"

const styles = (theme: Theme) => createStyles({
    graph: {
        width: "100%"
    }
});

const TraceColors = [
    "rgb(31, 119, 180)",
    "rgb(255, 127, 14)",
    "rgb(44, 160, 44)",
    "rgb(214, 39, 40)",
    "rgb(148, 103, 189)",
    "rgb(140, 86, 75)",
    "rgb(227, 119, 194)",
    "rgb(127, 127, 127)",
    "rgb(188, 189, 34)",
    "rgb(23, 190, 207)",
]

const TraceStyles = [
    "solid",
    "dash",
    "dot"
]

interface Props extends WithStyles<typeof styles> {
    figure: Figure;
    selected_time: Array<number>;
    onTimeSelected : (time: Array<number>) => void;
    plots: Array<PlotDef>;
};

type State = {
    graph_revision: number;
    layout: any;
    data: any;
};

type Trace = {
    name: string,
    data: Array<number>
}

export type PlotDef = {
    name: string;
    traces: Array<Trace>;
    times: Array<number>;
}

const MainPlot = withStyles(styles)(
    class extends Component<Props, State> {
        relayout_called: boolean

        constructor(props: Props) {
            super(props);
            this.state = {
                graph_revision: 1,
                layout: this.createLayout(),
                data: this.createTraces()
            }
            this.relayout_called = false;
        }

        onPlotRelayout=(event: PlotRelayoutEvent)=> {
            this.relayout_called = true;
        }

        componentDidUpdate(prevProps: Props, prevState: State) {
            if (this.props.selected_time != prevProps.selected_time) {
            /*
                let graph_time = this.props.figure.layout.xaxis.range
                if (graph_time[0] != this.props.selected_time[0] || graph_time[1] != this.props.selected_time[1]) {
                    this.props.figure.layout.xaxis.range = [this.props.selected_time[0], this.props.selected_time[1]];
                    this.props.figure.layout.xaxis.autorange = false;
                    (this.props.figure.layout as any).datarevision++;
                    this.updateGraphRevision()
                }
                this.zoomFigureY()
            */
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
            /*
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
            */
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

        createTraces() {
            let data: any[] = []
            let current_axis = 1;
            
            const num_plots = this.props.plots.length
            for (let plot_nr=0;plot_nr<num_plots;++plot_nr) {
                const plot = this.props.plots[plot_nr]
                for (let trace_nr=0;trace_nr<plot.traces.length;++trace_nr) {
                    const trace = plot.traces[trace_nr]
                    data.push({
                        name: plot.name + " " + trace.name,
                        type: "scatter",
                        y: trace.data,
                        x: plot.times,
                        yaxis: "y" + current_axis++,
                        line: {
                            color: TraceColors[plot_nr],
                            dash: TraceStyles[trace_nr]
                        }
                    })
                }
            }
            return data;
        }

        createLayout() {
            const graph_height = 300
            const num_plots = this.props.plots.length
            const total_height = graph_height * num_plots
            const spacing_pixels = 20.0
            const spacing = spacing_pixels / total_height
            const y_axis_spacing = 0.03
            let layout: any = {
                datarevision: 1,
                xaxis: {
                    fixedrange: false,
                    domain: [y_axis_spacing*3.0, 1]
                },
                height: total_height,
                margin: {
                    l: 0,
                    r: 0,
                    t: 30,
                    b: 30
                }
            }
            
            let domains: number[] = []
            let spacing_step = (1.0 + spacing) / num_plots;
            for (let i=0;i<num_plots+1;i++)
            {
                domains[i] = spacing_step*(num_plots-i);
            }

            let current_y_axis = 1
            let current_main_y_axis = 0
            let createYAxis = function(graph_num: number, pos: number, trace_nr: number) {
                const first = trace_nr == 0
                let axis: any = {
                    anchor: first ? "x" : "free",
                    side: "left",
                    position: y_axis_spacing*pos,
                    fixedrange: true,
                }
                if (!first) {
                    axis["overlaying"] = "y" + current_main_y_axis
                }
                else {
                    axis["domain"] = [domains[graph_num+1], domains[graph_num]-spacing]
                    axis["showline"] = true
                }
                return axis
            }

            for(let i=0;i<num_plots;i++) {
                current_main_y_axis = current_y_axis
                const plot = this.props.plots[i]
                const has_trace = function(name: string) {
                    for (let j=0;j<plot.traces.length;j++) {
                        if (plot.traces[j].name == name) {
                            return true;
                        }
                    }
                    return false;
                }
                let trace_nr = 0;
                if (has_trace("pos"))
                    layout["yaxis" + current_y_axis++] = createYAxis(i, 0.0, trace_nr++)
                if (has_trace("vel"))
                    layout["yaxis" + current_y_axis++] = createYAxis(i, 1.0, trace_nr++)
                if (has_trace("acc"))
                    layout["yaxis" + current_y_axis++] = createYAxis(i, 2.0, trace_nr++)
            }
            layout["template"] = theme
            return layout;
        }

        render() {
            return ( 
                <Plot
                    className={this.props.classes.graph}
                    data={this.state.data}
                    layout={this.state.layout}
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