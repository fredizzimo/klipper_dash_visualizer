// Dummy js version of the component so that Dash can generate the correct information

import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class App extends Component {
    render() { return ( <div/>); }
}

App.propTypes = {
    id: PropTypes.string,
    vertices: PropTypes.arrayOf(PropTypes.number).isRequired,
    times: PropTypes.arrayOf(PropTypes.number).isRequired,
    velocities: PropTypes.arrayOf(PropTypes.number).isRequired,
    printer_dimensions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
    selected_time: PropTypes.arrayOf(PropTypes.number),
    figure: PropTypes.exact({
        data: PropTypes.arrayOf(PropTypes.object),
        layout: PropTypes.object,
        frames: PropTypes.arrayOf(PropTypes.object),
    }),
};
