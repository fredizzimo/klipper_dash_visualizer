from __future__ import print_function as _

import os as _os
import sys as _sys
import json

import dash as _dash

# noinspection PyUnresolvedReferences
from ._imports_ import *
from ._imports_ import __all__

if not hasattr(_dash, 'development'):
    print('Dash was not successfully imported. '
          'Make sure you don\'t have a file '
          'named \n"dash.py" in your current directory.', file=_sys.stderr)
    _sys.exit(1)

_basepath = _os.path.dirname(__file__)
_filepath = _os.path.abspath(_os.path.join(_basepath, 'package-info.json'))
with open(_filepath) as f:
    package = json.load(f)

package_name = package['name'].replace(' ', '_').replace('-', '_')
__version__ = package['version']

_current_path = _os.path.dirname(_os.path.abspath(__file__))

_this_module = _sys.modules[__name__]

_dev_js = _os.path.join(_basepath, "klipper_dash_visualizer.dev.js")
_prod_js = _os.path.join(_basepath, "klipper_dash_visualizer.min.js")
_is_prod = True

if _os.path.exists(_dev_js):
    if _os.path.exists(_prod_js):
        dev_mod = _os.path.getmtime(_dev_js)
        prod_mod = _os.path.getmtime(_prod_js)
        if dev_mod > prod_mod:
            _is_prod = False
    else:
        _is_prod = False

if _is_prod:
    _js_dist = [
        {
            'relative_package_path': 'klipper_dash_visualizer.min.js',

            'namespace': package_name
        },
        {
            'relative_package_path': 'klipper_dash_visualizer.min.js.map',

            'namespace': package_name,
            'dynamic': True
        }
    ]
else:
    _js_dist = [
        {
            'relative_package_path': 'klipper_dash_visualizer.dev.js',

            'namespace': package_name
        },
        {
            'relative_package_path': 'klipper_dash_visualizer.dev.js.map',

            'namespace': package_name,
            'dynamic': True
        }
    ]

_css_dist = [
    {
        'relative_package_path': 'klipper_dash_visualizer.css',

        'namespace': package_name
    }
]


for _component in __all__:
    setattr(locals()[_component], '_js_dist', _js_dist)
    setattr(locals()[_component], '_css_dist', _css_dist)
