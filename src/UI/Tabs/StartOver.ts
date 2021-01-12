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

declare var Vue;

/** An object containing the vue-component methods functions. */
let methodsFunctions = {
    /**
     * Runs when the start-over button is clicked.
     * @returns void
     */
    "onSubmitClick"(): void {
        jQuery("body").addClass("waiting");
        location.reload();
    }
}

/**
 * Setup the start-over Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('start-over', {
        "template": `
            <div class="text-center">
                <b-alert show variant="warning">If you start over, your existing data will be deleted. Proceed only if you have already saved your data using the "Download" button(s) in the "Output" tab.</b-alert>
                <form-button @click.native="onSubmitClick" variant="primary">Start Over</form-button>
            </div>
        `,

        "props": {},
        "computed": {},

        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data"(): any {
            return {}
        },

        "methods": methodsFunctions
    });
}
