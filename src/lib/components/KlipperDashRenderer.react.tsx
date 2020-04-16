import React, {Component} from "react";
import ReactDOM from "react-dom"
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import tinycolor from "tinycolor2"
import { Line2 } from "../lines/Line2";
import { LineMaterial } from "../lines/LineMaterial";
import { LineGeometry } from "../lines/LineGeometry";
import { Line } from "three";
import { LineSegmentsGeometry } from "../lines/LineSegmentsGeometry";

type KlipperDashRendererProps =
{
    id?: string;
    vertices: Float32Array;
    printer_dimensions: Array<Array<number>>;
};

type KlipperDashRendererState =
{
    controls: OrbitControls;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.Renderer;
    line_materials: Array<LineMaterial>;
    line_geometry: LineGeometry;
};

export default class KlipperDashRenderer extends Component<KlipperDashRendererProps, KlipperDashRendererState> {
    static defaultProps = {
    }
    private myRef = React.createRef<HTMLDivElement>();
    constructor(props: KlipperDashRendererProps) {
        super(props)

        this.state = {
            controls: null,
            camera: null,
            renderer: null,
            line_materials: [],
            line_geometry: null
        }
    }

    componentDidMount() {
        var scene = new THREE.Scene();
        var clientWidth = this.myRef.current.clientWidth;
        var clientHeight = this.myRef.current.clientWidth;
        var camera = new THREE.PerspectiveCamera( 75, clientWidth/clientHeight, 0.1, 1000 );
        var renderer = new THREE.WebGLRenderer({
             alpha: true
        });
        renderer.setSize(clientWidth, clientWidth);
        renderer.setPixelRatio(window.devicePixelRatio);
        //var domNode = ReactDOM.findDOMNode<HTMLDivElement>(this.myRef.current);
        var background_color = tinycolor(window.getComputedStyle(this.myRef.current).getPropertyValue("background-color"));
        var buildplate_color = tinycolor(window.getComputedStyle(this.myRef.current).getPropertyValue("--buildplate-color"));
        renderer.setClearColor(background_color.toHexString(), background_color.getAlpha());
        this.myRef.current.appendChild( renderer.domElement );

        this.add_lines(scene);
        this.add_build_plate(scene, buildplate_color);

        var d = this.calculate_dimensions()
        // Note slightly backwards in the y direction, so that the plate as the the right orientation
        camera.position.set(d.x_mid, d.y_mid-1, d.z_end_pos + 0.5 * d.z_size);
        camera.up.set(0, 0, 1);

        var controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(d.x_mid, d.y_mid, 0);
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

    calculate_dimensions=()=> {
        var x_dim = this.props.printer_dimensions[0];
        var y_dim = this.props.printer_dimensions[1];
        var z_dim = this.props.printer_dimensions[2];

        var x_size = x_dim[1] - x_dim[0];
        var y_size = y_dim[1] - y_dim[0];
        var z_size = z_dim[1] - z_dim[0];
        var x_pos = y_dim[0];
        var y_pos = y_dim[0];
        var z_pos = z_dim[0];
        var x_mid = x_pos + x_size / 2;
        var y_mid = y_pos + y_size / 2;
        var z_mid = z_pos + z_size / 2;
        var x_end_pos = x_pos + x_size;
        var y_end_pos = y_pos + y_size;
        var z_end_pos = z_pos + z_size;
        return {
            x_size,
            y_size,
            z_size,
            y_pos,
            x_pos,
            z_pos,
            x_mid,
            y_mid,
            z_mid,
            x_end_pos,
            y_end_pos,
            z_end_pos
        };
    }

    add_lines=(scene: THREE.Scene)=> {
        var geometry = new LineGeometry();
        geometry.setPositions(this.props.vertices);
        var segmentGeometry = new LineSegmentsGeometry()
        segmentGeometry.setLineGeometry(geometry);

        var material = new LineMaterial({
            color: 0xFF0000,
            worldUnits: true,
            linewidth: 0.4,
            vertexColors: false,
            dashed: false

        });
        var clientWidth = this.myRef.current.clientWidth;
        var clientHeight = this.myRef.current.clientWidth;
        material.resolution.set(clientWidth, clientHeight); 

        this.setState({
            line_materials: [material],
            line_geometry: geometry
        })

        var line = new Line2(segmentGeometry, material);
        line.scale.set( 1, 1, 1 );
        scene.add( line );
    }

    add_build_plate=(scene: THREE.Scene, buildplate_color: tinycolor.Instance)=> {
        var d = this.calculate_dimensions()
        const thickness = 2
        var geometry = new THREE.BoxGeometry(d.x_size, d.y_size, thickness);
        var material = new THREE.MeshBasicMaterial({color: buildplate_color.toHexString()});
        var plate = new THREE.Mesh(geometry, material);
        plate.position.set(d.x_mid, d.y_mid, -thickness/2);
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
        var clientWidth = this.myRef.current.clientWidth;
        var clientHeight = this.myRef.current.clientWidth;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        var materials = this.state.line_materials;
        for (let i=0;i<materials.length;i++)
        {
            materials[i].resolution.set( window.innerWidth, window.innerHeight );
        }
    }

    render() {
        return (
            <div
                id={this.props.id}
                onFocus={this.enableControls}
                onBlur={this.disableControls}
                ref={this.myRef}
            />
        )
    }
}
