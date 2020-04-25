import React, {Component} from "react";
import KlipperDashRenderer from './KlipperDashRenderer.react';
import {Tab, Tabs} from "./Tabs.react"

type Props =
{
    id?: string;
    vertices: Float32Array;
    times: Float32Array;
    velocities: Float32Array;
    printer_dimensions: Array<Array<number>>;
    selected_time?: Array<number>;
    children: Node;
};

type State =
{
    activeTab: string
};

export default class App extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            activeTab: ""
        }
    }

    onTabSelected =(tab: string)=> {
        this.setState({activeTab: tab})
    }

    render() {
        return (
            <div id="main">
                <Tabs onTabSelected={this.onTabSelected}>
                    <Tab label="Graph">
                        {this.props.children}
                    </Tab>
                    <Tab label="3D View">
                        <KlipperDashRenderer
                            id="renderer"
                            vertices={this.props.vertices}
                            times={this.props.times}
                            velocities={this.props.velocities}
                            printer_dimensions={this.props.printer_dimensions}
                            selected_time={this.props.selected_time}
                            active={this.state.activeTab=="3D View"}
                        />
                    </Tab>
                </Tabs>
            </div>
        )
    }
}