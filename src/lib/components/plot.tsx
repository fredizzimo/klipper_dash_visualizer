import React, { FunctionComponent, useEffect, useRef } from "react";
import * as fc from "d3fc"
import * as d3 from "d3" 
import { Theme, createStyles } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import * as ld from "lodash"
import {range_start, range_end, get_min_max} from "../helpers"


const styles = (theme: Theme) => createStyles({
    graph: {
        height: "500px"
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


class D3FCPlot
{
    extent = fc.extentLinear();

    xScale = d3.scaleLinear()

    yScale = d3.scaleLinear()

    series = fc
        .seriesWebglLine()
        .xScale(this.xScale)
        .yScale(this.yScale)
        .crossValue((_: any, i: number) => this.plot.times[i])
        .mainValue((d: number) => d)
        .defined(() => true)
        .equals((previousData: Array<number>) => previousData.length > 0);

    pixels: any = null;
    frame = 0;
    gl: any = null;
    plot: PlotDef = null;
    container: any = null;

    constructor(container: any, props: Props) {
        this.container = container
        this.plot = props.plot
        this.xScale.domain(props.selected_time)
        this.zoomTraceY(0)

        d3.select(container)
            .on('click', () => {
                const domain = this.xScale.domain();
                const max = Math.round(domain[1] / 2);
                this.xScale.domain([0, max]);
                container.requestRedraw();
            })
            .on('measure', () => {
                const { width, height } = d3.event.detail;
                this.xScale.range([0, width]);
                this.yScale.range([height, 0]);

                this.gl = container.querySelector('canvas').getContext('webgl');
                this.series.context(this.gl);
            })
            .on('draw', () => {
                if (this.pixels == null) {
                    this.pixels = new Uint8Array(
                        this.gl.drawingBufferWidth * this.gl.drawingBufferHeight * 4
                    );
                }
                performance.mark(`draw-start-${this.frame}`);
                this.series(this.plot.traces[0].data);
                // Force GPU to complete rendering to allow accurate performance measurements to be taken
                this.gl.readPixels(
                    0,
                    0,
                    this.gl.drawingBufferWidth,
                    this.gl.drawingBufferHeight,
                    this.gl.RGBA,
                    this.gl.UNSIGNED_BYTE,
                    this.pixels
                );
                performance.measure(`draw-duration-${this.frame}`, `draw-start-${this.frame}`);
                this.frame++;
            });

        container.requestRedraw();
    }

    update = (props: Props) => {
        if (!ld.isEqual(this.xScale.domain(), props.selected_time)) {
            this.xScale.domain(props.selected_time)
            this.zoomTraceY(0)
            this.container.requestRedraw()
        } 
    }

    zoomTraceY  = (trace: number) => {
        const data = this.plot.traces[trace].data
        const time = this.xScale.domain()
        const times = this.plot.times

        const range = this.getTraceYRange(times, data, time[0], time[1])
        this.yScale.domain(range)
    }


    getTraceYRange = (xvals: ArrayLike<number>, yvals: ArrayLike<number>, start: number, end: number) => {
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
}

const _Plot: FunctionComponent<Props> = (props) => {
    const ref = useRef()
    const fcref = useRef<D3FCPlot>()
    useEffect(() => {
        if (!fcref.current) {
            fcref.current = new D3FCPlot(ref.current, props)
        } else {
            fcref.current.update(props)
        }
    })
    return (
        <d3fc-canvas
            use-device-pixel-ratio
            set-webgl-viewport
            class={props.classes.graph}
            ref={ref}
        />
    ) 
}

export const Plot = withStyles(styles)(_Plot)