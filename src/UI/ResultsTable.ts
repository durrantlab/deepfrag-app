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
declare var SmilesDrawer;

const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 50;
const CANVAS_PADDING = 10;

/** An object containing the vue-component computed functions. */
let computedFunctions = {
    /**
     * Gets the items in the results table.
     * @returns any[]  The array of items.
     */
    "items"(): any[] {
        let data = this.$store.state["deepFragOutput"];
        let dataLen = data.length > 20 ? 20 : data.length;
        let items = [];
        // let errorDetected = false;
        for (let i = 0; i < dataLen; i++) {
            const dataItem = data[i];
            const smilesForVis = dataItem[0].replace("[C-]", "C").replace("*", "[R]");
            items.push({
                "Rank": i + 1,
                "SMILES": dataItem[0],
                "Structure": `<canvas style="width:${CANVAS_WIDTH + 2 * CANVAS_PADDING}px;height:${CANVAS_HEIGHT + 2 * CANVAS_PADDING}px;" data-smiles="${smilesForVis}"></canvas>`,
                "Score": dataItem[1].toFixed(3)
            });
        }
        return items;
    }
}

/** An object containing the vue-component methods functions. */
let methodsFunctions = {
    /**
     * Draws the structures on the appropriate canvases.
     * @returns void
     */
    "updateSMILESDrawerCanvases"(): void {
        SmilesDrawer.apply({
            "debug": false,
            "atomVisualization": 'default',
            "width": CANVAS_WIDTH,
            "height": CANVAS_HEIGHT,
            "padding": CANVAS_PADDING,
            "compactDrawing": false
        });
    }
}

/**
 * Setup the results-table Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('results-table', {
        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data": function() {
            return {
                "fields": [
                    {"key": "Rank", "class": ["no-mobile"]},
                    {"key": "SMILES", "class": ["results-table-col"], "thClass": "no-text-wrap"},
                    {"key": "Structure", "class": ["results-table-col", "center-table-text"], "thClass": "hidden-mobile"},
                    {"key": "Score", "class": ["results-table-col", "center-table-text"], "thClass": "no-text-wrap"}
                ]
            }
        },

        "computed": computedFunctions,

        /**
         * Update structures every time component updates.
         * @returns void
         */
        "updated": function(): void {
            this["updateSMILESDrawerCanvases"]();
        },

        // See https://github.com/bootstrap-vue/bootstrap-vue/issues/4343
        "template": `
        <b-table :items="items" :fields="fields">
            <template #head()="data">
                <b>{{ data.label }}</b>
            </template>
            <template #cell()="data">
                {{ data.value }}
            </template>
            <template #cell(Structure)="data">
                <div class="inner-table-struct">
                    <span v-html="data.value"></span>
                </div>
            </template>
        </b-table>
        `,

        "props": {},
        "methods": methodsFunctions
    })
}
