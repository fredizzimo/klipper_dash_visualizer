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

// a random number generator
const generator = fc.randomGeometricBrownianMotion()
  .steps(11);

// some formatters
const dateFormatter = d3.timeFormat('%b');
const valueFormatter = d3.format('$.0f');

const yExtent = fc.extentLinear()
    .include([0])
    .pad([0, 0.5])
    .accessors([(d: any) => d.sales]);

const data = {
    // target values for the annotations
    targets: [{
        name: 'low',
        value: 4.5
    }, {
        name: 'high',
        value: 7.2
    }],
    // randomly generated sales data
    sales: generator(1).map((d: any, i: number) => ({
        month: dateFormatter(new Date(0, i + 1, 0)),
        sales: d + i / 2
    }))
};

const bar = fc.autoBandwidth(fc.seriesSvgBar())
    .crossValue((d: any) => d.month)
    .mainValue((d: any) => d.sales)
    .align('left');

const chart = fc.chartCartesian(
    d3.scaleBand(),
    d3.scaleLinear()
)
    .chartLabel('2015 Cumulative Sales')
    .xDomain(data.sales.map((d: any)=> d.month))
    .yDomain(yExtent(data.sales))
    .xPadding(0.2)
    .yTicks(5)
    .yTickFormat(valueFormatter)
    .yLabel('Sales (millions)')
    .yNice();

const annotation = fc.annotationSvgLine()
  .value((d: any) => d.value);

const multi = fc.seriesSvgMulti()
    .series([bar, annotation])
    .mapping((data: any, index: any, series: Array<any>) => {
        switch (series[index]) {
            case bar:
                return data.sales;
            case annotation:
                return data.targets;
        }
    });

chart.svgPlotArea(multi);

 bar.decorate((selection: any) => {
    // The selection passed to decorate is the one which the component creates
    // within its internal data join, here we use the update selection to
    // apply a style to 'path' elements created by the bar series
    selection.select('.bar > path')
        .style('fill', (d: any) => d.sales < data.targets[0].value ? 'inherit' : '#0c0');
});

annotation.decorate((selection: any) => {
    selection.enter()
        .select('g.left-handle')
        .append('text')
        .attr('x', 5)
        .attr('y', -5);
    selection.select('g.left-handle text')
        .text((d: any) => d.name + ' - ' + valueFormatter(d.value) + 'M');
});

const _Plot: FunctionComponent<Props> = (props) => {
    const ref = useRef()
    useEffect(() => {
        d3.select(ref.current)
            .datum(data)
            .call(chart);
    })
    return <div 
        className={props.classes.graph}
        ref={ref}
    />
}

export const Plot = withStyles(styles)(_Plot)