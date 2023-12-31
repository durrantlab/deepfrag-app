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
import { runInference } from "./Inference";

declare var Vue;
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
 * Runs deepfrag.
 * @param  {string}        receptorPdb         The receptor PDB string.
 * @param  {string}        ligandPdb           The ligand PDB string.
 * @param  {Array<number>} center              The location of the growing
 *                                             point.
 * @param  {number}        numRotations        The number of grid rotations.
 * @param  {boolean}       useReflectsIncRots  Whether to use reflections and
 *                                             incremental rotations (90
 *                                             degrees) to speed the
 *                                             calculations.
 * @returns Promise  A promise that fulfills when done. Resolves with scores.
 */
export function runDeepFrag(
    receptorPdb: string, ligandPdb: string, center: number[],
    numRotations: number, useReflectsIncRots: boolean
): Promise<any> {
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
            });

            Vue.nextTick(() => {
                setTimeout(() => {
                    resolve(vals);
                }, 500);
            });
        });
    }).then((vals) => {
        // To debug.
        // scores = [["*CC",0.8856948018074036],["*C",0.8234878182411194],["*CCC",0.8039824366569519],["*C(C)C",0.7618820071220398],["*CCCC",0.7330074906349182]];

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

        // Run inference. Scores is an array of arrays, [SMILES,
        // score], ordered from best score to worst.
        return runInference(model, smiles, fingerprints, DeepFragMakeGrid, receptorPdb, ligandPdb, center, numRotations, useReflectsIncRots).then((scores) => {
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
    });
}
