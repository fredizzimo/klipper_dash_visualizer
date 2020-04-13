import React, {Component} from 'react';
import PropTypes from 'prop-types';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

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
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize( this.mount.clientWidth, this.mount.clientHeight );
        // document.body.appendChild( renderer.domElement );
        // use ref as a mount point of the Three.js scene instead of the document.body
        this.mount.appendChild( renderer.domElement );
        var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        var vertices = new Float32Array(this.props.vertices);
        var geometry = new THREE.BufferGeometry()
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        var line = new THREE.Line(geometry, material);
        scene.add(line);

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
};
