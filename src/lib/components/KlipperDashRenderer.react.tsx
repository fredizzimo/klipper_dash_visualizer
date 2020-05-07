import React, {Component} from "react";
import ReactDOM from "react-dom"
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import tinycolor from "tinycolor2"
import { Line2 } from "../lines/Line2";
import { LineMaterial, LinePass } from "../lines/LineMaterial";
import { LineGeometry } from "../lines/LineGeometry";
import { LineSegmentsGeometry } from "../lines/LineSegmentsGeometry";
import {range_start, range_end} from "../helpers"
import { Vector2 } from "three";

type KlipperDashRendererProps =
{
    id?: string;
    vertices: Float32Array;
    times: Float32Array;
    velocities: Float32Array;
    printer_dimensions: Array<Array<number>>;
    selected_time?: Array<number>;
    active: boolean;
};

type KlipperDashRendererState =
{
};

export default class KlipperDashRenderer extends Component<KlipperDashRendererProps, KlipperDashRendererState> {
    static defaultProps = {
    }
    private myRef = React.createRef<HTMLCanvasElement>();
    private controls: OrbitControls;
    private camera: THREE.PerspectiveCamera;
    private post_camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private post_scene: THREE.Scene;
    private line_scene_depth_pass: THREE.Scene;
    private line_scene_distance_pass: THREE.Scene;
    private line_geometry: LineGeometry;
    private line_material_normal: LineMaterial;
    private line_material_highlight: LineMaterial;
    private line_material_normal_depth_pass: LineMaterial;
    private line_material_highlight_depth_pass: LineMaterial;
    private line_material_normal_distance_pass: LineMaterial;
    private line_material_highlight_distance_pass: LineMaterial;
    private line_geometry_before_highlight: LineSegmentsGeometry;
    private line_geometry_highlight: LineSegmentsGeometry;
    private line_geometry_after_highlight: LineSegmentsGeometry;
    private line_render_target: THREE.WebGLRenderTarget;
    private main_render_target: THREE.WebGLRenderTarget;

    constructor(props: KlipperDashRendererProps) {
        super(props)
    }

    componentDidUpdate(prevProps: KlipperDashRendererProps, prevState: KlipperDashRendererState) {
        if (this.props.selected_time != prevProps.selected_time) {
            this.update_line_segments()
        }
        if (this.props.active) {
            this.myRef.current.focus();
        }
    }

    componentDidMount() {
        var scene = new THREE.Scene();
        this.scene = scene;
        this.line_scene_depth_pass = new THREE.Scene();
        this.line_scene_distance_pass = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, 2, 0.01, 1000);
        var renderer = new THREE.WebGLRenderer({
            canvas: this.myRef.current,
            alpha: true,
            logarithmicDepthBuffer: false
        });
        renderer.sortObjects = false;
        this.renderer = renderer;
        renderer.setPixelRatio(window.devicePixelRatio);
        var background_color = tinycolor(window.getComputedStyle(this.myRef.current).getPropertyValue("background-color"));
        var buildplate_color = tinycolor(window.getComputedStyle(this.myRef.current).getPropertyValue("--buildplate-color"));
        renderer.setClearColor(background_color.toHexString(), background_color.getAlpha());
        this.createMainRenderTarget();
        this.createLineRenderTarget();

        this.add_lines();
        this.add_build_plate(scene, buildplate_color);

        this.createPostScene();

        var d = this.calculate_dimensions()
        // Note slightly backwards in the y direction, so that the plate as the the right orientation
        camera.position.set(d.x_mid, d.y_mid-1, d.z_end_pos + 0.5 * d.z_size);
        camera.up.set(0, 0, 1);

        var controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(d.x_mid, d.y_mid, 0);
        controls.update();
        this.controls = controls;
        this.camera = camera;

        this.animate();
    } 

    animate =()=> {
        this.resize();
        requestAnimationFrame(this.animate);
        this.controls.update()
        this.renderer.autoClear = false;
        this.renderer.setRenderTarget(this.line_render_target);
        this.renderer.clear(true, true, true);
        this.renderer.render(this.line_scene_depth_pass, this.camera);
        this.renderer.render(this.line_scene_distance_pass, this.camera);

        this.renderer.setRenderTarget(this.main_render_target);
        this.renderer.clear(true, false, false);
        this.renderer.render(this.scene, this.camera);

        this.renderer.setRenderTarget(null);
        this.renderer.clear(true, true, true);
        this.renderer.render(this.post_scene, this.post_camera);
    }

    resize() {
        var camera = this.camera;
        var renderer = this.renderer;
        var clientWidth = this.myRef.current.clientWidth;
        var clientHeight = this.myRef.current.clientHeight;
        var width = this.myRef.current.width;
        var height = this.myRef.current.height;
        var pixelRatio = renderer.getPixelRatio();
        var pixel_width = Math.floor(clientWidth * pixelRatio);
        var pixel_height = Math.floor(clientHeight * pixelRatio);
        if (pixel_width != width || pixel_height != height) {
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight, false);
            this.update_line_resolution();

            var drawSize = new Vector2();
            this.renderer.getDrawingBufferSize(drawSize);
            drawSize.max(new Vector2(128, 128));
            this.main_render_target.setSize( drawSize.x, drawSize.y);
            this.main_render_target.depthTexture.image.width = drawSize.x;
            this.main_render_target.depthTexture.image.height = drawSize.y;
            this.line_render_target.setSize( drawSize.x, drawSize.y);
            }
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
        geometry.setColors(this.props.velocities)
        this.line_geometry = geometry;

        this.line_material_normal = new LineMaterial({
            color: 0xFFFFFF,
            worldUnits: true,
            linewidth: 0.001,
            segmentColors: true,
            dashed: false
        });
        this.line_material_highlight = new LineMaterial({
            color: 0xFFFFFF,
            worldUnits: true,
            linewidth: 0.4,
            segmentColors: true,
            dashed: false
        });

        this.line_material_normal_depth_pass = this.line_material_normal.clone();
        this.line_material_normal_depth_pass.pass = LinePass.Depth;
        this.line_material_highlight_depth_pass = this.line_material_highlight.clone();
        this.line_material_highlight_depth_pass.pass = LinePass.Depth;

        this.line_material_normal_distance_pass = this.line_material_normal.clone();
        this.line_material_normal_distance_pass.pass = LinePass.Distance;
        this.line_material_highlight_distance_pass = this.line_material_highlight.clone();
        this.line_material_highlight_distance_pass.pass = LinePass.Distance;

        this.line_material_normal.distanceMap = this.line_render_target.texture;
        this.line_material_highlight.distanceMap = this.line_render_target.texture;

        this.update_line_segments()
        this.update_line_resolution();
    }

    update_line_resolution() {
        var drawSize = new Vector2();
        this.renderer.getDrawingBufferSize(drawSize);
        this.line_material_normal.resolution.set(drawSize.x, drawSize.y);
        this.line_material_highlight.resolution.set(drawSize.x, drawSize.y);
        this.line_material_normal_depth_pass.resolution.set(drawSize.x, drawSize.y);
        this.line_material_highlight_depth_pass.resolution.set(drawSize.x, drawSize.y);
        this.line_material_normal_distance_pass.resolution.set(drawSize.x, drawSize.y);
        this.line_material_highlight_distance_pass.resolution.set(drawSize.x, drawSize.y);
    }

    update_line_segments() {
        var g = this.line_geometry;

        var dispose_geometry = function(geometry: LineSegmentsGeometry) {
            if (geometry != null) {
                geometry.dispose();
            }
        }
        // TODO create separate line classes so that this can be generalized wihtout code duplication

        dispose_geometry(this.line_geometry_before_highlight);
        dispose_geometry(this.line_geometry_highlight);
        dispose_geometry(this.line_geometry_after_highlight);

        this.line_geometry_before_highlight = new LineSegmentsGeometry();
        this.line_geometry_highlight = new LineSegmentsGeometry();
        this.line_geometry_after_highlight = new LineSegmentsGeometry();

        var clear_scene = function(scene: THREE.Scene) {
            var toRemove = []
            for (var i = 0;i<scene.children.length;i++) {
                if (scene.children[i] instanceof Line2) {
                    toRemove.push(scene.children[i]);
                }
            }
            scene.remove(...toRemove);
        }

        clear_scene(this.line_scene_depth_pass);
        clear_scene(this.line_scene_distance_pass);
        clear_scene(this.scene);

        this.line_scene_depth_pass.add(new Line2(this.line_geometry_before_highlight, this.line_material_normal_depth_pass));
        this.line_scene_depth_pass.add(new Line2(this.line_geometry_highlight, this.line_material_highlight_depth_pass));
        this.line_scene_depth_pass.add(new Line2(this.line_geometry_after_highlight, this.line_material_normal_depth_pass));

        this.line_scene_distance_pass.add(new Line2(this.line_geometry_before_highlight, this.line_material_normal_distance_pass));
        this.line_scene_distance_pass.add(new Line2(this.line_geometry_highlight, this.line_material_highlight_distance_pass));
        this.line_scene_distance_pass.add(new Line2(this.line_geometry_after_highlight, this.line_material_normal_distance_pass));

            this.scene.add(new Line2(this.line_geometry_before_highlight, this.line_material_normal));
            this.scene.add(new Line2(this.line_geometry_highlight, this.line_material_highlight));
            this.scene.add(new Line2(this.line_geometry_after_highlight, this.line_material_normal));

        if (this.props.selected_time != null)
        {
            let start_time=this.props.selected_time[0];
            let end_time=this.props.selected_time[1];
            let start_index = range_start(this.props.times, start_time);
            let end_index = range_end(this.props.times, end_time);
            this.line_geometry_before_highlight.setLineGeometry(g, 0, start_index);
            this.line_geometry_highlight.setLineGeometry(g, start_index, end_index);
            this.line_geometry_after_highlight.setLineGeometry(g, end_index);
        }
        else
        {
            this.line_geometry_before_highlight.setLineGeometry(g, 0, 0);
            this.line_geometry_highlight.setLineGeometry(g);
            this.line_geometry_after_highlight.setLineGeometry(g, 0, 0);
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

    createLineRenderTarget() {
        var drawSize = new Vector2();
        this.renderer.getDrawingBufferSize(drawSize);

        var target = new THREE.WebGLRenderTarget(drawSize.x, drawSize.y);
        target.texture.format = THREE.RGBFormat;
        target.texture.type = THREE.FloatType;
        target.texture.minFilter = THREE.NearestFilter;
        target.texture.magFilter = THREE.NearestFilter;
        target.texture.generateMipmaps = false;
        target.stencilBuffer = false;
        target.depthBuffer = true;
        target.depthTexture = this.main_render_target.depthTexture;
        this.line_render_target = target;
    }

    createMainRenderTarget() {
        var drawSize = new Vector2();
        this.renderer.getDrawingBufferSize(drawSize);

        var target = new THREE.WebGLRenderTarget(drawSize.x, drawSize.y);
        target.texture.format = THREE.RGBAFormat;
        target.texture.type = THREE.UnsignedByteType;
        target.texture.minFilter = THREE.NearestFilter;
        target.texture.magFilter = THREE.NearestFilter;
        target.texture.generateMipmaps = false;
        target.stencilBuffer = false;
        target.depthBuffer = true;
        target.depthTexture = new THREE.DepthTexture(drawSize.x, drawSize.y);
        target.depthTexture.format = THREE.DepthStencilFormat;
        target.depthTexture.type = THREE.UnsignedInt248Type;
        this.main_render_target = target;
    }

    createPostScene() {
        var scene = new THREE.Scene();
       	var material = new THREE.MeshBasicMaterial( {
               map: this.main_render_target.texture,
        } );

        var quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material);
        quad.frustumCulled = false;
        scene.add(quad); 
        this.post_scene = scene;
        this.post_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    tryToRefocus=()=> {
        if (this.props.active) {
            let element = this.myRef.current
            setTimeout(function () { element.focus(); }, 20);
        }
    }

    render() {
        return (
            <div
                id={this.props.id}
                onBlur={this.tryToRefocus}
            >
            <canvas
                ref={this.myRef}/>
            </div>
        )
    }
}
