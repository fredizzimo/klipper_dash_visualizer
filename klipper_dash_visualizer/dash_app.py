from __future__ import absolute_import

import pkg_resources
import os
from dash import Dash
from dash.dependencies import Input, Output, State
import dash_core_components as dcc
import dash_html_components as html
from .App import App
from .plots import main_plot

instructions = \
"""
Click and use the mouse and arrow keys to zoom and move around.
Click outside to when done
"""

class DashApp(object):
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
                    figure=main_plot(data),
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