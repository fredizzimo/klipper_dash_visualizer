import React, { FunctionComponent, useEffect, useRef, useState, useCallback } from "react";
import * as fc from "d3fc"
import * as d3 from "d3" 
import { Theme, makeStyles } from "@material-ui/core";
import { WithStyles, withStyles, useTheme } from "@material-ui/styles";
import * as ld from "lodash"
import {range_start, range_end, get_min_max} from "../helpers"
import {scaleLinearFixedTicks, ScaleLinearFixedTicks} from "../linear_fixed_ticks_scale"
import { Axis } from "d3";

const axis_font_size = 10
const axis_tick_size = 6
const axis_tick_padding = 3
const plot_height = 500
const y_axis_ticks = 10
const x_axis_ticks = 10

const axis_height = axis_font_size + axis_tick_size + axis_tick_padding
const yaxis_width = 100

const trace_colors = [
    d3.color("rgb(31, 119, 180)"),
    d3.color("rgb(255, 127, 14)"),
    d3.color("rgb(44, 160, 44)"),
    d3.color("rgb(214, 39, 40)"),
    d3.color("rgb(148, 103, 189)"),
    d3.color("rgb(140, 86, 75)"),
    d3.color("rgb(227, 119, 194)"),
    d3.color("rgb(127, 127, 127)"),
    d3.color("rgb(188, 189, 34)"),
    d3.color("rgb(23, 190, 207)"),
]

const useStyles = makeStyles((theme: Theme) => ({
    container: {
        display: "grid",
        width: "100%",
        gridTemplateColumns: `${yaxis_width}px 1fr`,
        gridTemplateRows: `${plot_height}px ${axis_height}px`,
        gridTemplateAreas: ` 
            "yaxis   graph"
            ".       xaxis"
        `
    },
    graph: {
        gridArea: "graph"
    },
    xaxis: {
        gridArea: "xaxis",
        "& svg": {
            fontSize: axis_font_size
        }
    },
    yaxis: {
        gridArea: "yaxis",
        fontSize: axis_font_size,
        width: "100%",
        height: "100%",
        overflow: "visible"
    },
    yaxis_line: {
        stroke: "black",
    }
}));

type Trace = {
    name: string,
    data: Array<number>
}

export type PlotDef = {
    name: string;
    traces: Array<Trace>;
    times: Array<number>;
}

interface Props {
    plot: PlotDef
    selected_time: Array<number>
}

class PlotImpl {
    extent = fc.extentLinear();

    xScale = d3.scaleLinear()

    xAxis = fc.axisBottom(this.xScale)
        .ticks(x_axis_ticks)
        .tickSize(axis_tick_size)
        .tickPadding(axis_tick_padding)

    series: any[]
    y_scales: ScaleLinearFixedTicks[]
    y_axis: any
    container: any = null;

    render = (props: Props) => {
        const x_axis = useRef<any>()

        const main_canvas = useCallback((container: any) => {
            this.container = container
            d3.select(container)
                .on('measure', () => {
                    container.querySelector("canvas")
                    const { width, height, pixelRatio} = d3.event.detail;
                    this.xScale.range([0, width / pixelRatio ]);
                    for (let i=0;i<this.y_scales.length;i++) {
                        this.y_scales[i].range([height / pixelRatio, 0]);
                    }

                    const gl = container.querySelector('canvas').getContext('webgl');
                    for (let i=0;i<this.series.length;i++) {
                        this.series[i].context(gl);
                    }
                })
                .on('draw', () => {
                    for (let i=0;i<this.series.length;i++) {
                        this.series[i](props.plot.traces[i].data);
                    }
                    d3.select(x_axis.current)
                        .select("svg")
                        .call(this.xAxis)
                });
        }, [])

        const initialize_plot = () => {
            props.plot = props.plot
            const traces = props.plot.traces
            this.series = new Array(traces.length)
            this.y_scales = new Array<ScaleLinearFixedTicks>(traces.length)
            for(let i=0;i<traces.length;i++) {
                const y_scale = scaleLinearFixedTicks().niceValues(
                    [0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 0.9]
                )

                const series = fc
                    .seriesWebglLine()
                    .xScale(this.xScale)
                    .yScale(y_scale)
                    .crossValue((_: any, i: number) => props.plot.times[i])
                    .mainValue((d: number) => d)
                    .defined(() => true)
                    .equals((previousData: Array<number>) => previousData.length > 0)
                    .decorate((program: any) => {
                        const {r, g, b, opacity} = trace_colors[i].rgb()
                        fc.webglStrokeColor([r / 255, g / 255, b / 255, opacity])(program)
                    })

                this.y_scales[i] = y_scale
                this.series[i] = series
            }
            this.y_axis = fc.axisLeft(this.y_scales[0])
                .ticks(y_axis_ticks)
                .tickSize(axis_tick_size)
                .tickPadding(axis_tick_padding)
        }

        const updateSelectedTime = () => {
            this.xScale.domain(props.selected_time)
            zoomTraces()
            this.container.requestRedraw()
        }

        const zoomTraces = () => {
            const time = this.xScale.domain()
            const times = props.plot.times
            for (let trace=0;trace<props.plot.traces.length;trace++) {
                const data = props.plot.traces[trace].data
                const range = getTraceYRange(times, data, time[0], time[1])
                // Also call ticks here, so that the actual used domain is set
                this.y_scales[trace].domain(range).ticks(y_axis_ticks)
            }
        }

        const getTraceYRange = (xvals: ArrayLike<number>, yvals: ArrayLike<number>, start: number, end: number) => {
            const min_diff = 1e-12

            if (xvals.length == 0) {
                return [-min_diff, min_diff];
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
            if (diff < min_diff) {
                range_high += min_diff
            }
            return [range_low, range_high];
        }

        useEffect(() => {
            initialize_plot()
        }, [props.plot])


        useEffect(() => {
            updateSelectedTime()
        }, [props.selected_time, props.plot])

        const styles = useStyles()

        return (
            <div>
                <div className={styles.container}>
                    <d3fc-canvas
                        use-device-pixel-ratio
                        set-webgl-viewport
                        class={styles.graph}
                        ref={main_canvas}
                    />
                    <svg
                        className={styles.yaxis}
                    >
                    <path className={styles.yaxis_line}
                        d={
                            d3.line()([[yaxis_width, 0], [yaxis_width, plot_height]])
                        }
                    />

                    </svg>
                    <d3fc-svg
                        class={styles.xaxis}
                        ref={x_axis}
                    />
                </div>
            </div>
        ) 
    }
}

export const Plot: FunctionComponent<Props> = (props) => {
        const impl = useRef<PlotImpl>()
        if (impl.current == null) {
            impl.current = new PlotImpl()
        }
        return impl.current.render(props)
}