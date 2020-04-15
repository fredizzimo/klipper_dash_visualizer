/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */


import { LineSegmentsGeometry } from "./LineSegmentsGeometry";

export class LineGeometry extends LineSegmentsGeometry {

	constructor() {

		super();

		this.type = 'LineGeometry';
	};

	static isLineGeometry = true;

	public setPositions(array: number[] | Float32Array) {

		// converts [ x1, y1, z1,  x2, y2, z2, ... ] to pairs format

		var length = array.length - 3;
		var points = new Float32Array( 2 * length );

		for ( var i = 0; i < length; i += 3 ) {

			points[ 2 * i ] = array[ i ];
			points[ 2 * i + 1 ] = array[ i + 1 ];
			points[ 2 * i + 2 ] = array[ i + 2 ];

			points[ 2 * i + 3 ] = array[ i + 3 ];
			points[ 2 * i + 4 ] = array[ i + 4 ];
			points[ 2 * i + 5 ] = array[ i + 5 ];

		}

		LineSegmentsGeometry.prototype.setPositions.call( this, points );

		return this;

	}

	public setColors(array: number[] | Float32Array) {

		// converts [ r1, g1, b1,  r2, g2, b2, ... ] to pairs format

		var length = array.length - 3;
		var colors = new Float32Array( 2 * length );

		for ( var i = 0; i < length; i += 3 ) {

			colors[ 2 * i ] = array[ i ];
			colors[ 2 * i + 1 ] = array[ i + 1 ];
			colors[ 2 * i + 2 ] = array[ i + 2 ];

			colors[ 2 * i + 3 ] = array[ i + 3 ];
			colors[ 2 * i + 4 ] = array[ i + 4 ];
			colors[ 2 * i + 5 ] = array[ i + 5 ];

		}

		LineSegmentsGeometry.prototype.setColors.call( this, colors );

		return this;

	}

	public copy(source: this) {

		// todo

		return this;

	}
}