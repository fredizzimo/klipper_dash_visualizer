/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */

import {
	Geometry,
	BufferGeometry,
	WireframeGeometry
} from "three";
import { LineSegmentsGeometry } from "../lines/LineSegmentsGeometry.js";

export class WireframeGeometry2 extends LineSegmentsGeometry
{
	constructor(geometry: Geometry | BufferGeometry) {

		super();

		this.type = 'WireframeGeometry2';

		this.fromWireframeGeometry( new WireframeGeometry( geometry ) );

		// set colors, maybe
	};

	static isWireframeGeometry2: true;

	/*
	copy(source: this) {

		// todo

		return this;

	}
	*/
} 
