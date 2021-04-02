// Copyright 2021 Jacob Durrant

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

declare var tf

/**
 * Returns a random unit quaternion.
 */
export function randomRotation(): number[] {
    var r = tf.randomNormal([4]);
    var n = tf.div(r, r.norm());
    return n.arraySync();
}

/**
 * Compute the Hamilton product of two quaternion vectors.
 */
function hamiltonProduct(a: number[], b: number[]): number[] {
    // https://en.wikipedia.org/wiki/Quaternion?Hamilton%20product#Hamilton_product
    return [
        (a[0]*b[0]) - (a[1]*b[1]) - (a[2]*b[2]) - (a[3]*b[3]),
        (a[0]*b[1]) + (a[1]*b[0]) - (a[2]*b[3]) + (a[3]*b[2]),
        (a[0]*b[2]) + (a[1]*b[3]) + (a[2]*b[0]) - (a[3]*b[1]),
        (a[0]*b[3]) - (a[1]*b[2]) + (a[2]*b[1]) + (a[3]*b[0]),
    ]
}

/**
 * Rotate a list of coordinates about a point with a quaternion rotation vector.
 * @param coords    A list of objects with 'x','y','z' values.
 * @param rot       A length 4 quaternion describing the rotation.
 * @param center    The point to rotate about (x,y,z)
 * @returns         A new list of coordinate objects after rotation.
 */
export function quaternionRotation(coords: any, rot: number[], center: number[]): any {
    var rot_coords = [];

    var R = rot;
    var Rp = [R[0], -R[1], -R[2], -R[3]];

    for (var i = 0; i < coords.length; ++i) {
        var p = [
            0,
            coords[i].x - center[0],
            coords[i].y - center[1],
            coords[i].z - center[2]
        ];
        var p2 = hamiltonProduct(hamiltonProduct(R, p), Rp);

        rot_coords.push({
            'x': p2[1] + center[0],
            'y': p2[2] + center[1],
            'z': p2[3] + center[2],
        });
    }

    return rot_coords;
}
