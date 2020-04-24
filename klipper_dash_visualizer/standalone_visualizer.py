from __future__ import absolute_import

import pkg_resources
import os
import numpy as np
import plotly.graph_objects as go
from plotly.colors import DEFAULT_PLOTLY_COLORS
from dash import Dash
from dash.dependencies import Input, Output, State
import dash_core_components as dcc
import dash_html_components as html
from .App import App

instructions = \
"""
Click and use the mouse and arrow keys to zoom and move around.
Click outside to when done
"""

def graph_steppers(data):
    fig = go.Figure()
    layout = {}
    graph_height = 300
    num_plots = len(data.steppers) + 1
    total_height = graph_height * num_plots
    spacing_pixels = 20.0

    spacing = spacing_pixels / total_height
    domains = list(reversed(np.linspace(0, 1+spacing, num_plots+1)))
    y_axis_spacing = 0.03

    def add_subgraph(num, time, pos, vel, acc):
        num_axes = len(fig.data)
        y1 = "y%i" % (num_axes+1)

        def axis_template():
            def f(pos):
                return go.layout.YAxis(
                anchor="x",
                domain=(domains[num+1], domains[num]-spacing),
                showline=True,
                fixedrange=True,
                position=y_axis_spacing*pos
            )
            yield f
            def f2(pos):
                return go.layout.YAxis(
                    anchor="free",
                    overlaying=y1,
                    side="left",
                    position=y_axis_spacing*pos,
                    fixedrange=True
                )
            while True:
                yield f2

        axis = axis_template()
        yaxis = ("yaxis%i" % (i,) for i in xrange(num_axes+1, 1000))
        y = ("y%i" % (i,) for i in xrange(num_axes+1, 1000))

        color = DEFAULT_PLOTLY_COLORS[num]
        if pos is not None:
            fig.add_trace(go.Scatter(
                x=time, y=pos[0],
                name="%s pos" % pos[1],
                line=go.scatter.Line(color=color),
                yaxis=y.next()
            ))
            layout[yaxis.next()] = axis.next()(0.0)
        if vel is not None:
            fig.add_trace(go.Scatter(
                x=time, y=vel[0],
                name="%s vel" % vel[1],
                line=go.scatter.Line(dash="dash", color=color),
                yaxis=y.next()
            ))
            layout[yaxis.next()] = axis.next()(1.0)
        if acc is not None:
            fig.add_trace(go.Scatter(
                x=time, y=acc[0],
                name="%s acc" % acc[1],
                line=go.scatter.Line(dash="dot", color=color),
                yaxis=y.next()
            ))
            layout[yaxis.next()] = axis.next()(2.0)

    for i, stepper in enumerate(data.steppers):
        add_subgraph(i, stepper.time,
            (stepper.position, "%s pos" % stepper.name),
            (stepper.velocity, "%s vel" % stepper.name),
            (stepper.acceleration, "%s acc" % stepper.name)
        )

    add_subgraph(num_plots-1, data.times,
        None,
        (data.velocities, "Velocity"),
        (data.accelerations, "Acceleration")
    )

    layout["xaxis"] = go.layout.XAxis(
        fixedrange=False,
        domain=[y_axis_spacing*3.0,1]
    )

    layout["height"] = total_height
    layout["margin"] = go.layout.Margin(l=0, r=0, t=30, b=30)

    fig.update_layout(layout)
    return fig

class StandaloneVisualizer(object):
    def __init__(self, data, printer_dimensions):
        assets_folder = pkg_resources.resource_filename("klipper_dash_visualizer", "assets")
        assets_folder = os.path.abspath(assets_folder)
        app = Dash(
            assets_folder=assets_folder,
            include_assets_files=False,
            external_stylesheets= [
                "/assets/standalone.css"
            ]
        )
        app.layout = App(
            id="app",
            children = [
                dcc.Graph(
                    id="steppers",
                    figure=graph_steppers(data),
                )
            ],
            vertices=data.spatial_coordinates.ravel(),
            printer_dimensions=printer_dimensions,
            times=data.times
        )

        app.clientside_callback(
            """
            function(relayoutData, fig) {
                return window.klipper_dash_visualizer.zoom_figure_y(fig);
            }
            """,
            Output("steppers", "figure"),
            [Input("steppers", "relayoutData")],
            [State("steppers", "figure")]
        )

        app.clientside_callback(
            """
            function(relayoutData, fig) {
                return [...fig.layout.xaxis.range];
            }
            """,
            Output("app", "selected_time"),
            [Input("steppers", "relayoutData")],
            [State("steppers", "figure")]
        )
        self.app = app


    def run(self, **kwargs):
        self.app.run_server(**kwargs)