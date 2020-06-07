from __future__ import absolute_import

from dash import Dash
from dash.dependencies import Input, Output, State
from .App import App
from .plots import get_plot_data

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
            vertices=data.spatial_coordinates[data.culled_coordinates,:].flatten(),
            velocities=data.velocities[data.culled_coordinates].flatten(),
            printer_dimensions=printer_dimensions,
            times=data.times[data.culled_coordinates],
            plots=get_plot_data(data)
        )
        self.app = app


    def run(self, **kwargs):
        self.app.run_server(**kwargs)