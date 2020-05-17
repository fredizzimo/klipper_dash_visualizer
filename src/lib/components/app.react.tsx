import React, {Component} from "react";
import KlipperDashRenderer from './klipper_dash_renderer.react';
import {Tab, Tabs} from "./tabs.react"
import {Figure} from "react-plotly.js"
import MainPlot from "./main_plot"

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
};

export default class App extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            activeTab: "",
            selected_time: [null, null],
        }
    }

    onTabSelected =(tab: string)=> {
        this.setState({activeTab: tab})
    }

    onTimeSelected=(time: Array<number>)=> {
        this.setState({selected_time: time})
    }

    render() {
        return (
            <div id="main">
                <Tabs onTabSelected={this.onTabSelected}>
                    <Tab label="Graph">
                        <MainPlot
                            figure={this.props.figure}
                            selected_time={this.state.selected_time}
                            onTimeSelected={this.onTimeSelected}
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