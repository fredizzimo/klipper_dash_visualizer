import React, {Component} from "react";
import KlipperDashRenderer from './KlipperDashRenderer.react';

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
                {this.props.children}
                <KlipperDashRenderer
                    id="renderer"
                    vertices={this.props.vertices}
                    times={this.props.times}
                    printer_dimensions={this.props.printer_dimensions}
                    selected_time={this.props.selected_time}
                />
            </div>
        )
    }
}