import React, {Component} from "react";
import ReactDOM from "react-dom"
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import tinycolor from "tinycolor2"
import { Line2 } from "../lines/Line2";
import { LineMaterial } from "../lines/LineMaterial";
import { LineGeometry } from "../lines/LineGeometry";
import { LineSegmentsGeometry } from "../lines/LineSegmentsGeometry";
import {range_start, range_end} from "../helpers"

type KlipperDashRendererProps =
{
    id?: string;
    vertices: Float32Array;
    times: Float32Array;
    printer_dimensions: Array<Array<number>>;
    selected_time?: Array<number>;
};

type KlipperDashRendererState =
{
};

export default class KlipperDashRenderer extends Component<KlipperDashRendererProps, KlipperDashRendererState> {
    static defaultProps = {
    }
    private myRef = React.createRef<HTMLDivElement>();
    private controls: OrbitControls;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.Renderer;
    private scene: THREE.Scene;
    private line_geometry: LineGeometry;
    private line_material_normal: LineMaterial;
    private line_material_highlight: LineMaterial;
    private line_before_highlight: Line2;
    private line_highlight: Line2;
    private line_after_highlight: Line2;

    constructor(props: KlipperDashRendererProps) {
        super(props)

        this.controls = null;
        this.camera = null;
        this.renderer = null;
        this. camera = null;
        this.renderer = null;
        this.line_material_normal = null;
        this.line_material_highlight = null;
        this.line_geometry = null;
        this.line_before_highlight = null;
        this.line_highlight = null;
        this.line_after_highlight = null;
    }

    componentDidUpdate(prevProps: KlipperDashRendererProps, prevState: KlipperDashRendererState) {
        if (this.props.selected_time != prevProps.selected_time) {
            this.update_line_segments()
        }
    }

    componentDidMount() {
        var scene = new THREE.Scene();
        this.scene = scene;
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

        this.add_lines();
        this.add_build_plate(scene, buildplate_color);

        var d = this.calculate_dimensions()
        // Note slightly backwards in the y direction, so that the plate as the the right orientation
        camera.position.set(d.x_mid, d.y_mid-1, d.z_end_pos + 0.5 * d.z_size);
        camera.up.set(0, 0, 1);

        var controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(d.x_mid, d.y_mid, 0);
        controls.enableZoom = false;
        controls.update();
        this.controls = controls;
        this.camera = camera;
        this.renderer = renderer;
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

    add_lines() {
        var geometry = new LineGeometry();
        geometry.setPositions(this.props.vertices);
        this.line_geometry = geometry;

        this.line_material_normal = new LineMaterial({
            color: 0xFF0000,
            worldUnits: true,
            linewidth: 0.4,
            vertexColors: false,
            dashed: false

        });
        this.line_material_highlight = new LineMaterial({
            color: 0x00FF00,
            worldUnits: true,
            linewidth: 0.4,
            vertexColors: false,
            dashed: false

        });

        this.update_line_segments()
        this.update_line_resolution();
    }

    update_line_resolution() {
        var clientWidth = this.myRef.current.clientWidth;
        var clientHeight = this.myRef.current.clientWidth;
        this.line_material_normal.resolution.set(clientWidth, clientHeight);
        this.line_material_highlight.resolution.set(clientWidth, clientHeight);
    }

    update_line_segments() {
        var g = this.line_geometry;

        var add_line = function(line: Line2, scene: THREE.Scene, material: LineMaterial) {
            if (line != null) {
                scene.remove(line)
                line.geometry.dispose()
            }
            let segmentGeometry = new LineSegmentsGeometry()
            line = new Line2(segmentGeometry, material);
            line.scale.set(1, 1, 1);
            scene.add(line);
            return line;
        }

        this.line_before_highlight = add_line(
            this.line_before_highlight, this.scene, this.line_material_normal);
        this.line_highlight = add_line(
            this.line_highlight, this.scene, this.line_material_highlight);
        this.line_after_highlight = add_line(
            this.line_after_highlight, this.scene, this.line_material_normal);
        
        if (this.props.selected_time != null)
        {
            let start_time=this.props.selected_time[0];
            let end_time=this.props.selected_time[1];
            let start_index = range_start(this.props.times, start_time);
            let end_index = range_end(this.props.times, end_time);
            this.line_before_highlight.geometry.setLineGeometry(g, 0, start_index);
            this.line_highlight.geometry.setLineGeometry(g, start_index, end_index);
            this.line_after_highlight.geometry.setLineGeometry(g, end_index);
        }
        else
        {
            this.line_before_highlight.geometry.setLineGeometry(g, 0, 0);
            this.line_highlight.geometry.setLineGeometry(g);
            this.line_after_highlight.geometry.setLineGeometry(g, 0, 0);
        }
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
        this.controls.enableZoom = true;
    }
    disableControls=()=> {
        this.controls.enableZoom = false;
    }

    resize=()=> {
        var camera = this.camera;
        var renderer = this.renderer;
        var clientWidth = this.myRef.current.clientWidth;
        var clientHeight = this.myRef.current.clientWidth;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        this.update_line_resolution();
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
