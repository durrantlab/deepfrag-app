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
    /**
     * Determine which class to add to this button.
     * @returns string  The classes.
     */
    "classToUse"(): string {
        let classes = [this["cls"]];
        if (this["small"] === true) {
            classes.push("download-button float-right ml-1");
        }
        return classes.join(" ");
    },

    /**
     * Determine which button size to use.
     * @returns string  The size.
     */
    "sizeToUse"(): string {
        if (this["small"] === true) {
            return "sm";
        }
        return "";
    }
}

/**
 * Setup the form-button Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('form-button', {
        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data": function() {
            return {}
        },
        "computed": computedFunctions,
        "template": `
            <b-button :disabled="disabled" :pill="small" :size="sizeToUse" :class="classToUse" :variant="variant"><slot></slot></b-button>
        `,
        "props": {
            "variant": String,
            "cls": String,
            "small": {
                "type": Boolean,
                "default": false
            },
            "disabled": {
                "type": Boolean,
                "default": false
            }
        }
    })
}
