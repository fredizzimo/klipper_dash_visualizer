import React, {Component} from 'react';
import PropTypes from 'prop-types';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import tinycolor from "tinycolor2"

/**
 * ExampleComponent is an example component.
 * It takes a property, `label`, and
 * displays it.
 * It renders an input with the property `value`
 * which is editable by the user.
 */
export default class KlipperDashRenderer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            controls: null,
            camera: null,
            renderer: null
        }
    }

    componentDidMount() {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 75, this.mount.clientWidth/this.mount.clientHeight, 0.1, 1000 );
        var renderer = new THREE.WebGLRenderer({
             alpha: true
        });
        renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
        var domNode = ReactDOM.findDOMNode(this.mount);
        var background_color = tinycolor(window.getComputedStyle(domNode).getPropertyValue("background-color"));
        console.log(background_color.toRgb());
        console.log(background_color.getAlpha());
        renderer.setClearColor(background_color.toString("rgb"), background_color.getAlpha());
        this.mount.appendChild( renderer.domElement );

        this.add_lines(scene);
        this.add_build_plate(scene);

        camera.position.set(0, 0, 300);
        camera.lookAt(0, 0, 0);
        camera.up.set(0, 0, 1);

        var controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.update();
        this.setState({
            controls,
            camera,
            renderer
        });
        window.addEventListener("resize", this.resize);

        var animate = function() {
            requestAnimationFrame(animate);
            controls.update()
            renderer.render(scene, camera);
        };
        animate();
    } 

    add_lines=(scene)=> {
        var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        var vertices = new Float32Array(this.props.vertices);
        var geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        var line = new THREE.Line(geometry, material);
        scene.add(line);
    }

    add_build_plate=(scene)=> {
        var x_dim = this.props.printer_dimensions[0];
        var y_dim = this.props.printer_dimensions[1];

        var x_size = x_dim[1] - x_dim[0];
        var y_size = y_dim[1] - y_dim[0];
        var x_pos = y_dim[0];
        var y_pos = y_dim[0];

        const thickness = 2
        var geometry = new THREE.BoxGeometry(x_size, y_size, thickness);
        var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        var plate = new THREE.Mesh(geometry, material);
        plate.position.set(x_pos + x_size / 2, y_pos + y_size / 2, -thickness/2);
        scene.add(plate);
    }

    enableControls=()=> {
        this.state.controls.enableZoom = true;
    }
    disableControls=()=> {
        this.state.controls.enableZoom = false;
    }

    resize=()=> {
        var camera = this.state.camera;
        var renderer = this.state.renderer;
        var mount = this.mount;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    render() {
        return (
            <div
                id={this.props.id}
                onFocus={this.enableControls}
                onBlur={this.disableControls}
                ref={ref => (this.mount = ref)}
            />
        )
    }
}

KlipperDashRenderer.defaultProps = {};

KlipperDashRenderer.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string,

    vertices: PropTypes.arrayOf(PropTypes.number).isRequired,
    printer_dimensions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired
};
