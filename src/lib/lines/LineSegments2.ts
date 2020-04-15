/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */

import {
    Mesh,
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
}
