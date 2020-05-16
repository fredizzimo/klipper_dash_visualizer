import React, {Component} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import tinycolor from "tinycolor2"
import { ExtrusionGeometry } from "./ExtrusionGeometry";
import { Vector2, MeshBasicMaterial, Mesh, MeshPhongMaterial, MeshLambertMaterial, FlatShading, LineBasicMaterial, MeshNormalMaterial } from "three";

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

    private extrusion_geometry: ExtrusionGeometry
    private extrusion_material: MeshBasicMaterial

    private main_render_target: THREE.WebGLRenderTarget;

    constructor(props: KlipperDashRendererProps) {
        super(props)
    }

    componentDidUpdate(prevProps: KlipperDashRendererProps, prevState: KlipperDashRendererState) {
        if (this.props.selected_time != prevProps.selected_time) {
            // TODO: Update selection
        }
        if (this.props.active) {
            this.myRef.current.focus();
        }
    }

    componentDidMount() {
        var scene = new THREE.Scene();
        this.scene = scene;
        let ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        let addDirectionalLight = function(x: number, y: number, z: number) {
            let directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
            directionalLight.position.set(x, y, z);
            scene.add(directionalLight);
        }
        addDirectionalLight(1000, 1000, 1000);
        addDirectionalLight(1000, -1000, 1000);
        addDirectionalLight(-1000, 1000, 1000);
        addDirectionalLight(-1000, -1000, 1000);

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

        this.renderer.setRenderTarget(this.main_render_target);
        this.renderer.clear(true, true, true);
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

            var drawSize = new Vector2();
            this.renderer.getDrawingBufferSize(drawSize);
            drawSize.max(new Vector2(128, 128));
            this.main_render_target.setSize( drawSize.x, drawSize.y);
            this.main_render_target.depthTexture.image.width = drawSize.x;
            this.main_render_target.depthTexture.image.height = drawSize.y;
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
        this.extrusion_geometry = new ExtrusionGeometry(this.props.vertices, this.props.velocities, 0.4, 0.4);
        this.extrusion_material = new MeshPhongMaterial({
            color: 0xFFFFFF,
            vertexColors: true,
        });
        var extrusion_mesh = new Mesh(this.extrusion_geometry, this.extrusion_material);
        this.scene.add(extrusion_mesh);
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
