from __future__ import absolute_import

from dash import Dash
from dash.dependencies import Input, Output, State
from .App import App
from .plots import main_plot

instructions = \
"""
Click and use the mouse and arrow keys to zoom and move around.
Click outside to when done
"""

class DashApp(object):
    def __init__(self, data, printer_dimensions):
        app = Dash()
        app.layout = App(
            id="app",
            children = [
            ],
            vertices=data.spatial_coordinates[data.culled_coordinates,:].flatten(),
            velocities=data.velocities[data.culled_coordinates].flatten(),
            printer_dimensions=printer_dimensions,
            times=data.times[data.culled_coordinates]
        )
        if False:
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