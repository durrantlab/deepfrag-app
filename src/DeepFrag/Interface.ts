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

import * as Store from "../Vue/Store";

declare var Vue;

// fixed parameters
const GRID_WIDTH = 24;
const GRID_CHANNELS = 9;
const FP_SIZE = 2048;

declare var tf;

/**
 * Loads a remote javascript file.
 * @param  {string} url  The url of the file.
 * @returns Promise
 */
function loadJavaScriptFile(url: string): Promise<any> {
    // See
    // https://stackoverflow.com/questions/14521108/dynamically-load-js-inside-js
    return new Promise<void>((resolve, reject) => {
        var script = document.createElement("script");
        script.onload = () => {
            resolve();
        };
        script.src = url;
        document.head.appendChild(script);
    });
}

/**
 * Loads a remote resource.
 * @param  {string} x  The url.
 * @returns Promise  A promise that is fulfilled when it is loaded.
 */
function get(x: string): Promise<any> {
    return fetch(x).then((x) => x.json());
}

/**
 * Loads the model.
 * @returns Promise  Fulfills when model loaded.
 */
function loadModel(): Promise<any> {
    return tf.loadGraphModel("./DeepFrag/model/voxel_web/model.json");
}

/**
 * A generator that provides four tensors at a time.
 * @param  {number[][]} REVERSE             Describes possible reflections.
 * @param  {number[][]} TRANSPOSE           Describes possible transpositions.
 * @param  {any}        tensor              The original tensor to be
 *                                          rotated/reflected.
 * @param  {number}     numPseudoRotations  The number of pseudo rotations.
 */
function* tensorGenerator(REVERSE: number[][], TRANSPOSE: number[][], tensor: any, numPseudoRotations: number) {
    // Returns four grids at a time, to avoid using too much memory.
    var tensors = [];
    let cnt = 1;
    for (var ri = 0; ri < REVERSE.length; ++ri) {
        for (var ti = 0; ti < TRANSPOSE.length; ++ti) {
            var t = tf.reverse(tensor, REVERSE[ri]).transpose(TRANSPOSE[ti]);
            let newTensor = t.reshape([
                1,
                GRID_CHANNELS,
                GRID_WIDTH,
                GRID_WIDTH,
                GRID_WIDTH
            ]);
            tensors.push(newTensor);

            if (tensors.length === 4) {
                yield tensors;
                tensors = [];
            }

            cnt++;
            if (cnt >= numPseudoRotations) {
                break;
            }
        }
        if (cnt > numPseudoRotations) {
            break;
        }
    }

    // Could be ones left over if num pseuo rotations not divisible by four.
    if (tensors.length > 0) {
        yield tensors;
        tensors = [];  // no trigger garbage collection?
    }
}

/**
 * Runs inference and gets the scores.
 * @param  {*} model         The model.
 * @param  {*} grid          The grid.
 * @param  {*} smiles        The smiles strings.
 * @param  {*} fingerprints  The fingerprints.
 * @param  {number} numPseudoRotations  The number of grid rotations.
 * @returns any[]  The scores.
 */
function runInference(model: any, grid: any, smiles: any, fingerprints: any, numPseudoRotations: number): any[] {
    // Run tf ops inside tf.tidy to automatically clean up intermediate tensors.
    const scores = tf.tidy(() => {
        // build tensor from flattened grid
        var tensor = tf.tensor(grid, [
            GRID_CHANNELS,
            GRID_WIDTH,
            GRID_WIDTH,
            GRID_WIDTH,
        ]);

        // generate grid transpositions
        const REVERSE = [
            [],
            [1],
            [2],
            [3],

            // Note: a tensor of size 48x9x24x24x24 seems to be too big for the
            // WebGL context. Using only 24 transpositions should give similar
            // accuracy and allow for smaller tensors.

            // Uncomment the following to use all 48 cube transpositions:
            [1,2],
            [1,3],
            [2,3],
            [1,2,3]
        ];

        const TRANSPOSE = [
            [0,1,2,3],
            [0,1,3,2],
            [0,2,1,3],
            [0,2,3,1],
            [0,3,1,2],
            [0,3,2,1],
        ];

        const tensorGen = tensorGenerator(REVERSE, TRANSPOSE, tensor, numPseudoRotations);
        let preds = [];
        let tensorsBatch = tensorGen.next();
        while (tensorsBatch.done === false) {
            let tensors = tensorsBatch.value;
            var full_tensor = tf.concat(tensors);
            try {
                // throw 'test error';
                preds.push(model["predict"](full_tensor));  // error
            } catch(err) {
                let msg = "An error occured when predicting fragments, most likely due to insufficient memory. ";
                let numRots = Store.store.state["numPseudoRotations"];
                msg += (numRots > 1)
                    ? `You might consider reducing the number of grid rotations used for inference (currently ${numRots}).`
                    : "You may need to use a more powerful computer."
                Store.store.commit("openModal", {
                    title: "Error Predicting Fragments!",
                    body: `<p>${msg}</p><p>Please reload this page and try again.</p>`
                });
                return [];
            }

            tensorsBatch = tensorGen.next();
        }

        let allPreds = tf.concat(preds);

        var avg_pred = tf.mean(allPreds, [0]);

        var pred_b = avg_pred["broadcastTo"]([smiles.length, FP_SIZE]);

        // cosine similarity
        // (a dot b) / (|a| * |b|)
        var dot = tf.sum(tf.mul(fingerprints, pred_b), 1);
        var n1 = tf.norm(fingerprints, 2, 1);
        var n2 = tf.norm(pred_b, 2, 1);
        var d = tf.maximum(tf.mul(n1, n2), 1e-6);
        var dist = tf.div(dot, d).arraySync();

        // join smiles with distance
        var scores = [];
        for (var i = 0; i < smiles.length; ++i) {
            scores.push([smiles[i], dist[i]]);
        }

        // sort predictions
        scores.sort((a, b) => b[1] - a[1]);

        return scores;
    });

    return scores;
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
function quaternionRotation(coords: any, rot: number[], center: number[]): any {
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

/**
 * Returns a random unit quaternion.
 */
function randomRotation(): number[] {
    var r = tf.randomNormal([4]);
    var n = tf.div(r, r.norm());
    return n.arraySync();
}

/**
 * Runs deepfrag.
 * @param  {string} receptorPdb         The receptor PDB string.
 * @param  {string} ligandPdb           The ligand PDB string.
 * @param  {Array<number>} center       The location of the growing point.
 * @param  {number} numPseudoRotations  The number of grid rotations.
 * @returns Promise  A promise that fulfills when done. Resolves with scores.
 */
export function runDeepFrag(receptorPdb: string, ligandPdb: string, center: number[], numPseudoRotations: number): Promise<any> {
    // Load fingerprints.
    var fingerprintsPromise = get("./DeepFrag/fingerprints.json");

    // load tf.js and the model.
    var modelPromise = loadJavaScriptFile("./DeepFrag/tf.min.js").then(() => {
        // Load the model.
        return loadModel();
    });

    // Load the gridder library.
    var moduleLoadPromise = import(
        /* webpackChunkName: "DeepFragMakeGrid" */
        /* webpackMode: "lazy" */
        "./gridder/make_grid"
    );

    // Start loading smiles drawer to display the fragment structures when the
    // time comes.
    var smilesDrawerPromise = loadJavaScriptFile("./DeepFrag/smiles-drawer.min.js")

    return Promise.all([
        fingerprintsPromise,
        modelPromise,
        moduleLoadPromise
    ]).then((vals) => {
        // Give Vue time to update the message
        return new Promise((resolve, reject) => {
            Store.store.commit("setVar", {
                name: "waitingMsg",
                val: "Running DeepFrag in your browser..."
            })

            Vue.nextTick(() => {
                setTimeout(() => {
                    resolve(vals);
                }, 500);
            });
        });
    }).then((vals) => {
        let scores;

        // To debug.
        // scores = [["*CC",0.8856948018074036],["*C",0.8234878182411194],["*CCC",0.8039824366569519],["*C(C)C",0.7618820071220398],["*CCCC",0.7330074906349182]];

        if (true) {  // for debugging. put in false to use above dummy scores.
            const fp = vals[0];
            const model = vals[1];
            const DeepFragMakeGrid = vals[2];

            // Aggregate the fragment fingerprints into a single tensor for
            // vector math.
            var smiles = Object.keys(fp);
            var fpdat = [];
            for (var k = 0; k < smiles.length; k++) {
                fpdat.push(fp[smiles[k]]);
            }
            var fingerprints = tf.tensor(fpdat);

            // Get data required to prepare for grid generation.
            // rec_coords, rec_layers, parent_coords, parent_layers, conn
            let preGridGenData = DeepFragMakeGrid.pre_grid_gen(
                receptorPdb, ligandPdb, center
            );

            // Rotate the receptor and ligand about the connection point.
            var rot = randomRotation();
            preGridGenData[0] = quaternionRotation(preGridGenData[0], rot, center); // receptor
            preGridGenData[2] = quaternionRotation(preGridGenData[2], rot, center); // parent

            // Generate the grids for each channel.
            let grids = [];
            for (let i = 0; i < 9; i++) {
                grids.push(
                    DeepFragMakeGrid.make_grid_given_channel(
                        preGridGenData[0], preGridGenData[1],
                        preGridGenData[2], preGridGenData[3],
                        preGridGenData[4], i
                    )
                );
            }

            // Merge all the channels into one.
            let grid = DeepFragMakeGrid.sum_channel_grids(grids);

            // Run inference. Scores is an array of arrays, [SMILES,
            // score], ordered from best score to worst.
            scores = runInference(model, grid, smiles, fingerprints, numPseudoRotations);
        }

        // Get values as csv
        let scoresCSV = "Rank,Fragment SMILES,Score\n";
        for (var j = 0; j < scores.length; ++j) {
            scoresCSV += (j + 1).toString() + "," + scores[j][0] + "," + scores[j][1].toString() + "\n";
        }

        // Load smiles drawer to display the files.
        return smilesDrawerPromise.then(() => {
            // Now ready to go.
            return Promise.resolve([scores, scoresCSV]);
        });
    });
}
