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

/** An object containing the vue-component computed functions. */
let computedFunctions = {
    /** The visibility (boolean, open/closed) of the modal. Can both get and
     * set. */
    "modalShow": {
        get(): boolean {
            return this.$store.state["modalShow"];
        },

        set(val: boolean): void {
            this.$store.commit("setVar", {
                name: "modalShow",
                val
            });
        }
    },

    /**
     * Gets the modal title.
     * @returns string  The title.
     */
    "title"(): string {
        return this.$store.state["modalTitle"];
    },

    /**
     * Get's the modal body.
     * @returns string  The body.
     */
    "body"(): string {
        return this.$store.state["modalBody"];
    }
}

/**
 * Setup the open-modal Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('open-modal', {
        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data": function() {
            return {}
        },
        "computed": computedFunctions,
        "template": `
            <b-modal ok-only :size="size" ok-title="Close" v-model="modalShow" id="msg-modal" :title="title">
                <p class="my-4" v-html="body"><slot></slot></p>
            </b-modal>
        `,
        "props": {
            "size": {
                "type": String,
                "default": "lg"  // could also be xl and sm
            }
        }
    })
}
