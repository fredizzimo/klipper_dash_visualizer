from __future__ import absolute_import

import pkg_resources
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


def graph_steppers(steppers):
    fig = go.Figure()
    layout = {}
    graph_height = 300
    total_height = graph_height * len(steppers)
    spacing_pixels = 20.0

    spacing = spacing_pixels / total_height
    domains = list(reversed(np.linspace(0, 1+spacing, len(steppers)+1)))
    y_axis_spacing = 0.03

    for i, stepper in enumerate(steppers):
        yaxis1 = "yaxis%i" % (3*i+1)
        yaxis2 = "yaxis%i" % (3*i+2)
        yaxis3 = "yaxis%i" % (3*i+3)
        y1 = "y%i" % (3*i+1)
        y2 = "y%i" % (3*i+2)
        y3 = "y%i" % (3*i+3)
        color = DEFAULT_PLOTLY_COLORS[i]
        fig.add_trace(go.Scatter(
            x=stepper.steps[:,0], y=stepper.steps[:,1],
            name="%s pos" % stepper.name,
            line=go.scatter.Line(color=color),
            yaxis=y1
        ))
        fig.add_trace(go.Scatter(
            x=stepper.steps[:,0], y=stepper.velocity,
            name="%s vel" % stepper.name,
            line=go.scatter.Line(dash="dash", color=color),
            yaxis=y2
        ))
        fig.add_trace(go.Scatter(
            x=stepper.steps[:,0], y=stepper.acceleration,
            name="%s acc" % stepper.name,
            line=go.scatter.Line(dash="dot", color=color),
            yaxis=y3
        ))
        layout[yaxis1] = go.layout.YAxis(
            anchor="x",
            domain=(domains[i+1], domains[i]-spacing),
            showline=True,
            fixedrange=True,
            position=y_axis_spacing*0.0
        )
        layout[yaxis2] = go.layout.YAxis(
            anchor="free",
            overlaying=y1,
            side="left",
            position=y_axis_spacing*1.0,
            fixedrange=True
        )
        layout[yaxis3] = go.layout.YAxis(
            anchor="free",
            overlaying=y1,
            side="left",
            position=y_axis_spacing*2.0,
            fixedrange=True
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
    def __init__(self, steppers, times, spatial_coordinates, printer_dimensions):
        assets_folder = pkg_resources.resource_filename("klipper_dash_visualizer", "assets")
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
                    figure=graph_steppers(steppers),
                )
            ],
            vertices=spatial_coordinates,
            printer_dimensions=printer_dimensions,
            times=times
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