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

import { FastGenerator } from "./FastGenerator";
import { GeneratorParent } from "./GeneratorParent";
import { OriginalGenerator } from "./OriginalGenerator";

let tensorGen: GeneratorParent;

/**
 * @param  {*}             DeepFragMakeGrid    A module containing grid
 *                                             functions.
 * @param  {string}        receptorPdb         The receptor PDB string.
 * @param  {string}        ligandPdb           The ligand PDB string.
 * @param  {Array<number>} center              The location of the growing
 *                                             point.
 * @param  {boolean}       useReflectsIncRots  Whether to use reflections and
 *                                             incremental rotations (90
 *                                             degrees) to speed the
 *                                             calculations.
 * @returns void
 */
export function setupTensorGenerator(
    DeepFragMakeGrid: any, receptorPdb: string, ligandPdb: string,
    center: number[], useReflectsIncRots: boolean
): void {
    if (useReflectsIncRots) {
        tensorGen = new FastGenerator(DeepFragMakeGrid, receptorPdb, ligandPdb, center);
    } else {
        tensorGen = new OriginalGenerator(DeepFragMakeGrid, receptorPdb, ligandPdb, center);
    }
}

/**
 * Gets a batch of (rotated) tensors.
 * @param  {number} totalNumRotations  The total number of rotations you'll
 *                                     need in the end. Used to make sure you
 *                                     don't keep delivering tensors beyond
 *                                     what's needed.
 * @returns any[]  An array containing this batch of tensors.
 */
export function getTensors(totalNumRotations: number): any[] {
    return tensorGen.getTensors(totalNumRotations);
}
