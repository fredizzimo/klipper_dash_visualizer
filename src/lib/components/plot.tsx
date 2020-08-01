import React, { FunctionComponent, useEffect, useRef, useState, useCallback, Component, createRef } from "react";
import * as fc from "d3fc"
import * as d3 from "d3" 
import { Theme, makeStyles } from "@material-ui/core";
import { WithStyles, withStyles, useTheme, createStyles } from "@material-ui/styles";
import * as ld from "lodash"
import {range_start, range_end, get_min_max} from "../helpers"
import {scaleLinearFixedTicks, ScaleLinearFixedTicks} from "../linear_fixed_ticks_scale"
import { Axis, text, ScaleLinear } from "d3";
import zIndex from "@material-ui/core/styles/zIndex";

const axis_font_size = 10
const axis_font = "sans-serif"
const axis_tick_size = 6
const axis_tick_padding = 3
const axis_min_label_spacing = axis_font_size / 2
const y_axis_ticks = 10
const x_axis_ticks = 10

const axis_height = axis_font_size + axis_tick_size + axis_tick_padding

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

const styles = (theme: Theme) => createStyles({
    grid: {
        position: "relative",
        display: "grid",
        padding: "10px",
        gridTemplateColumns: `120px 1fr`,
        gridTemplateRows: `500px ${axis_height}px`,
        gridTemplateAreas: ` 
            "yaxis   graph"
            ".       xaxis"
        `
    },
    canvas: {
        position: "absolute",
        height: "100%",
        width: "100%",
        zIndex: 1
    },
    graph: {
        gridArea: "graph",
        position: "relative",
        display: "block",
        "& canvas": {
            position: "absolute",
            height: "100%",
            width: "100%",
            zIndex: 0
        }
    },
    xaxis: {
        gridArea: "xaxis",
    },
    yaxis: {
        gridArea: "yaxis",
    },
});

type Trace = {
    name: string,
    data: Array<number>
}

export type PlotDef = {
    name: string;
    traces: Array<Trace>;
    times: Array<number>;
}

interface Props extends WithStyles<typeof styles>{
    plot: PlotDef
    selected_time: Array<number>
}

type State = {
    graph_width: number;
    graph_height: number;
    container_rect: DOMRectReadOnly;
    selection_pos: number
}

class PlotImpl extends Component<Props, State> {
    extent = fc.extentLinear();

    x_scale = d3.scaleLinear()
    y_scales: ScaleLinearFixedTicks[]

    xAxis = fc.axisBottom(this.x_scale)
        .ticks(x_axis_ticks)
        .tickSize(axis_tick_size)
        .tickPadding(axis_tick_padding)

    plot: PlotDef
    selected_time: number[]

    graph_canvas_ref = createRef<HTMLCanvasElement>()
    graph_container_ref = createRef<HTMLDivElement>()

    canvas_ref = createRef<HTMLCanvasElement>()
    container_ref = createRef<HTMLDivElement>()

    x_axis_ref = createRef<HTMLDivElement>()
    y_axis_ref = createRef<HTMLDivElement>()

    x_axis_rect: DOMRectReadOnly
    y_axis_rect: DOMRectReadOnly
    graph_rect: DOMRectReadOnly

    series: any[]

    resize_observer: ResizeObserver

    constructor(props: Props) {
        super(props)
        this.state = {
            graph_width: 0,
            graph_height: 0,
            container_rect: DOMRectReadOnly.fromRect({x:0, y:0, width:0, height: 0}),
            selection_pos: 0
        }
    }

    initialize_plot() {
        const props = this.props
        const traces = props.plot.traces
        this.plot = props.plot
        this.selected_time = null
        this.series = new Array(traces.length)
        this.y_scales = new Array<ScaleLinearFixedTicks>(traces.length)
        for(let i=0;i<traces.length;i++) {
            const y_scale = scaleLinearFixedTicks().niceValues(
                [0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 0.9]
            )

            const series = fc
                .seriesWebglLine()
                .xScale(this.x_scale)
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

        this.updateScales(this.state.graph_width, this.state.graph_height)
    }

    updateSelectedTime() {
        this.selected_time = this.props.selected_time
        this.x_scale.domain(this.props.selected_time)
        this.zoomTraces()
    }

    zoomTraces() {
        const props = this.props
        const time = this.x_scale.domain()
        const times = props.plot.times
        for (let trace=0;trace<props.plot.traces.length;trace++) {
            const data = props.plot.traces[trace].data
            const range = this.getTraceYRange(times, data, time[0], time[1])
            // Also call ticks here, so that the actual used domain is set
            this.y_scales[trace].domain(range).ticks(y_axis_ticks)
        }
    }

    getTraceYRange (xvals: ArrayLike<number>, yvals: ArrayLike<number>, start: number, end: number) {
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

    updateScales(width: number, height: number) {
        if (width == 0 || height == 0) {
            return 
        }
        this.x_scale.range([0, width]);
        for (let i=0;i<this.y_scales.length;i++) {
            this.y_scales[i].range([height, 0]);
        }
    }


    elementsResized(entries: readonly ResizeObserverEntry[]) {
        const getRect = (element: HTMLDivElement, entry: ResizeObserverEntry) => {
            const x = element.offsetLeft
            const y = element.offsetTop
            const rect = entry.contentRect
            const width = rect.width
            const height = rect.height
            return DOMRectReadOnly.fromRect({x, y, width, height})
        }
        for (let i=0;i<entries.length;i++) {
            const entry = entries[i]
            if (entry.target == this.graph_container_ref.current) {
                this.graphCanvasResized(entry)
                this.graph_rect = getRect(this.graph_container_ref.current, entry)
            } else if(entry.target == this.container_ref.current) {
                this.canvasResized(entry)
            } else if (entry.target == this.x_axis_ref.current) {
                this.x_axis_rect = getRect(this.x_axis_ref.current, entry)
            } else if (entry.target == this.y_axis_ref.current) {
                this.y_axis_rect = getRect(this.y_axis_ref.current, entry)
            }
        }
    }

    graphCanvasResized = (entry: ResizeObserverEntry) => {
        const canvas = this.graph_canvas_ref.current
        const context = canvas.getContext("webgl");
        const pixel_ratio = window.devicePixelRatio
        const width = entry.contentRect.width
        const height = entry.contentRect.height
        const pixel_width = width * pixel_ratio
        const pixel_height = height * pixel_ratio
        canvas.width = pixel_width
        canvas.height = pixel_height
        context.viewport(0, 0, pixel_width, pixel_height)
        this.updateScales(width, height)
        this.setState({graph_width: width, graph_height: height})
    }

    canvasResized = (entry: ResizeObserverEntry) => {
        const canvas = this.canvas_ref.current
        const pixel_ratio = window.devicePixelRatio
        const rect = this.container_ref.current.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        const pixel_width = width * pixel_ratio
        const pixel_height = height * pixel_ratio
        canvas.width = pixel_width
        canvas.height = pixel_height
        const context = canvas.getContext("2d");
        context.scale(pixel_ratio, pixel_ratio)
        this.setState({container_rect: rect})
    }

    getAxisFont(size: number) {
        return ` ${size}px ${axis_font}`
    }

    renderCanvas() {
        requestAnimationFrame(() => {
            const canvas = this.graph_canvas_ref.current
            const gl = canvas.getContext("webgl");
            for (let i=0;i<this.series.length;i++) {
                if (this.series[i].context() != gl) {
                    this.series[i].context(gl)
                }
                this.series[i](this.props.plot.traces[i].data);
            }
        })
    }

    renderAxes(ctx: CanvasRenderingContext2D) {
        const width = ctx.canvas.width
        const height = ctx.canvas.height

        ctx.clearRect(0, 0, width, height)

        if (this.y_scales.length == 0) {
            return 
        }
        if (this.state.graph_width == 0 || this.state.graph_height==0) {
            return
        }

        this.renderXAxis(ctx)
        this.renderYAxis(ctx)
    }

    renderAxisLine(ctx: CanvasRenderingContext2D, scale: d3.ScaleLinear<number, number>,
            ticks_pos: number[], position: number, offset: number, vertical: boolean) {
        const range = scale.range()

        const tick_line_end = vertical ? position - axis_tick_size : position + axis_tick_size

        ctx.lineWidth = 1
        ctx.strokeStyle = "black"

        const range_start = range[0] + offset
        const range_end = range[1] + offset


        ctx.beginPath()
        if (vertical) {
            ctx.moveTo(position, range_start)
            ctx.lineTo(position, range_end)
        }
        else {
            ctx.moveTo(range_start, position)
            ctx.lineTo(range_end, position)

        }

        for (let i=0;i<ticks_pos.length; i++) {
            const tick_pos = ticks_pos[i] + offset
            if (vertical) {
                ctx.moveTo(tick_line_end, tick_pos)
                ctx.lineTo(position, tick_pos)
            } else {
                ctx.moveTo(tick_pos, tick_line_end)
                ctx.lineTo(tick_pos, position)
            }
        }

        ctx.stroke()
    }

    renderXAxis(ctx: CanvasRenderingContext2D) {
        const scale = this.x_scale
        const ticks = scale.ticks(x_axis_ticks)
        const ticks_pos = ld.map(ticks, (tick: number) => scale(tick))
        const offset = this.x_axis_rect.left
        const top = this.x_axis_rect.top
        this.renderAxisLine(ctx, this.x_scale, ticks_pos, top, offset, false)
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillStyle = "black"
        const tick_format = scale.tickFormat(y_axis_ticks)
        const labels = ld.map(ticks, (tick: number) => tick_format(tick))
        const y_pos = top + axis_tick_size + axis_tick_padding

        for (let i=0; i < ticks.length; i++) {
            const x_pos =  ticks_pos[i] + offset
            ctx.fillText(labels[i], x_pos, y_pos)
        }
    }

    renderYAxis(ctx: CanvasRenderingContext2D) {
        const top = this.y_axis_rect.top
        const pos = this.y_axis_rect.right
        const first_scale = this.y_scales[0]
        const ticks = first_scale.ticks(y_axis_ticks)
        const ticks_pos = ld.map(ticks, (tick: number) => first_scale(tick))

        this.renderAxisLine(ctx, first_scale, ticks_pos, pos, top, true)

        const tick_line_left = pos - axis_tick_size
        const label_right = tick_line_left - axis_tick_padding
        const label_width = (label_right - this.y_axis_rect.left) / this.y_scales.length

        const tick_format = first_scale.tickFormat(y_axis_ticks)

        ctx.textAlign = "right"
        ctx.textBaseline = "middle"
        for (let trace_nr=0; trace_nr < this.y_scales.length; trace_nr++) {
            const scale = this.y_scales[trace_nr]
            const ticks = scale.ticks(y_axis_ticks)
            const x_pos = label_right - trace_nr * label_width
            const color = trace_colors[trace_nr].hex()
            ctx.fillStyle = color
            const labels = ld.map(ticks, (tick: number) => tick_format(tick))

            ctx.font = this.getAxisFont(axis_font_size)
            const max_length = ld.max(ld.map(labels, (label: string) => ctx.measureText(label).width ))
            let text_scale=1.0
            const max_width = label_width - axis_min_label_spacing
            if (max_length > max_width) {
                text_scale = max_width / max_length
            }
            ctx.font = this.getAxisFont(axis_font_size*text_scale)
            
            for (let i=0;i<ticks.length; i++) {
                const y_pos = ticks_pos[i] + top
                ctx.fillText(labels[i], x_pos, y_pos)
            }
        }
    }

    renderCrosshair(ctx: CanvasRenderingContext2D) {
        const left = this.graph_rect.left
        const top = this.graph_rect.top
        const bottom = this.graph_rect.bottom
        const stroke_pos = left + this.state.selection_pos
        if (this.state.selection_pos > 0 && this.state.selection_pos < this.graph_rect.width) {
            ctx.lineWidth = 1
            ctx.strokeStyle = "black"
            ctx.beginPath()
            ctx.moveTo(stroke_pos, top)
            ctx.lineTo(stroke_pos, bottom)
            ctx.stroke()
        }
    }

    mouseMove = (e: MouseEvent) => {
        const container_rect = this.state.container_rect
        if (container_rect.width > 0 && container_rect.height > 0) {
            const x = e.clientX - container_rect.left
            const y = e.clientY - container_rect.top
            const graph_x = x - this.graph_rect.left
            const graph_y = y - this.graph_rect.top
            if (graph_y > 0 && graph_y < this.graph_rect.height) {
                const selection_pos = ld.clamp(graph_x, 0, this.graph_rect.width)
                this.setState( (prev_state: State) => {
                    if (prev_state.selection_pos != selection_pos) {
                        return {selection_pos}
                    }
                })
            } else {
                this.setState( (prev_state: State) => {
                    if (prev_state.selection_pos != 0) {
                        return {selection_pos: 0}
                    }
                })
            }
        }
    }

    componentDidMount() {
        this.resize_observer = new ResizeObserver((entries: readonly ResizeObserverEntry[]) =>
            this.elementsResized(entries))

        this.resize_observer.observe(this.graph_container_ref.current)
        this.resize_observer.observe(this.container_ref.current)
        this.resize_observer.observe(this.x_axis_ref.current)
        this.resize_observer.observe(this.y_axis_ref.current)
        document.addEventListener("mousemove", this.mouseMove)
    }

    componentWillUnmount() {
        this.resize_observer.disconnect()
        document.removeEventListener("mousemove", this.mouseMove)
    }

    componentDidUpdate() {
        requestAnimationFrame(() => {
            const ctx = this.canvas_ref.current.getContext("2d")
            this.renderCanvas()
            this.renderAxes(ctx)
            this.renderCrosshair(ctx)
        })
    }

    render() {
        if (this.plot != this.props.plot) {
            this.initialize_plot()
        }
        if (this.selected_time != this.props.selected_time) {
            this.updateSelectedTime()
        }

        console.log(this.state.selection_pos)

        const styles = this.props.classes

        return (
            <div>
                <div className={styles.grid} ref={this.container_ref}>
                    <div className={styles.graph} ref={this.graph_container_ref}>
                        <canvas ref={this.graph_canvas_ref}/>
                    </div>
                    <div className={styles.yaxis} ref={this.y_axis_ref}>
                    </div>
                    <div className={styles.xaxis} ref={this.x_axis_ref}>
                    </div>
                    <canvas ref={this.canvas_ref} className={styles.canvas}/>
                </div>
            </div>
        ) 
    }
}

export const Plot = withStyles(styles)(PlotImpl)