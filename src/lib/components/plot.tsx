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
import { newPlot } from "plotly.js";

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
        userSelect: "none", // Prevent selection on double click
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
    onTimeSelected : (time: Array<number>, add_undo: boolean) => void
    reset: () => void
    undo: () => void
}

type State = {
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

    container_rect: DOMRectReadOnly;
    x_axis_rect: DOMRectReadOnly
    y_axis_rect: DOMRectReadOnly
    graph_rect: DOMRectReadOnly
    selection_pos: number

    series: any[]

    resize_observer: ResizeObserver

    mouse_pos: number[] = [0, 0]
    brush_pos: number[] = null
    mouse_up_pos: number[] = null
    click_timer: number
    num_clicks = 0

    pixel_ratio: number

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

        this.updateScales()
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

    updateScales() {
        if (this.graph_rect == null) {
            return
        }
        const width = this.graph_rect.width
        const height = this.graph_rect.height
        this.x_scale.range([0, width]);
        for (let i=0;i<this.y_scales.length;i++) {
            this.y_scales[i].range([height, 0]);
        }
    }

    commitBrush() {
        const coord1 = this.getGraphCoordsFromMouse(this.mouse_pos[0], this.mouse_pos[1])
        const coord2 = this.getGraphCoordsFromMouse(this.brush_pos[0], this.brush_pos[1])

        const pos1 = ld.clamp(coord1.graph_relative_x, 0, this.graph_rect.width-1)
        const pos2 = ld.clamp(coord2.graph_relative_x, 0, this.graph_rect.width-1)
        const start = this.x_scale.invert(Math.min(pos1, pos2))
        const end = this.x_scale.invert(Math.max(pos1, pos2))

        this.props.onTimeSelected([start, end], true)

        this.brush_pos = null

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
                this.graph_rect = getRect(this.graph_container_ref.current, entry)
                this.graphCanvasResized(entry)
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
        this.updateScales()
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
        this.container_rect = rect
    }

    getGraphCoordsFromMouse(x: number, y: number) {
        const container_relative_x = x - this.container_rect.left
        const graph_relative_x = container_relative_x - this.graph_rect.left
        const container_relative_y = y - this.container_rect.top
        const graph_relative_y = container_relative_y - this.graph_rect.top
        let outside_x = false
        let outside_y = false
        if (graph_relative_x < 0 || graph_relative_x >= this.graph_rect.width)
            outside_x = true
        if (graph_relative_y < 0 || graph_relative_y >= this.graph_rect.height)
            outside_y = true
        const outside = outside_x || outside_y
        return {container_relative_x, container_relative_y, graph_relative_x,
            graph_relative_y, outside_x, outside_y, outside}
    }

    getAxisFont(size: number) {
        return ` ${size}px ${axis_font}`
    }

    getPixelLineWidth(width: number) {
        return Math.max(1, Math.round(width*this.pixel_ratio) / this.pixel_ratio)
    }

    getLinePosition(pos: number, line_width: number) {
        const device_pos = pos*this.pixel_ratio
        const device_line_width = line_width * this.pixel_ratio
        let line_start = device_pos - device_line_width*0.5 
        line_start = Math.round(line_start) / this.pixel_ratio
        const line_mid = line_start + line_width*0.5
        return line_mid
    }

    animate() {
        if (this.graph_rect != null) {

            this.container_rect = this.container_ref.current.getBoundingClientRect()
            this.renderCanvas()

            const ctx = this.canvas_ref.current.getContext("2d")

            const width = ctx.canvas.width
            const height = ctx.canvas.height

            ctx.clearRect(0, 0, width, height)
            this.pixel_ratio = window.devicePixelRatio

            if (this.y_scales.length > 0) {
                this.renderAxes(ctx)
                if (this.brush_pos != null && this.mouse_up_pos == null) {
                    this.renderBrushing(ctx)
                } else {
                    this.renderCrosshair(ctx)
                }
            }
        }

        requestAnimationFrame(() => this.animate())
    }

    renderCanvas() {
        const canvas = this.graph_canvas_ref.current
        const gl = canvas.getContext("webgl");
        for (let i=0;i<this.series.length;i++) {
            if (this.series[i].context() != gl) {
                this.series[i].context(gl)
            }
            this.series[i].lineWidth(this.pixel_ratio)
            this.series[i](this.props.plot.traces[i].data);
        }
    }

    renderAxes(ctx: CanvasRenderingContext2D) {

        this.renderXAxis(ctx)
        this.renderYAxis(ctx)
    }

    renderAxisLine(ctx: CanvasRenderingContext2D, scale: d3.ScaleLinear<number, number>,
            ticks_pos: number[], position: number, offset: number, vertical: boolean) {
        const range = scale.range()

        const tick_line_end = vertical ? position - axis_tick_size : position + axis_tick_size

        ctx.lineWidth = this.getPixelLineWidth(1)
        ctx.strokeStyle = "black"

        const range_start = range[0] + offset
        const range_end = range[1] + offset

        const pixel_pos = this.getLinePosition(position, ctx.lineWidth)

        ctx.beginPath()
        if (vertical) {
            ctx.moveTo(pixel_pos, range_start)
            ctx.lineTo(pixel_pos, range_end)
        }
        else {
            ctx.moveTo(range_start, pixel_pos)
            ctx.lineTo(range_end, pixel_pos)
        }

        for (let i=0;i<ticks_pos.length; i++) {
            const tick_pos = this.getLinePosition(ticks_pos[i] + offset, ctx.lineWidth)
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
        ctx.font = this.getAxisFont(axis_font_size)
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
        const top = this.graph_rect.top
        const bottom = this.graph_rect.bottom
        const left = this.graph_rect.left
        const right = this.graph_rect.right

        const coords = this.getGraphCoordsFromMouse(this.mouse_pos[0], this.mouse_pos[1])
        if (coords.outside)
            return

        ctx.lineWidth = this.getPixelLineWidth(1)
        ctx.strokeStyle = "black"
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        const x = this.getLinePosition(coords.container_relative_x, ctx.lineWidth)
        const y = this.getLinePosition(coords.container_relative_y, ctx.lineWidth)
        ctx.moveTo(x, top)
        ctx.lineTo(x, bottom)
        ctx.moveTo(left, y)
        ctx.lineTo(right, y)
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    renderBrushing(ctx: CanvasRenderingContext2D) {
        const top = this.graph_rect.top
        const bottom = this.graph_rect.bottom
        const left = this.graph_rect.left
        const right = this.graph_rect.right
        const start_coords = this.getGraphCoordsFromMouse(this.brush_pos[0], this.brush_pos[1])
        const end_coords = this.getGraphCoordsFromMouse(this.mouse_pos[0], this.mouse_pos[1])
        const pos1 = ld.clamp(start_coords.graph_relative_x, 0, this.graph_rect.width-1)
        const pos2 = ld.clamp(end_coords.graph_relative_x, 0, this.graph_rect.width-1)
        const start_pos = Math.min(pos1, pos2) + left
        const end_pos = Math.max(pos1, pos2) + left
        const width = Math.max(1, end_pos-start_pos)
        ctx.fillStyle = "black"
        ctx.globalAlpha = 0.2
        ctx.fillRect(start_pos, top, width, bottom-top)
        ctx.globalAlpha = 1.0

    }

    mouseMove = (e: MouseEvent) => {
        this.mouse_pos = [e.clientX, e.clientY]
    }

    mouseLeave = (e: MouseEvent) => {
        this.container_rect = this.container_ref.current.getBoundingClientRect()

        const left_dist = Math.abs(this.container_rect.left - this.mouse_pos[0])
        const right_dist = Math.abs(this.container_rect.right - this.mouse_pos[0])
        const top_dist = Math.abs(this.container_rect.top - this.mouse_pos[1])
        const bottom_dist = Math.abs(this.container_rect.bottom - this.mouse_pos[1])
        if (left_dist < right_dist) {
            this.mouse_pos[0] = this.container_rect.left
        }
        else {
            this.mouse_pos[0] = this.container_rect.right
        }
        if (top_dist < bottom_dist) {
            this.mouse_pos[1] = this.container_rect.top
        }
        else {
            this.mouse_pos[1] = this.container_rect.bottom
        }
    }

    mouseDown = (e: MouseEvent) => {
        this.container_rect = this.container_ref.current.getBoundingClientRect()

        const click_delay = 500
        const minimum_click_move_distance = 10

        this.mouse_pos = [e.clientX, e.clientY]
        const coords = this.getGraphCoordsFromMouse(e.clientX, e.clientY) 
        if (this.click_timer != null) {
            window.clearTimeout(this.click_timer)
        }
        this.mouse_up_pos = null
        if (!coords.outside_y) {
            this.num_clicks++
            if (this.num_clicks == 3) {
                this.brush_pos = null
                this.num_clicks = 0
                this.props.reset()
            }
            else {
                if (this.num_clicks == 2) {
                    this.brush_pos = null
                    this.props.undo()
                }
                else if (this.brush_pos == null) {
                    this.brush_pos = [e.clientX, e.clientY]
                }

                this.click_timer = window.setTimeout(() => {
                    if (this.mouse_up_pos != null) {
                        if (this.brush_pos != null) {
                            if (Math.abs(this.brush_pos[0] - this.mouse_up_pos[0]) > minimum_click_move_distance) {
                                this.mouse_pos = this.mouse_up_pos
                                this.commitBrush()
                            }
                        }
                        this.brush_pos = null
                    }
                    this.num_clicks = 0
                }, click_delay)
            }
        } else {
            this.num_clicks = 0
        }
    }

    mouseUp = (e: MouseEvent) => {
        this.container_rect = this.container_ref.current.getBoundingClientRect()

        this.mouse_pos = [e.clientX, e.clientY]
        this.mouse_up_pos = [e.clientX, e.clientY]
        if (this.num_clicks == 0 && this.brush_pos != null) {
            this.commitBrush()
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
        document.addEventListener("mouseleave", this.mouseLeave)
        document.addEventListener("mousedown", this.mouseDown)
        document.addEventListener("mouseup", this.mouseUp)
        requestAnimationFrame(() => this.animate())
    }

    componentWillUnmount() {
        this.resize_observer.disconnect()
        document.removeEventListener("mousemove", this.mouseMove)
        document.removeEventListener("mouseleave", this.mouseLeave)
        document.removeEventListener("mousedown", this.mouseDown)
        document.removeEventListener("mouseup", this.mouseUp)
        if (this.click_timer != null) {
            window.clearTimeout(this.click_timer)
        }
    }

    componentDidUpdate() {
    }

    render() {
        if (this.plot != this.props.plot) {
            this.initialize_plot()
        }
        if (this.selected_time != this.props.selected_time) {
            this.updateSelectedTime()
        }

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