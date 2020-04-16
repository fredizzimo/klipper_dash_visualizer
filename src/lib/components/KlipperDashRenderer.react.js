// Dummy js version of the component so that Dash can generate the correct information

import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class KlipperDashRenderer extends Component {
    render() { return ( <div/>); }
}

KlipperDashRenderer.propTypes = {
    id: PropTypes.string,
    vertices: PropTypes.arrayOf(PropTypes.number).isRequired,
    printer_dimensions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired
};
