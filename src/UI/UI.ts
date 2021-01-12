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
import * as Utils from "../Utils";
import { VERSION } from "../Version";

declare var Vue;

var byLine = "Ligand optimization in the browser";

/**
 * Setup the main Vue app.
 * @returns void
 */
export function setup(): void {
    new Vue({
        "el": '#app',
        "store": Store.store,
        "template": `
            <div class="container-fluid">
                <open-modal></open-modal>
                <convert-file-modal></convert-file-modal>
                <draw-smiles-modal></draw-smiles-modal>
                <!-- <div id="no-mobile">
                    <b-jumbotron class="jumbo" header="DeepFrag ${VERSION}" lead="${byLine}">
                        <p>DeepFrag ${VERSION} is not designed to work on mobile phones. Please use a device with a larger screen.</p>
                    </b-jumbotron>
                </div> -->

                <b-jumbotron class="jumbo" style="background-image:url(${Utils.curPath()}deepfrag_logo.jpg);" header="DeepFrag ${VERSION}" lead="${byLine}">
                    <p>Brought to you by the <a target="_blank" href="http://durrantlab.com">Durrant Lab</a>.</p>
                    <b-button variant="primary" target="_blank" href="http://durrantlab.com">More Info</b-button>
                </b-jumbotron>

                <b-card no-body class="mb-3">
                    <b-tabs v-model="tabIdx" card fill pills vertical content-class="mt-3">
                        <b-tab title="Input Parameters" active :disabled="parametersTabDisabled">
                            <b-card-text>
                                <vina-params></vina-params>
                            </b-card-text>
                        </b-tab>
                        <b-tab title="Running DeepFrag" :disabled="runningTabDisabled">
                            <b-card-text>
                                <vina-running></vina-running>
                            </b-card-text>
                        </b-tab>
                        <b-tab title="Output" :disabled="outputTabDisabled">
                            <b-card-text>
                                <vina-output></vina-output>
                            </b-card-text>
                        </b-tab>
                        <b-tab title="Start Over" :disabled="startOverTabDisabled">
                            <b-card-text>
                                <start-over></start-over>
                            </b-card-text>
                        </b-tab>
                    </b-tabs>
                </b-card>
            </div>
        `,

        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data"() {
            return {
                "receptorFile": false,
                "ligandFile": false
            }
        },
        "computed": {
            /** Gets and sets the tabIdx. */
            "tabIdx": {
                get(): number {
                    return this.$store.state["tabIdx"];
                },

                set(val: number): void {
                    this.$store.commit("setVar", {
                        name: "tabIdx",
                        val: val
                    });
                }
            },

            /**
             * Determine whether the parameters tab is disabled.
             * @returns boolean  True if it is disabled, false otherwise.
             */
            "parametersTabDisabled"(): boolean {
                return this.$store.state["parametersTabDisabled"];
            },

            /**
             * Determine whether the running tab is disabled.
             * @returns boolean  True if it is disabled, false otherwise.
             */
            "runningTabDisabled"(): boolean {
                return this.$store.state["runningTabDisabled"];
            },

            /**
             * Determine whether the output tab is disabled.
             * @returns boolean  True if it is disabled, false otherwise.
             */
            "outputTabDisabled"(): boolean {
                return this.$store.state["outputTabDisabled"];
            },

            /**
             * Determine whether the start over tab is disabled.
             * @returns boolean  True if it is disabled, false otherwise.
             */
            "startOverTabDisabled"(): boolean {
                return this.$store.state["startOverTabDisabled"];
            }
        },

        "methods": {},

        /**
         * Runs when the vue component is mounted.
         * @returns void
         */
        "mounted"() {
            // window["$store"] = this.$store;  // For debugging
        }
    })
}
