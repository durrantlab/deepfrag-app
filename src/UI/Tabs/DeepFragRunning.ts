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

/**
 * Setup the deepfrag-running Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('deepfrag-running', {
        "template": `
            <div class="text-center">
                <b-spinner style="width: 4rem; height: 4rem;" label="Working"></b-spinner>
                <br /><br />
                <p>{{this.$store.state.waitingMsg}}</p>
                <p>This page may become unresponsive while performing calculations.
                   Need to stop DeepFrag but can't close this tab? Use your browser or
                   operating-system Task Manager.</p>
            </div>
        `,
        "props": {},
        "computed": {},

        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data"() {
            return {
                "msg": "",
                msgIdx: 0
            }
        },
        "methods": {}
    })
}
