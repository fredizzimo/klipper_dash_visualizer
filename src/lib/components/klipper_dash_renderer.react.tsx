import React, {Component} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import tinycolor from "tinycolor2"
import { ExtrusionGeometry } from "../extrusion_geometry";
import { Vector2, MeshBasicMaterial, Mesh, MeshPhongMaterial, MeshLambertMaterial, FlatShading, LineBasicMaterial, MeshNormalMaterial } from "three";
import { Theme, createStyles, WithStyles, withStyles } from "@material-ui/core";


const styles = (theme: Theme) => createStyles({
    renderer: {
        flex: 1,
        flexDirection: "column",
        width: "100%",
        minHeight: "0px",
        height: "0px",
        backgroundColor: "#E5ECF6",
        "--buildplate-color": "#1f77b4",
        "&:focus": {
            outline: "none"
        }
    },
    canvas: {
        height: "100%",
        width: "100%",
        "&:focus": {
            outline: "none"
        }
    },
});

interface Props extends WithStyles<typeof styles> {
    id?: string;
    vertices: Float32Array;
    times: Float32Array;
    velocities: Float32Array;
    printer_dimensions: Array<Array<number>>;
    selected_time?: Array<number>;
    active: boolean;
};

type State = {
};

const KlipperDashRenderer = withStyles(styles)(
    class extends Component<Props, State> {
        static defaultProps = {
        }
        private canvas = React.createRef<HTMLCanvasElement>();
        private controls: OrbitControls;
        private camera: THREE.PerspectiveCamera;
        private post_camera: THREE.OrthographicCamera;
        private renderer: THREE.WebGLRenderer;
        private scene: THREE.Scene;
        private post_scene: THREE.Scene;

        private extrusion_geometry: ExtrusionGeometry
        private extrusion_material: MeshBasicMaterial

        private main_render_target: THREE.WebGLRenderTarget;

        constructor(props: Props) {
            super(props)
        }

        componentDidUpdate(prevProps: Props, prevState: Props) {
            if (this.props.selected_time != prevProps.selected_time) {
                // TODO: Update selection
            }
        }

        componentDidMount() {
            let scene = new THREE.Scene();
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

            let camera = new THREE.PerspectiveCamera(75, 2, 0.01, 1000);
            let renderer = new THREE.WebGLRenderer({
                canvas: this.canvas.current,
                alpha: true,
                logarithmicDepthBuffer: false
            });
            renderer.sortObjects = false;
            this.renderer = renderer;
            renderer.setPixelRatio(window.devicePixelRatio);
            let background_color = tinycolor(window.getComputedStyle(this.canvas.current).getPropertyValue("background-color"));
            let buildplate_color = tinycolor(window.getComputedStyle(this.canvas.current).getPropertyValue("--buildplate-color"));
            renderer.setClearColor(background_color.toHexString(), background_color.getAlpha());
            this.createMainRenderTarget();
            this.createLineRenderTarget();

            this.addLines();
            this.addBuildPlate(scene, buildplate_color);

            this.createPostScene();

            let d = this.calculate_dimensions()
            // Note slightly backwards in the y direction, so that the plate as the the right orientation
            camera.position.set(d.x_mid, d.y_mid-1, d.z_end_pos + 0.5 * d.z_size);
            camera.up.set(0, 0, 1);

            let controls = new OrbitControls(camera, renderer.domElement);
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
            let camera = this.camera;
            let renderer = this.renderer;
            let clientWidth = this.canvas.current.clientWidth;
            let clientHeight = this.canvas.current.clientHeight;
            let width = this.canvas.current.width;
            let height = this.canvas.current.height;
            let pixelRatio = renderer.getPixelRatio();
            let pixel_width = Math.floor(clientWidth * pixelRatio);
            let pixel_height = Math.floor(clientHeight * pixelRatio);
            if (pixel_width != width || pixel_height != height) {
                camera.aspect = clientWidth / clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(clientWidth, clientHeight, false);

                let drawSize = new Vector2();
                this.renderer.getDrawingBufferSize(drawSize);
                drawSize.max(new Vector2(128, 128));
                this.main_render_target.setSize( drawSize.x, drawSize.y);
                this.main_render_target.depthTexture.image.width = drawSize.x;
                this.main_render_target.depthTexture.image.height = drawSize.y;
                }
            }

        calculate_dimensions=()=> {
            let x_dim = this.props.printer_dimensions[0];
            let y_dim = this.props.printer_dimensions[1];
            let z_dim = this.props.printer_dimensions[2];

            let x_size = x_dim[1] - x_dim[0];
            let y_size = y_dim[1] - y_dim[0];
            let z_size = z_dim[1] - z_dim[0];
            let x_pos = y_dim[0];
            let y_pos = y_dim[0];
            let z_pos = z_dim[0];
            let x_mid = x_pos + x_size / 2;
            let y_mid = y_pos + y_size / 2;
            let z_mid = z_pos + z_size / 2;
            let x_end_pos = x_pos + x_size;
            let y_end_pos = y_pos + y_size;
            let z_end_pos = z_pos + z_size;
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

        addLines() {
            this.extrusion_geometry = new ExtrusionGeometry(this.props.vertices, this.props.velocities, 0.4, 0.4);
            this.extrusion_material = new MeshPhongMaterial({
                color: 0xFFFFFF,
                vertexColors: true,
            });
            let extrusion_mesh = new Mesh(this.extrusion_geometry, this.extrusion_material);
            this.scene.add(extrusion_mesh);
        }

        addBuildPlate=(scene: THREE.Scene, buildplate_color: tinycolor.Instance)=> {
            let d = this.calculate_dimensions()
            const thickness = 2
            let geometry = new THREE.BoxGeometry(d.x_size, d.y_size, thickness);
            let material = new THREE.MeshBasicMaterial({color: buildplate_color.toHexString()});
            let plate = new THREE.Mesh(geometry, material);
            plate.position.set(d.x_mid, d.y_mid, -thickness/2);
            scene.add(plate);
        }

        createLineRenderTarget() {
            let drawSize = new Vector2();
            this.renderer.getDrawingBufferSize(drawSize);

            let target = new THREE.WebGLRenderTarget(drawSize.x, drawSize.y);
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
            let drawSize = new Vector2();
            this.renderer.getDrawingBufferSize(drawSize);

            let target = new THREE.WebGLRenderTarget(drawSize.x, drawSize.y);
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
            let scene = new THREE.Scene();
            let material = new THREE.MeshBasicMaterial( {
                map: this.main_render_target.texture,
            } );

            let quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material);
            quad.frustumCulled = false;
            scene.add(quad); 
            this.post_scene = scene;
            this.post_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        }

        render() {
            return (
                <div
                    className={this.props.classes.renderer}
                    id={this.props.id}
                >
                <canvas
                    className={this.props.classes.canvas}
                    ref={this.canvas}/>
                </div>
            )
        }
    }
)

export default KlipperDashRenderer