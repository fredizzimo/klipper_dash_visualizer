import React, {Component} from "react";
import KlipperDashRenderer from './klipper_dash_renderer.react';
import {get_min_max} from "../helpers"
import { Tab, Tabs, AppBar, Box, Theme, createStyles, WithStyles, withStyles, ThemeProvider, createMuiTheme } from "@material-ui/core";
import { TabPanel } from "./tabs.react"
import { RangeSelect } from "./range_select"
import { Plot, PlotDef } from "./plot"

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
        overflowX: "hidden"
    },
    tab_panel: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        "&[hidden]": {
            display: "none"
        },
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

        render() {
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
                        <RangeSelect
                            selected_time={this.state.selected_time}
                            min_max_time={this.state.min_max_time}
                            onTimeSelected={this.onTimeSelected}
                        />
                        <TabPanel
                            className={this.props.classes.tab_panel}
                            index={this.state.activeTab}
                            value="graphs"
                        >
                            <Plot 
                                plot={this.props.plots[0]}
                                selected_time={this.state.selected_time}
                                min_max_time={this.state.min_max_time}
                                onTimeSelected={this.onTimeSelected}
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