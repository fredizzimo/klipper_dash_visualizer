/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */

import {
	InstancedInterleavedBuffer,
	InterleavedBufferAttribute,
	Mesh,
	Vector3,
	BufferAttribute,
	BufferGeometry,
	Geometry
} from "three";
import { LineSegmentsGeometry } from "./LineSegmentsGeometry";
import { LineMaterial } from "./LineMaterial";

export class LineSegments2 extends Mesh
{
	geometry: LineSegmentsGeometry;
	constructor(geometry?: LineSegmentsGeometry, material?: LineMaterial) {

		super();

		this.type = 'LineSegments2';

		this.geometry = geometry !== undefined ? geometry : new LineSegmentsGeometry();
		this.material = material !== undefined ? material : new LineMaterial( { color: Math.random() * 0xffffff } );

	};

	static isLineSegments2 = true;

	public computeLineDistances() { // for backwards-compatability, but could be a method of LineSegmentsGeometry...

		var start = new Vector3();
		var end = new Vector3();

		var geometry = this.geometry;

		var instanceStart = <BufferAttribute> geometry.attributes.instanceStart;
		var instanceEnd = <BufferAttribute> geometry.attributes.instanceEnd;
		var count = 0;
		var interleavedInstanceStart = <InterleavedBufferAttribute> geometry.attributes.instanceStart
		count = interleavedInstanceStart.data.count;
		var lineDistances = new Float32Array( 2 * count);

		for ( var i = 0, j = 0, l = count; i < l; i ++, j += 2 ) {

			start.fromBufferAttribute( instanceStart, i );
			end.fromBufferAttribute( instanceEnd, i );

			lineDistances[ j ] = ( j === 0 ) ? 0 : lineDistances[ j - 1 ];
			lineDistances[ j + 1 ] = lineDistances[ j ] + start.distanceTo( end );

		}

		var instanceDistanceBuffer = new InstancedInterleavedBuffer( lineDistances, 2, 1 ); // d0, d1

		geometry.addAttribute( 'instanceDistanceStart', new InterleavedBufferAttribute( instanceDistanceBuffer, 1, 0 ) ); // d0
		geometry.addAttribute( 'instanceDistanceEnd', new InterleavedBufferAttribute( instanceDistanceBuffer, 1, 1 ) ); // d1

	}

	public	copy( source: this) {

		// todo

		return this;

	}
}
