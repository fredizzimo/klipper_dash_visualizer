import React, {Component} from "react";
import KlipperDashRenderer from './klipper_dash_renderer.react';
import {Tab, Tabs} from "./tabs.react"
import Plot, {Figure} from "react-plotly.js"
import {PlotRelayoutEvent, Datum, TypedArray} from "plotly.js";
import {range_start, range_end, get_min_max} from "../helpers"

type Props =
{
    id?: string;
    vertices: Float32Array;
    times: Float32Array;
    velocities: Float32Array;
    printer_dimensions: Array<Array<number>>;
    figure: Figure;
};

type State =
{
    activeTab: string
    selected_time: Array<number>;
    graph_revision: number
};

type PlotlyDataArray = Datum[] | Datum[][] | TypedArray

export default class App extends Component<Props, State> {
    figure: Figure
    relayout_called: boolean
    constructor(props: Props) {
        super(props);
        this.relayout_called = false;
        this.figure = this.props.figure;
        (this.figure.layout as any).datarevision = 1;
        this.state = {
            activeTab: "",
            selected_time: [null, null],
            graph_revision: 1
        }
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.state.selected_time != prevState.selected_time) {
            if (this.state.selected_time[0] != prevState.selected_time[0] ||
                this.state.selected_time[1] != prevState.selected_time[1])
            {
                this.zoomFigureY()
            }
        }
    }

    onTabSelected =(tab: string)=> {
        this.setState({activeTab: tab})
    }

    onPlotRelayout=(event: PlotRelayoutEvent)=> {
        this.relayout_called = true;
    }

    onPlotUpdate=(figure: Figure)=> {
        this.figure = figure;
        if (this.relayout_called) {
            this.relayout_called = false;
            this.setState({
                selected_time: [...this.figure.layout.xaxis.range]
            });
        }
    }

    onPlotInitialized=(figure: Figure)=> {
        this.figure = figure
        this.setState({
            selected_time: [...this.figure.layout.xaxis.range]
        });
    }

    zoomFigureY()
    {
        let fig = this.figure
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
        (this.figure.layout as any).datarevision++;
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
            <div id="main">
                <Tabs onTabSelected={this.onTabSelected}>
                    <Tab label="Graph">
                        <Plot
                            data={this.figure.data}
                            layout={this.figure.layout}
                            frames={this.figure.frames}
                            revision={this.state.graph_revision}
                            onRelayout={this.onPlotRelayout}
                            onUpdate={this.onPlotUpdate}
                            onInitialized={this.onPlotInitialized}
                        />
                    </Tab>
                    <Tab label="3D View">
                        <KlipperDashRenderer
                            id="renderer"
                            vertices={this.props.vertices}
                            times={this.props.times}
                            velocities={this.props.velocities}
                            printer_dimensions={this.props.printer_dimensions}
                            selected_time={this.state.selected_time}
                            active={this.state.activeTab=="3D View"}
                        />
                    </Tab>
                </Tabs>
            </div>
        )
    }
}