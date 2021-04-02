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

import { GRID_CHANNELS, GRID_WIDTH, NUM_TENSORS_PER_BATCH } from "../Vars";
import { randomRotation, quaternionRotation } from "./Rotations";

declare var tf;

// Note on nomenclature: a "tensor" is a flattened "grid".

export abstract class GeneratorParent {
    // Doing it this way instead of using a javascript generator because that
    // doesn't seem to work with tensorflow (the tensors get disposed).
    private preGridGenData: any;
    private currentGrid: any;
    protected baseTensor: any;
    private DeepFragMakeGrid: any;
    private receptorPdb: any;
    private ligandPdb: any;
    private center: any;
    protected abstract fullRotationAtEveryInferance: boolean;
    protected numTensorsGeneratedSoFar: number;

    /**
     * Creates the tensor generator class.
     * @param  {*}             DeepFragMakeGrid    A module containing grid
     *                                             functions.
     * @param  {string}        receptorPdb         The receptor PDB string.
     * @param  {string}        ligandPdb           The ligand PDB string.
     * @param  {Array<number>} center              The location of the growing
     */
    constructor(DeepFragMakeGrid: any, receptorPdb: string, ligandPdb: string, center: number[]) {
        this.DeepFragMakeGrid = DeepFragMakeGrid;
        this.receptorPdb =receptorPdb;
        this.ligandPdb = ligandPdb;
        this.center = center;

        // You will always need to make pre grid data.
        this.makePreGridData();
        this.numTensorsGeneratedSoFar = 0;
        this.setup();
    }

    /**
     * Makes the pre data for the grids. Saved to this.preGridGenData.
     * @returns void
     */
    private makePreGridData(): void {
        // Get data required to prepare for grid generation.
        // rec_coords, rec_layers, parent_coords, parent_layers, conn
        this.preGridGenData = this.DeepFragMakeGrid.pre_grid_gen(
            this.receptorPdb, this.ligandPdb, this.center
        );
    }

    /**
     * Makes a base tensor from which others are derived. Saved to
     * this.baseTensor. If this.fullRotationAtEveryInferance is true, also
     * applies a random rotation to the base tensor.
     * @returns void
     */
    protected makeBaseTensorWithOptionalFullRotation(): void {
        // Note: preGridGenData made in constructor.

        if (this.fullRotationAtEveryInferance) {
            // Rotate the receptor and ligand about the connection point.
            var rot = randomRotation();
            this.preGridGenData[0] = quaternionRotation(this.preGridGenData[0], rot, this.center); // receptor
            this.preGridGenData[2] = quaternionRotation(this.preGridGenData[2], rot, this.center); // parent
        }

        // Generate the flattened grid containing all channels. Loads from
        // cache if not doing full rotations with every inference. Grid stored
        // in this.currentGrid.
        this.makeGrid();

        // Run tf ops inside tf.tidy to automatically clean up intermediate
        // tensors.
        let origTensor = tf.tidy(() => {
            // Build tensor from flattened grid
            return tf.tensor(this.currentGrid, [
                GRID_CHANNELS,
                GRID_WIDTH,
                GRID_WIDTH,
                GRID_WIDTH,
            ]);
        });

        this.baseTensor = origTensor;
    }

    /**
     * Makes the grid that eventually becomes a tensor. Caches return unless
     * it needs to be generated every time inference is run. Grid is stored in
     * this.currentGrid.
     * @returns void
     */
    makeGrid(): void {
        // NOTE: This assumes preGridData has already been fully rotated, if
        // necessary. But reflections/90-degree rotations come after this
        // step. Might consider a more straightforward approach in the future.

        // If you are not doing a full rotation, you only need to generate the
        // grid once.
        if (!this.fullRotationAtEveryInferance && this.currentGrid !== undefined) {
            return this.currentGrid;
        }

        let grids = [];
        for (let i = 0; i < 9; i++) {
            grids.push(
                this.DeepFragMakeGrid.make_grid_given_channel(
                    this.preGridGenData[0], this.preGridGenData[1],
                    this.preGridGenData[2], this.preGridGenData[3],
                    this.preGridGenData[4], i
                )
            );
        }

        // Merge all the channels into one.
        this.currentGrid = this.DeepFragMakeGrid.sum_channel_grids(grids);
    }

    /**
     * Shows some of the tensor values in the console. For debugging only.
     * @param  {*} tensor  The tensor.
     * @returns void
     */
    protected showSelectTensorValuesForDebug(tensor: any): void {
        let dd: number[] = Array.from(tensor.dataSync().filter(i => i !== 0));
        let dd1 = dd.slice(0, 5).map(i => i.toFixed(2));
        let dd2 = dd.slice(dd.length - 5).map(i => i.toFixed(2));
        let dd3 = dd1.join(" ") + " " + dd2.join(" ");
        console.log(dd3);
    }

    /**
     * Gets a batch of tensors, each rotated (or reflected) as appropriate.
     * @param  {number} totalNumRotationsNeeded  The total number of rotations
     *                                           you'll need in the end. Used
     *                                           to make sure you don't keep
     *                                           delivering tensors beyond
     *                                           what's needed.
     * @returns any[]  An array containing the tensors.
     */
    public getTensors(totalNumRotationsNeeded: number): any[] {
        // Returns (possibly) multiple grids at a time. Keep to 4 or less to avoid
        // using too much memory.
        var tensors = [];

        while (true) {
            if (this.numTensorsGeneratedSoFar >= totalNumRotationsNeeded) {
                // already made enough
                break;
            }

            let t = this.makeNewTensorFromBase();

            // @ts-ignore
            let newTensor = t.reshape([
                1,
                GRID_CHANNELS,
                GRID_WIDTH,
                GRID_WIDTH,
                GRID_WIDTH
            ]);
            tensors.push(newTensor);
            this.numTensorsGeneratedSoFar++;

            // this.showSelectTensorValuesForDebug(newTensor);

            if (tensors.length === NUM_TENSORS_PER_BATCH) {
                return tensors;
            }
        }

        // Could be ones left over if num pseuo rotations not divisible by four.
        if (tensors.length > 0) {
            return tensors;
        }

        return undefined;
    }

    /**
     * Creates a new tensor from the base tensor.
     * @returns *  The new tensor.
     */
    protected abstract makeNewTensorFromBase(): any;

    /**
     * Sets up this class. Called from parent constructor.
     * @returns void
     */
    protected abstract setup(): void;
}
