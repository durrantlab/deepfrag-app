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
import { getTensors, setupTensorGenerator } from "./Tensors";
import { FP_SIZE } from "./Vars";

declare var tf;

/**
 * Runs inference and gets the scores.
 * @param  {*}             model               The model.
 * @param  {*}             smiles              The smiles strings.
 * @param  {*}             fingerprints        The fingerprints.
 * @param  {*}             DeepFragMakeGrid    A module containing grid
 *                                             functions.
 * @param  {string}        receptorPdb         The receptor PDB string.
 * @param  {string}        ligandPdb           The ligand PDB string.
 * @param  {Array<number>} center              The location of the growing
 *                                             point.
 * @param  {number}        numRotations        The number of grid rotations.
 * @param  {boolean}       useReflectsIncRots  Whether to use reflections and
 *                                             incremental rotations (90
 *                                             degrees) to speed the
 *                                             calculations.
 * @returns Promise  A promise that resolves the scores.
 */
export function runInference(
    model: any, smiles: any, fingerprints: any, DeepFragMakeGrid: any,
    receptorPdb: string, ligandPdb: string, center: number[],
    numRotations: number, useReflectsIncRots: boolean
): Promise<any[]> {
    // Generate the predictions
    setupTensorGenerator(DeepFragMakeGrid, receptorPdb, ligandPdb, center, useReflectsIncRots);

    let preds = [];
    let numRotDone = 0;

    let getPreds = function(): Promise<any> {
        return runInferenceBatch(model, numRotDone, numRotations).then((payload) => {
            let predsBatch = payload[0];
            numRotDone = payload[1];

            if (predsBatch === null) {
                // No more left.
                return Promise.resolve(preds);
            } else {
                preds.push(predsBatch);
                return getPreds();
            }
        });
    }

    return getPreds().then((preds) => {
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

        return Promise.resolve(scores);
    });
}

/**
 * Runs inference on a batch of the rotations.
 * @param  {*}      model         The model.
 * @param  {number} numRotDone    The number of grid rotations done so far.
 * @param  {number} numRotations  The number of grid rotations total.
 * @returns Promise  Resolves when inference is done. [predictions, number
 *                   done (updated)]
 */
 function runInferenceBatch(model: any, numRotDone: number, numRotTotal: number): Promise<any> {
    const preds = tf.tidy(() => {
        // Get some tensors
        let tensors = getTensors(numRotTotal);

        // If there are none left, return null.
        if (tensors === undefined) {
            return [null, numRotDone];
        }

        numRotDone += tensors.length;

        var fullTensor = tf.concat(tensors);
        try {
            // throw 'test error';
            return [model["predict"](fullTensor), numRotDone];  // error
        } catch(err) {
            let msg = "An error occured when predicting fragments, most likely due to insufficient memory. ";
            let numRots = Store.store.state["numRotations"];
            msg += (numRots > 1)
                ? `You might consider reducing the number of grid rotations used for inference (currently ${numRots}).`
                : "You may need to use a more powerful computer."
            Store.store.commit("openModal", {
                title: "Error Predicting Fragments!",
                body: `<p>${msg}</p><p>Please reload this page and try again.</p>`
            });
            return [null, numRotDone];
        }
    });

    return new Promise((resolve, reject) => {
        // console.log(numRotDone, numRotTotal)
        let percentDone = 100 * numRotDone / numRotTotal;
        Store.store.commit("setVar", {
            name: "waitingMsg",
            val: `Running DeepFrag in your browser (${percentDone.toFixed(0)}%)...`
        });

        setTimeout(() => {
            // To allow DOM to redraw.
            resolve(preds);
        }, 100);
    });
}
