import React, { FunctionComponent, useEffect, useRef } from "react";
import * as fc from "d3fc"
import * as d3 from "d3" 
import { Theme, createStyles } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";


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
}


class D3FCPlot
{
    data = fc.randomGeometricBrownianMotion().steps(1e4)(1);

    extent = fc.extentLinear();

    xScale = d3.scaleLinear().domain([0, this.data.length - 1]);

    yScale = d3.scaleLinear().domain(this.extent(this.data));

    series = fc
        .seriesWebglLine()
        .xScale(this.xScale)
        .yScale(this.yScale)
        .crossValue((_: any, i: number) => i)
        .mainValue((d: number) => d)
        .defined(() => true)
        .equals((previousData: Array<number>) => previousData.length > 0);

    pixels: any = null;
    frame = 0;
    gl: any = null;

    constructor(container: any) {
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
                this.series(this.data);
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
}

const _Plot: FunctionComponent<Props> = (props) => {
    const ref = useRef()
    const fcref = useRef<D3FCPlot>()
    useEffect(() => {
        if (!fcref.current) {
            fcref.current = new D3FCPlot(ref.current)
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