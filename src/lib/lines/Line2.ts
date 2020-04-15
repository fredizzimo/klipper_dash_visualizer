/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */


import { LineSegments2 } from "../lines/LineSegments2";
import { LineGeometry } from "../lines/LineGeometry";
import { LineMaterial } from "../lines/LineMaterial";

export class Line2 extends LineSegments2
{
	constructor( geometry?: LineGeometry, material?: LineMaterial ) {

		super(geometry, material);

		this.type = 'Line2';

		this.geometry = geometry !== undefined ? geometry : new LineGeometry();
		this.material = material !== undefined ? material : new LineMaterial( { color: Math.random() * 0xffffff } );

	};
}
