import React, {Component} from "react";
import KlipperDashRenderer from './KlipperDashRenderer.react';
import {Tab, Tabs} from "./Tabs.react"

type Props =
{
    id?: string;
    vertices: Float32Array;
    times: Float32Array;
    printer_dimensions: Array<Array<number>>;
    selected_time?: Array<number>;
    children: Node;
};

type State =
{
};

export default class App extends Component<Props, State> {
    static defaultProps = {
    }

    costructor() {
    }

    render() {
        return (
            <div id="main">
                <Tabs>
                    <Tab label="Graph">
                        {this.props.children}
                    </Tab>
                    <Tab label="3D View">
                        <KlipperDashRenderer
                            id="renderer"
                            vertices={this.props.vertices}
                            times={this.props.times}
                            printer_dimensions={this.props.printer_dimensions}
                            selected_time={this.props.selected_time}
                        />
                    </Tab>
                </Tabs>
            </div>
        )
    }
}