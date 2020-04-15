/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */

import {
   Vector3,
} from "three";

export class LineGeometry {

    points: Float32Array;
    colors: Float32Array;
    lineDistances: Float32Array;

    constructor() {
    };

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
        this.points = points;
        this.setLineDistances()
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
        this.colors = colors;
    }

    private setLineDistances() {

        var start = new Vector3();
        var end = new Vector3();
        var points = this.points;

        var lineDistances = new Float32Array(points.length / 3);

        for ( var i = 0, j = 0; i < points.length; i+=6, j += 2 ) {

            start.set(points[i], points[i+1], points[i+2]);
            end.set(points[i+3], points[i+4], points[i+5]);

            lineDistances[j] = (j == 0) ? 0 : lineDistances[j - 1];
            lineDistances[j + 1] = lineDistances[j] + start.distanceTo(end);
        }
        this.lineDistances = lineDistances;
    }
}