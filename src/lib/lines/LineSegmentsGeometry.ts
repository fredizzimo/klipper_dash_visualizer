/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */

import {
    Box3,
    Float32BufferAttribute,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    InterleavedBufferAttribute,
    Sphere,
    Vector3,
    Matrix4,
    BufferAttribute
} from "three";
import { LineGeometry } from "./LineGeometry";

export class LineSegmentsGeometry extends InstancedBufferGeometry
{
    constructor() {
        super()

        this.type = 'LineSegmentsGeometry';

        var positions = [ - 1, 2, 0, 1, 2, 0, - 1, 1, 0, 1, 1, 0, - 1, 0, 0, 1, 0, 0, - 1, - 1, 0, 1, - 1, 0 ];
        var uvs = [ - 1, 2, 1, 2, - 1, 1, 1, 1, - 1, - 1, 1, - 1, - 1, - 2, 1, - 2 ];
        var index = [ 0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5 ];

        this.setIndex( index );
        this.addAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
        this.addAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

    };

    static isLineSegmentsGeometry: true;

    public applyMatrix( matrix: Matrix4 ) {

        var start = <InterleavedBufferAttribute> this.attributes.instanceStart;
        var end = <InterleavedBufferAttribute> this.attributes.instanceEnd;

        if ( start !== undefined ) {

            start.applyMatrix4(matrix);
            end.applyMatrix4(matrix);

            start.data.needsUpdate = true;

        }

        if ( this.boundingBox !== null ) {

            this.computeBoundingBox();

        }

        if ( this.boundingSphere !== null ) {

            this.computeBoundingSphere();

        }
    }

    setLineGeometry(geometry: LineGeometry) {
        this.setPositions(geometry.points);
        this.setColors(geometry.colors);
        this.setDistances(geometry.lineDistances);
    }

    private setPositions(lineSegments: Float32Array) {
        var instanceBuffer = new InstancedInterleavedBuffer(lineSegments, 6, 1); // xyz, xyz

        this.addAttribute("instanceStart", new InterleavedBufferAttribute( instanceBuffer, 3, 0 )); // xyz
        this.addAttribute("instanceEnd", new InterleavedBufferAttribute( instanceBuffer, 3, 3 )); // xyz

        this.computeBoundingBox();
        this.computeBoundingSphere();
    }

    private setColors(colors?: Float32Array) {
        if (colors == null)
        {
            this.deleteAttribute("instanceColorStart");
            this.deleteAttribute("instanceColorEnd");
            return;
        }

        var instanceColorBuffer = new InstancedInterleavedBuffer( colors, 6, 1 ); // rgb, rgb

        this.addAttribute("instanceColorStart", new InterleavedBufferAttribute(instanceColorBuffer, 3, 0)); // rgb
        this.addAttribute("instanceColorEnd", new InterleavedBufferAttribute(instanceColorBuffer, 3, 3)); // rgb
    }

    private setDistances(distances: Float32Array) {
        var instanceDistanceBuffer = new InstancedInterleavedBuffer(distances, 2, 1); // d0, d1

        this.addAttribute("instanceDistanceStart", new InterleavedBufferAttribute( instanceDistanceBuffer, 1, 0 )); // d0
        this.addAttribute("instanceDistanceEnd", new InterleavedBufferAttribute( instanceDistanceBuffer, 1, 1 )); // d1
    }

    computeBoundingBox() {

        var box = new Box3();

        if ( this.boundingBox === null ) {

            this.boundingBox = new Box3();

        }

        var start = <BufferAttribute> this.attributes.instanceStart;
        var end = <BufferAttribute> this.attributes.instanceEnd;

        if ( start !== undefined && end !== undefined ) {

            this.boundingBox.setFromBufferAttribute( start );

            box.setFromBufferAttribute( end );

            this.boundingBox.union( box );

        }
    }

    computeBoundingSphere() {

        var vector = new Vector3();

        if ( this.boundingSphere === null ) {

            this.boundingSphere = new Sphere();

        }

        if ( this.boundingBox === null ) {

            this.computeBoundingBox();

        }

        var start = <BufferAttribute> this.attributes.instanceStart;
        var end = <BufferAttribute> this.attributes.instanceEnd;

        if ( start !== undefined && end !== undefined ) {

            var center = this.boundingSphere.center;

            this.boundingBox.getCenter( center );

            var maxRadiusSq = 0;

            for ( var i = 0, il = start.count; i < il; i ++ ) {

                vector.fromBufferAttribute( start, i );
                maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( vector ) );

                vector.fromBufferAttribute( end, i );
                maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( vector ) );

            }

            this.boundingSphere.radius = Math.sqrt( maxRadiusSq );

            if ( isNaN( this.boundingSphere.radius ) ) {

                console.error( 'THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this );

            }
        }
    }
}