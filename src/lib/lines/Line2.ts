/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */


import { LineSegments2 } from "../lines/LineSegments2";
import { LineMaterial } from "../lines/LineMaterial";
import { LineSegmentsGeometry } from "./LineSegmentsGeometry";

export class Line2 extends LineSegments2
{
    constructor( geometry?: LineSegmentsGeometry, material?: LineMaterial ) {

        super(geometry, material);

        this.type = 'Line2';

        this.geometry = geometry !== undefined ? geometry : new LineSegmentsGeometry();
        this.material = material !== undefined ? material : new LineMaterial( { color: Math.random() * 0xffffff } );
    };
}
