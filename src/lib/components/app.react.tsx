import React, {Component} from "react";
import KlipperDashRenderer from './klipper_dash_renderer.react';
import MainPlot, { PlotDef } from "./main_plot"
import {get_min_max} from "../helpers"
import { Tab, Tabs, AppBar, Box, Theme, createStyles, WithStyles, withStyles, ThemeProvider, createMuiTheme } from "@material-ui/core";
import { TabPanel } from "./tabs.react"
import { RelativeSlider} from "./relative_slider"

const styles = (theme: Theme) => createStyles({
    "@global": {
        "html, body": {
            margin: "0",
            padding: "0"
        }
    },
    root: {
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "red"
    },
    tab_panel: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        "&[hidden]": {
            display: "none"
        }
    },
});

const theme = createMuiTheme()

interface Props extends WithStyles<typeof styles> {
    id?: string;
    vertices: Float32Array;
    times: Float32Array;
    velocities: Float32Array;
    printer_dimensions: Array<Array<number>>;
    plots: Array<PlotDef>;
};

type State =
{
    activeTab: string
    selected_time: Array<number>;
    min_max_time: Array<number>;
};


const App = withStyles(styles)(
    class extends Component<Props, State> {
        constructor(props: Props) {
            super(props);
            const min_max_time = get_min_max(this.props.times, 0, this.props.times.length)
            this.state = {
                activeTab: "graphs",
                selected_time: min_max_time,
                min_max_time: min_max_time,
            }
        }

        componentDidUpdate(prevProps: Props, prevState: State) {
            if (this.props.times != prevProps.times) {
                this.setState({
                    min_max_time: get_min_max(this.props.times, 0, this.props.times.length)
                })
            }
        }

        onTabSelected =(event: React.ChangeEvent<{}>, tab: string)=> {
            this.setState({activeTab: tab})
        }

        onTimeSelected=(time: Array<number>)=> {
            this.setState({selected_time: time})
        }

        onCurrentTimeChanged=(time: number)=> {
            const span = this.state.selected_time[1] - this.state.selected_time[0]
            const half_span = span*0.5
            const start = time - half_span
            const end = time + half_span
            this.setState({selected_time: [start, end]})
        }

        render() {
            const current_time = 0.5 * (this.state.selected_time[0] + this.state.selected_time[1])
            return (
                <ThemeProvider
                    theme={theme}
                >
                    <Box className={this.props.classes.root}>
                        <AppBar position="static">
                            <Tabs
                                value={this.state.activeTab}
                                onChange={this.onTabSelected}
                            >
                                <Tab 
                                    label="Graph"
                                    value="graphs"
                                />
                                <Tab
                                    label="3D View"
                                    value="renderer"
                                />
                            </Tabs>
                        </AppBar>
                        <RelativeSlider
                           min={this.state.min_max_time[0]} 
                           max={this.state.min_max_time[1]}
                           value={current_time}
                           onChange={this.onCurrentTimeChanged}
                        />
                        <TabPanel
                            className={this.props.classes.tab_panel}
                            index={this.state.activeTab}
                            value="graphs"
                        >
                            <MainPlot
                                selected_time={this.state.selected_time}
                                onTimeSelected={this.onTimeSelected}
                                plots={this.props.plots}
                            />
                        </TabPanel>
                        <TabPanel
                            className={this.props.classes.tab_panel}
                            index={this.state.activeTab}
                            value="renderer"
                        >
                            <KlipperDashRenderer
                                id="renderer"
                                vertices={this.props.vertices}
                                times={this.props.times}
                                velocities={this.props.velocities}
                                printer_dimensions={this.props.printer_dimensions}
                                selected_time={this.state.selected_time}
                                active={this.state.activeTab=="3D View"}
                            />
                        </TabPanel>
                    </Box>
                </ThemeProvider>
            )
        }
    }
)

export default App;