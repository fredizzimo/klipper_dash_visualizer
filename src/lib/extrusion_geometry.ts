import {
   BufferGeometry, Vector3, Line3, Uint32BufferAttribute, Float32BufferAttribute, Uint8BufferAttribute, Color
} from "three";

import {interpolate_turbo_color_range} from "./turbo_colormap"


export class ExtrusionGeometry extends BufferGeometry
{
    constructor(points: number[] | Float32Array, velocities: number[] | Float32Array, width: number, height: number) {
        super();
        this.createBuffer(points, velocities, width, height, false);
    }

    createBuffer(points: number[] | Float32Array, velocities: number[] | Float32Array, width: number, height: number, closed: boolean) {
        if (points.length == 0) {
            return;
        }

        let output_vertices: number[] = [];
        let output_normals: number[] = [];
        let output_indices: number[] = [];
        let output_colors: number[] = [];

        let push_geometry = function(pos: Vector3, normal: Vector3, color: Color) {
            output_vertices.push(pos.x);
            output_vertices.push(pos.y);
            output_vertices.push(pos.z);
            output_normals.push(normal.x);
            output_normals.push(normal.y);
            output_normals.push(normal.z);
            output_colors.push(Math.floor(color.r*255));
            output_colors.push(Math.floor(color.g*255));
            output_colors.push(Math.floor(color.b*255));
        }
        
        let push_triangle = function(idx1: number, idx2: number, idx3: number) {
            output_indices.push(idx1);
            output_indices.push(idx2);
            output_indices.push(idx3);
        }
        
        let push_quad = function(idx1: number, idx2: number, idx3: number, idx4: number) {
            output_indices.push(idx1);
            output_indices.push(idx2);
            output_indices.push(idx4);
            output_indices.push(idx2);
            output_indices.push(idx3);
            output_indices.push(idx4);
        }

        const LEFT=0;
        const RIGHT=1;
        const TOP=2;
        const BOTTOM=3;
        const unit_z = new Vector3(0.0, 0.0, 1.0);

        // left, right, top, bottom
        let idx_initial = [-1, -1, -1, -1];
        let idx_prev = [-1, -1, -1, -1];
        let z_prev = 0.0;
        let len_prev = 0.0;
        let n_right_prev = new Vector3();
        let n_top_prev = new Vector3();
        let unit_v_prev = new Vector3();
        let width_initial = 0.0;

        // new vertices around the line endpoints
        // left, right, top, bottom
        let a = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
        let b = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];

        const num_lines = (points.length / 3) - 1;
        // loop once more in case of closed loops
        const lines_end = closed ? (num_lines + 1) : num_lines;
        for (let ii = 0; ii < lines_end; ++ii)
        {
            const i = (ii == num_lines) ? 0 : ii;

            const l_a = new Vector3(points[i*3], points[i*3+1], points[i*3+2]);
            const l_b = new Vector3(points[i*3+3], points[i*3+4], points[i*3+5]);
            const line = new Line3(l_a, l_b);
            // TODO support variable height and width
            //double height = heights[i];
            //double width = widths[i];

            let unit_v = new Vector3();
            line.delta(unit_v);
            unit_v.normalize();
            const len = line.distance();

            let n_top = new Vector3();
            let n_right = new Vector3();
            
            if ((l_a.x== l_b.x) && (l_a.y == l_b.y))
            {
                // vertical segment
                n_top.set(0.0, 1.0, 0.0);
                n_right.set(1.0, 0.0, 0.0);
                if (l_a.z < l_b.z)
                    n_right.negate();
            }
            else
            {
                // horizontal segment
                n_right.crossVectors(unit_v, unit_z);
                n_right.normalize();
                n_top.crossVectors(n_right, unit_v);
                n_top.normalize();
            }

            let rl_displacement = n_right.clone();
            rl_displacement.multiplyScalar(0.5*width);
            let tb_displacement = n_top.clone();
            tb_displacement.multiplyScalar(0.5*height);

            a[RIGHT].addVectors(l_a, rl_displacement);
            a[LEFT].subVectors(l_a, rl_displacement);
            a[TOP].addVectors(l_a, tb_displacement);
            a[BOTTOM].subVectors(l_a, tb_displacement);
            b[RIGHT].addVectors(l_b, rl_displacement);
            b[LEFT].subVectors(l_b, rl_displacement);
            b[TOP].addVectors(l_b, tb_displacement);
            b[BOTTOM].subVectors(l_b, tb_displacement);

            let n_bottom = n_top.clone();
            n_bottom.negate();
            let n_left = n_right.clone();
            n_left.negate();

            let idx_a = [];
            let idx_b = [];
            let idx_last = output_vertices.length / 3;

            const velocity_a = velocities[i];
            const velocity_b = velocities[i+1];
            const max_velocity = 100;
            const color_a = new Color(...interpolate_turbo_color_range(velocity_a, 0, max_velocity));
            const color_b = new Color(...interpolate_turbo_color_range(velocity_b, 0, max_velocity));
                        
            const z_different = (z_prev != l_a.z);
            z_prev = l_b.z;

            // Share top / bottom vertices if possible.
            if (ii == 0)
            {
                idx_a[TOP] = idx_last++;
                push_geometry(a[TOP], n_top, color_a);
            }
            else
            {
                idx_a[TOP] = idx_prev[TOP];
            }

            if ((ii == 0) || z_different)
            {
                // Start of the 1st line segment or a change of the layer thickness while maintaining the print_z.
                idx_a[BOTTOM] = idx_last++;
                push_geometry(a[BOTTOM], n_bottom, color_a);
                idx_a[LEFT] = idx_last++;
                push_geometry(a[LEFT], n_left, color_a);
                idx_a[RIGHT] = idx_last++;
                push_geometry(a[RIGHT], n_right, color_a);
            }
            else
            {
                idx_a[BOTTOM] = idx_prev[BOTTOM];
            }

            if (ii == 0)
            {
                // Start of the 1st line segment.
                width_initial = width;
                for (let i=0; i<4; i++)
                {
                    idx_initial[i] = idx_a[i];
                }
            }
            else
            {
                // Continuing a previous segment.
                // Share left / right vertices if possible.
                const v_dot = unit_v_prev.dot(unit_v);
                const is_right_turn = n_top_prev.dot(new Vector3().crossVectors(unit_v_prev, unit_v)) > 0.0;

                // Allocate new left / right points for the start of this segment as these points will receive their own normals to indicate a sharp turn.
                idx_a[RIGHT] = idx_last++;
                push_geometry(a[RIGHT], n_right, color_a);
                idx_a[LEFT] = idx_last++;
                push_geometry(a[LEFT], n_left, color_a);

                if (is_right_turn)
                {
                    // Right turn. Fill in the right turn wedge.
                    push_triangle(idx_prev[RIGHT], idx_a[RIGHT], idx_prev[TOP]);
                    push_triangle(idx_prev[RIGHT], idx_prev[BOTTOM], idx_a[RIGHT]);
                }
                else
                {
                    // Left turn. Fill in the left turn wedge.
                    push_triangle(idx_prev[LEFT], idx_prev[TOP], idx_a[LEFT]);
                    push_triangle(idx_prev[LEFT], idx_a[LEFT], idx_prev[BOTTOM]);
                }

                if (ii == num_lines)
                {
                    // TODO: Enable if loop support is needed
                    /*
                    if (!is_sharp)
                    {
                        // Closing a loop with smooth transition. Unify the closing left / right vertices.
                        ::memcpy(volume.vertices_and_normals_interleaved.data() + idx_initial[LEFT] * 6, volume.vertices_and_normals_interleaved.data() + idx_prev[LEFT] * 6, sizeof(float) * 6);
                        ::memcpy(volume.vertices_and_normals_interleaved.data() + idx_initial[RIGHT] * 6, volume.vertices_and_normals_interleaved.data() + idx_prev[RIGHT] * 6, sizeof(float) * 6);
                        volume.vertices_and_normals_interleaved.erase(volume.vertices_and_normals_interleaved.end() - 12, volume.vertices_and_normals_interleaved.end());
                        // Replace the left / right vertex indices to point to the start of the loop. 
                        for (size_t u = volume.quad_indices.size() - 16; u < volume.quad_indices.size(); ++u)
                        {
                            if (volume.quad_indices[u] == idx_prev[LEFT])
                                volume.quad_indices[u] = idx_initial[LEFT];
                            else if (volume.quad_indices[u] == idx_prev[RIGHT])
                                volume.quad_indices[u] = idx_initial[RIGHT];
                        }
                    }
                    break
                    */
                }
            }

            // Only new allocate top / bottom vertices, if not closing a loop.
            if (closed && (ii + 1 == lines_end))
                idx_b[TOP] = idx_initial[TOP];
            else
            {
                idx_b[TOP] = idx_last++;
                push_geometry(b[TOP], n_top, color_b);
            }

            if (closed && (ii + 1 == lines_end) && (width == width_initial))
                idx_b[BOTTOM] = idx_initial[BOTTOM];
            else
            {
                idx_b[BOTTOM] = idx_last++;
                push_geometry(b[BOTTOM], n_bottom, color_b);
            }

            // Generate new vertices for the end of this line segment.
            idx_b[LEFT] = idx_last++;
            push_geometry(b[LEFT], n_left, color_b);
            idx_b[RIGHT] = idx_last++;
            push_geometry(b[RIGHT], n_right, color_b);

            for (let i=0; i<4; i++)
            {
                idx_prev[i] = idx_b[i];
            }
            n_right_prev = n_right;
            n_top_prev = n_top;
            unit_v_prev = unit_v;
            len_prev = len;

            if (!closed)
            {
                // Terminate open paths with caps.
                if (i == 0)
                    push_quad(idx_a[BOTTOM], idx_a[RIGHT], idx_a[TOP], idx_a[LEFT]);

                // We don't use 'else' because both cases are true if we have only one line.
                if (i + 1 == lines_end)
                    push_quad(idx_b[BOTTOM], idx_b[LEFT], idx_b[TOP], idx_b[RIGHT]);
            }

            // Add quads for a straight hollow tube-like segment.
            // bottom-right face
            push_quad(idx_a[BOTTOM], idx_b[BOTTOM], idx_b[RIGHT], idx_a[RIGHT]);
            // top-right face
            push_quad(idx_a[RIGHT], idx_b[RIGHT], idx_b[TOP], idx_a[TOP]);
            // top-left face
            push_quad(idx_a[TOP], idx_b[TOP], idx_b[LEFT], idx_a[LEFT]);
            // bottom-left face
            push_quad(idx_a[LEFT], idx_b[LEFT], idx_b[BOTTOM], idx_a[BOTTOM]);
        }

        this.setIndex(new Uint32BufferAttribute(output_indices, 1));
        this.setAttribute("position", new Float32BufferAttribute( output_vertices, 3 ) );
        this.setAttribute("normal", new Float32BufferAttribute( output_normals, 3 ) );
        this.setAttribute("color", new Uint8BufferAttribute(output_colors, 3, true) );
    }
}