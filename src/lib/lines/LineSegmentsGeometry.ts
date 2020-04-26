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

        var positions = [
             - 1, 2, 0, // Left endcap end
               1, 2, 0, // Right endcap end
              -1, 1, 0, // Left endcap start
               1, 1, 0, // Right endcap start
              -1, 0, 0, // Left mid
               1, 0, 0, // Right mid
              -1,-1, 0, // Left start
               1,-1, 0  // Right start
        ];
        var uvs = [
              -1, 2, // Left endcap end
               1, 2, // Right endcap end
              -1, 1, // Left endcap start
               1, 1, // Right endcap start
              -1,-1, // Left mid
               1,-1, // Right mid
              -1,-2, // Left start
               1,-2  // right start
        ];
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

    setLineGeometry(geometry: LineGeometry, rangeStart = 0, rangeEnd?: number) {
        var pointBuffer = geometry.points.buffer;
        var distancesBuffer = geometry.lineDistances.buffer

        if (rangeEnd == null) {
            rangeEnd = geometry.points.length / 6;
        }
        var numElements = rangeEnd-rangeStart

        var points = new Float32Array(pointBuffer,  rangeStart*6*4, numElements*6)
        this.setPositions(points);

        var distances = new Float32Array(distancesBuffer, rangeStart*2*4, numElements*2)
        this.setDistances(distances);

        if (geometry.colors != null) 
        {
            var colorBuffer = geometry.colors.buffer
            var colors = new Float32Array(colorBuffer, rangeStart*2*4, numElements*2)
            this.setColors(colors);
        }
        else
        {
            this.setColors(null);
        }
    }

    private setPositions(lineSegments: Float32Array) {
        var instanceBuffer = new InstancedInterleavedBuffer(lineSegments, 6, 1); // xyz, xyz

        this.setAttribute("instanceStart", new InterleavedBufferAttribute( instanceBuffer, 3, 0 )); // xyz
        this.setAttribute("instanceEnd", new InterleavedBufferAttribute( instanceBuffer, 3, 3 )); // xyz

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

        var instanceColorBuffer = new InstancedInterleavedBuffer( colors, 2, 1 );

        this.setAttribute("instanceColorStart", new InterleavedBufferAttribute(instanceColorBuffer, 1, 0)); 
        this.setAttribute("instanceColorEnd", new InterleavedBufferAttribute(instanceColorBuffer, 1, 1));
    }

    private setDistances(distances: Float32Array) {
        var instanceDistanceBuffer = new InstancedInterleavedBuffer(distances, 2, 1); // d0, d1

        this.setAttribute("instanceDistanceStart", new InterleavedBufferAttribute( instanceDistanceBuffer, 1, 0 )); // d0
        this.setAttribute("instanceDistanceEnd", new InterleavedBufferAttribute( instanceDistanceBuffer, 1, 1 )); // d1
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