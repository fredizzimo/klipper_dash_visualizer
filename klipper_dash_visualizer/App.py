# AUTO GENERATED FILE - DO NOT EDIT

from dash.development.base_component import Component, _explicitize_args


class App(Component):
    """An App component.


Keyword arguments:
- children (a list of or a singular dash component, string or number; optional)
- id (string; optional)
- vertices (list of numbers; required)
- times (list of numbers; required)
- printer_dimensions (list of list of numberss; required)
- selected_time (list of numbers; optional)"""
    @_explicitize_args
    def __init__(self, children=None, id=Component.UNDEFINED, vertices=Component.REQUIRED, times=Component.REQUIRED, printer_dimensions=Component.REQUIRED, selected_time=Component.UNDEFINED, **kwargs):
        self._prop_names = ['children', 'id', 'vertices', 'times', 'printer_dimensions', 'selected_time']
        self._type = 'App'
        self._namespace = 'klipper_dash_visualizer'
        self._valid_wildcard_attributes =            []
        self.available_properties = ['children', 'id', 'vertices', 'times', 'printer_dimensions', 'selected_time']
        self.available_wildcard_properties =            []

        _explicit_args = kwargs.pop('_explicit_args')
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs
        args = {k: _locals[k] for k in _explicit_args if k != 'children'}

        for k in ['vertices', 'times', 'printer_dimensions']:
            if k not in args:
                raise TypeError(
                    'Required argument `' + k + '` was not specified.')
        super(App, self).__init__(children=children, **args)
