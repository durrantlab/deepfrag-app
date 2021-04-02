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

// This rotates by 90 degree increments and reflects. Faster than doing a
// different (full) rotation every time.

import { GeneratorParent } from "./GeneratorParent";

declare var tf;

export class FastGenerator extends GeneratorParent {
    protected fullRotationAtEveryInferance = false;
    private reverseAndTransposeGen: IterableIterator<any>;

    // generate grid transpositions
    private REVERSE = [
        [],
        [1],
        [2],
        [3],
        [1,2],
        [1,3],
        [2,3],
        [1,2,3]
    ];

    private TRANSPOSE = [
        [0,1,2,3],
        [0,1,3,2],
        [0,2,1,3],
        [0,2,3,1],
        [0,3,1,2],
        [0,3,2,1],
    ];

    /**
     * A generator that returns the reverse/transpose arrays to use on the
     * next tensor.
     * @returns IterableIterator
     */
    private *getReverseAndTranspose(): IterableIterator<any> {
        for (var ri = 0; ri < this.REVERSE.length; ++ri) {
            for (var ti = 0; ti < this.TRANSPOSE.length; ++ti) {
                let reverse = this.REVERSE[ri];
                let transpose = this.TRANSPOSE[ti];
                yield [reverse, transpose];
            }
        }
    }

    /**
     * Sets up this class. Called from parent constructor.
     * @returns void
     */
    protected setup(): void {
        // You only need one base tensor, because you're not doing full
        // rotations here.
        this.makeBaseTensorWithOptionalFullRotation();

        // Generates the matrixes for the 90-degree rotations and reflections.
        this.reverseAndTransposeGen = this.getReverseAndTranspose();
    }

    /**
     * Creates a new tensor from the base tensor.
     * @returns *  The new tensor.
     */
    public makeNewTensorFromBase(): any {
        // Get the next reverse and transpose in line and apply it to the base
        // tensor, which has been genereated only one.

        let reverseAndTranspose = this.reverseAndTransposeGen.next().value;
        var t = tf
            .reverse(this.baseTensor, reverseAndTranspose[0])
            .transpose(reverseAndTranspose[1]);
        return t;
    }
}
