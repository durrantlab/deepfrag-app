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

// This tensor genorator fully rotates each tensor.

import { GeneratorParent } from "./GeneratorParent";

export class OriginalGenerator extends GeneratorParent {
    protected fullRotationAtEveryInferance = true;

    /**
     * Sets up this class. Called from parent constructor.
     * @returns void
     */
    protected setup(): void {
        // Returns nothing by design.
        return;
    }

    /**
     * Creates a new tensor from the base tensor.
     * @returns *  The new tensor.
     */
    public makeNewTensorFromBase(): any {
        // Just do a full rotation every time.
        this.makeBaseTensorWithOptionalFullRotation();
        return this.baseTensor;
    }
}
