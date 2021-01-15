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


import * as Utils from "../../Utils";
import * as Interface from "../../DeepFrag/Interface";

declare var Vue;

/** An object containing the vue-component computed functions. */
let computedFunctions = {
    /**
     * Whether to hide the vina docking-box parameters.
     * @returns boolean  True if they should be hidden, false otherwise.
     */
    "hideDockingBoxParams"(): boolean {
        return this.$store.state.hideDockingBoxParams;
    },

    /** Whether to show the keep-protein-only link. Has both a getter and a setter. */
    "showKeepProteinOnlyLink": {
        get(): number {
            return this.$store.state["showKeepProteinOnlyLink"];
        },
        set(val: number): void {
            this.$store.commit("setVar", {
                name: "showKeepProteinOnlyLink",
                val: val
            });
        }
    },

    /** Whether to delete or select a ligand atom. **/
    "selectedAtomClickAction": {
        get(): number {
            return this.$store.state["selectedAtomClickAction"];
        },

        set(val: number): void {
            this.$store.commit("setVar", {
                name: "selectedAtomClickAction",
                val: val
            });
        }
    },

    /**
     * Whether the receptor and sphere file have been specified.
     * @returns boolean
     */
    "bothReceptorAndLigandSpecified"(): boolean {
        let validation = this.$store.state["validation"];
        return validation["receptor"] && validation["ligand"];
    },

    /**
     * Whether to show the message saying that the user must specifiy a
     * growing point.
     * @returns boolean
     */
    "showDefineGrowingPointValidationMsg"(): boolean {
        if (!this["bothReceptorAndLigandSpecified"]) {
            return false;
        }

        let validation = this.$store.state["validation"];
        if (!(validation["center_x"] || validation["center_y"] || validation["center_z"])) {
            return true;
        }
    },

    /**
     * Whether to show the receptor and ligand file inputs.
     * @returns boolean
     */
    "showFileInputs"(): boolean {
        return this.$store.state["showFileInputs"];
    },

    /**
     * Whether to show information about Pin1p (because example data).
     * @returns boolean
     */
    "isExampleData"(): boolean {
        return this.$store.state["isExampleData"];
    },

    /**
     * Whether to "Load Saved Data" button should be enabled.
     * @returns boolean
     */
    "isLoadBtnEnabled"(): boolean {
        if (!this["canLoad"]) {
            return false;
        }

        if (this.$store.state["deepFragParams"]["center_x"] !== undefined) {
            return false;
        }

        if (this.$store.state["ligandContents"] !== "") {
            return false;
        }

        if (this.$store.state["receptorContents"] !== "") {
            return false;
        }

        // if (!this["validate"](false)) {
        //     return false;
        // }

        return true;
    },

    /**
     * Whether the "Temporary Save" button should be enabled.
     * @returns boolean
     */
    "saveBtnDisabled"(): boolean {
        if (!this["validate"](false)) {
            return true;
        }
        if (this["fakeSaving"]) {
            return true;
        }
        return false;
    },

    /**
     * The style to apply to the save button. Faking a delay so the user
     * realizes the info has been saved.
     * @returns string
     */
    "saveBtnStyle"(): string {
        if (this["fakeSaving"]) {
            return "cursor:wait;";
        }
        if (!this["validate"](false)) {
            return 'cursor:not-allowed;';
        }
        return "";
    },

    "numPseudoRotations": {
        /**
         * Gets the number of rotations for improving accuracy.
         * @returns number
         */
        get(): number {
            return this.$store.state["numPseudoRotations"];
        },

        /**
         * Sets the number of rotations for improving accuracy.
         * @param  {string} val  The numebr of rotations, but as a string.
         * @returns void
         */
        set(val: string): void {
            this.$store.commit("setVar", {
                name: "numPseudoRotations",
                val: parseInt(val)
            });
        }
    },

    /**
     * Gets the styles to apply to the warning, with the goal of encouraging
     * users to not use too many rotations.
     * @returns string
     */
    "manyRotsWarningStyle"(): string {
        let ratio = (this["numPseudoRotations"] - 4) / 28.0;
        if (ratio < 0) { ratio = 0; }
        console.log(ratio);
        let color: number[] = [];
        if (ratio <= 0.5) {
            let ratio2 = ratio / 0.5;
            color = this.betweenColors([55, 58, 60], [175, 175, 0], ratio2);
        } else {
            let ratio2 = (ratio - 0.5) / 0.5;
            color = this.betweenColors([175, 175, 0], [255, 0, 0], ratio2);
        }
        // console.log(ratio);
        return `color:rgb(${color[0]}, ${color[1]}, ${color[2]}); ${ratio > 0.25 ? "font-weight:bold;" : ""}`;
    }
}

/** An object containing the vue-component methods functions. */
let methodsFunctions = {
    /**
     * Runs when user indicates theye want to use example vina input files,
     * rather than provide their own.
     * @returns void
     */
    "useExampleDeepFragInputFiles"(): void {
        this.$store.commit("setVar", {
            name: "showFileInputs",
            val: false
        });

        this.$store.commit("setVar", {
            name: "isExampleData",
            val: true
        });

        this.$store.dispatch("loadReceptorLigandSimultaneously", {
            receptorContents: this.$store.state["receptorContentsExample"],
            ligandContents: this.$store.state["ligandContentsExample"],
            yellowSphereCoors: [38.753, -13.383, 11.064]
        }).then(() => {
            // These values should now validate.
            let validateVars = Object.keys(this.$store.state["validation"]);
            const validateVarsLen = validateVars.length;
            for (let i = 0; i < validateVarsLen; i++) {
                const validateVar = validateVars[i];
                this.$store.commit("setValidationParam", {
                    name: validateVar,
                    val: true
                });
            }

            // Also update file names.
            this.$store.commit("updateFileName", { type: "ligand", filename: "2XP9.aligned.lig.no_carboxylate.sdf" });
            this.$store.commit("updateFileName", { type: "receptor", filename: "2XP9.aligned.pdb" });
        });
    },

    /**
     * Runs when the user presses the submit button.
     * @returns void
     */
    "onSubmitClick"(): void {
        if (this["validate"]() === true) {
            this.$store.commit("disableTabs", {
                "parametersTabDisabled": true,
                "runningTabDisabled": false,
                "startOverTabDisabled": true,
            });

            jQuery("body").addClass("waiting");

            this.$store.commit("setVar", {
                name: "waitingMsg",
                val: "Downloading DeepFrag files to predict fragments in your browser (about 40 MB)..."
            })

            Vue.nextTick(() => {
                this.$store.commit("setVar", {
                    name: "tabIdx",
                    val: 2
                });

                Vue.nextTick(() => {
                    this.$store.commit("updateLigandContentsPerViewerLigand");

                    // Create growing-point string for output.
                    let deepFragParams = this.$store.state["deepFragParams"];
                    this.$store.commit("setVar", {
                        name: "growingPointJSON",
                        val: [
                            deepFragParams["center_x"],
                            deepFragParams["center_y"],
                            deepFragParams["center_z"]
                        ]
                    });

                    // Keep track of start time
                    this.$store.commit("setVar", {
                        name: "time",
                        val: new Date().getTime()
                    });

                    Interface.runDeepFrag(
                        this.$store.state["receptorPdbTxtFrom3DMol"],
                        this.$store.state["ligandPdbTxtFrom3DMol"],
                        [
                            deepFragParams["center_x"],
                            deepFragParams["center_y"],
                            deepFragParams["center_z"],
                        ],
                        this["numPseudoRotations"]
                    ).then((vals: any[]) => {
                        this.$store.commit("setVar", {
                            name: "time",
                            val: Math.round((new Date().getTime() - this.$store.state["time"]) / 100) / 10
                        });

                        this.afterDeepFrag(vals);
                    });
                });
            });
        }
    },

    /**
     * Runs when the user clicks the "Temporary Save" button. Saves the
     * information to local storage.
     * @returns void
     */
    "onSaveClick"(): void {
        this["fakeSaving"] = true;
        this.$store.dispatch("saveVueXToLocalStorage").then(() => {
            // this["canLoad"] = false;
            setTimeout(() => {
                this["fakeSaving"] = false;
            }, 1000);
        });
    },

    /**
     * Runs when the user clicks the "Load Saved Data" button. Loads the
     * information from local storage.
     * @returns void
     */
    "onLoadClick"(): void {
        this.$store.dispatch("loadVueXFromLocalStorage");
    },

    /**
     * Removes residues from protein model that are not protein amino acids.
     * @param  {*} e  The click event.
     * @returns void
     */
    "onShowKeepProteinOnlyClick"(e: any): void {
        let linesToKeep = Utils.keepOnlyProteinAtoms(this.$store.state["receptorContents"]);

        this.$store.commit("setVar", {
            name: "receptorContents",
            val: linesToKeep
        });

        this.$store.commit("updateFileName", {
            type: "receptor",
            filename: Utils.replaceExt(
                this.$store.state["receptorFileName"],
                "protein.pdb"
            )
        });

        this["showKeepProteinOnlyLink"] = false;

        e.preventDefault();
        e.stopPropagation();
    },

    /**
     * Determines whether all form values are valid.
     * @param  {boolean} [modalWarning=true]  Whether to show a modal if they
     *                                        are not valid.
     * @returns boolean  True if they are valid, false otherwise.
     */
    "validate"(modalWarning: boolean=true): boolean {
        let validations = this.$store.state["validation"];
        let pass = true;

        const paramName = Object.keys(validations);
        const paramNameLen = paramName.length;
        let badParams: string[] = [];
        for (let i = 0; i < paramNameLen; i++) {
            const name = paramName[i];
            const valid = validations[name];
            if (valid === false) {
                pass = false;
                badParams.push(name);
            }
        }

        if (pass === false) {
            if (modalWarning === true) {
                this.$store.commit("openModal", {
                    title: "Invalid Parameters!",
                    body: "<p>Please correct the following parameter(s) before continuing: <code>" + badParams.join(" ") + "</code></p>"
                });
            }
        }

        this.$store.commit("setVar", {
            name: "deepFragParamsValidates",
            val: pass
        })

        return pass;
    },

    /**
     * Runs after the DeepFrag run is complete.
     * @param  {*} vals  The DeepFrag SMILES strings and scores. First
     *                   item as array of arrays, second item as CSV string.
     * @returns void
     */
    afterDeepFrag(vals: any[]): void {
        let scores = vals[0];
        let scoresCSV = vals[1];

        // Disable some tabs
        this.$store.commit("disableTabs", {
            "parametersTabDisabled": true,
            "runningTabDisabled": true,
            "outputTabDisabled": false,
            "startOverTabDisabled": false
        });

        // Switch to output tab.
        this.$store.commit("setVar", {
            name: "tabIdx",
            val: 3
        });

        // Update scoresCSV to show output.
        this.$store.commit("setVar", {
            name: "scoresCSV",
            val: scoresCSV
        });

        // Process the standard output (extract scores and rmsds) and frames.
        this.$store.commit("setVar", {
            name: "deepFragOutput",
            val: scores
        });

        jQuery("body").removeClass("waiting");
    },

    /**
     * Interpolates betwewen two colors.
     * @param  {number[]} color1  The first color, [r, g, b].
     * @param  {number[]} color2  The second color, [r, g, b].
     * @param  {number}   ratio   The ratio.
     * @returns number[]  The interpolated color.
     */
    betweenColors(color1: number[], color2: number[], ratio: number): number[] {
        let result: number[] = [];
        for (let i = 0; i < 3; i++) {
            result.push(
                ratio * (color2[i] - color1[i]) + color1[i]
            );
        }
        return result;
    }
}

/**
 * The vue-component mounted function.
 * @returns void
 */
function mountedFunction(): void {
    this["canLoad"] = sessionStorage.getItem("deepFragSaveData") !== null;
    this["webAssemblyAvailable"] = Utils.webAssemblySupported();
}

/**
 * Setup the vina-params Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('vina-params', {
        "template": `
            <div>
                <b-form v-if="webAssemblyAvailable">
                    <sub-section
                      title="Input Receptor and Ligand Files"
                      v-if="showFileInputs">
                        <file-input
                            label="Receptor"
                            id="receptor"
                            description="Formats: PDB, XYZ, and PQR. No hydrogen atoms required."
                            accept=".pdb,.xyz,.pqr" convert=""
                        >
                            <template v-slot:extraDescription>
                                <span v-if="showKeepProteinOnlyLink">
                                    <a href='' @click="onShowKeepProteinOnlyClick($event);">Automatically remove all non-protein atoms?</a>
                                </span>
                                <span v-else>
                                    <b>(Removed all non-protein atoms!)</b>
                                </span>
                            </template>
                        </file-input>

                        <file-input
                            label="Ligand"
                            id="ligand"
                            description="Formats: PDB, SDF, XYZ, and MOL2. No hydrogen atoms required."
                            accept=".pdb,.sdf,.xyz,.mol2" convert=""
                        >
                            <template v-slot:extraDescription></template>
                        </file-input>
                        <form-button
                            id="useExampleFiles"
                            v-if="$store.state.ligandContents === '' && $store.state.receptorContents === ''"
                            @click.native="useExampleDeepFragInputFiles"
                            cls="float-right">Use Example Files</form-button>
                    </sub-section>

                    <b-alert :show="isExampleData">
                        Peptidyl-prolyl cis-trans isomerase NIMA-interacting 1 (<b><i>Hs</i>Pin1p</b>)
                        bound to a small-molecule inhibitor (PDB ID: <a
                            href="https://www.rcsb.org/structure/2XP9"
                            target="_blank">2XP9</a>). A ligand <b>carboxylate moiety</b> has been
                            removed at the growing point marked with a yellow sphere.
                    </b-alert>

                    <sub-section title="Molecular Viewer">
                        <form-group
                            label=""
                            id="input-group-receptor-3dmol"
                            description=""
                        >
                            <div class="bv-example-row container-fluid">
                                <b-row>
                                    <b-col style="padding-left: 0; padding-right: 10px;">
                                        <threedmol
                                            id="main-viewer"
                                            type="receptor"></threedmol>
                                    </b-col>
                                </b-row>
                            </div>
                        </form-group>
                        <b-container fluid v-if="bothReceptorAndLigandSpecified">
                            <b-form-radio-group
                                style="width:100%"
                                id="selected-atom-actions"
                                v-model="selectedAtomClickAction"
                                :options="atomClickActions"
                                buttons
                                button-variant="outline-primary"
                                name="selected-atom-actions"
                            ></b-form-radio-group>
                        </b-container>
                        <small v-if="showDefineGrowingPointValidationMsg" style="text-align:center;" alert tabindex="-1" class="text-danger form-text">To continue, select an atom to define the growing (connection) point!</small>
                    </sub-section>

                    <span style="display:none;">{{validate(false)}}</span>  <!-- Hackish. Just to make reactive. -->

                    <form-group
                        v-if="bothReceptorAndLigandSpecified"
                        label=""
                        id="rotations-count"
                        description=""
                    >
                        <label for="numPseudoRotationsRange">
                            Rotating/reflecting molecules to generate multiple
                            predictions improves accuracy but requires more computer
                            memory. <span :style="manyRotsWarningStyle">Large values may crash the app.</a>
                        </label>
                        <b-form-input id="numPseudoRotationsRange" v-model="numPseudoRotations" type="range" min="1" max="32"></b-form-input>
                        <div style="text-align:center;margin-top:-10px;"><small>
                            ({{numPseudoRotations}}
                            <span v-if="numPseudoRotations > 1">rotations/reflections)</span>
                            <span v-else="numPseudoRotations > 1">rotation/reflection)</span>
                        </small></div>
                    </form-group>

                    <form-button id="startDeepFrag" :style="!validate(false) ? 'cursor:not-allowed' : ''" :disabled="!validate(false)" @click.native="onSubmitClick" variant="primary" cls="float-right mb-4 ml-2">Start DeepFrag</form-button>
                    <form-button :style="!isLoadBtnEnabled ? 'cursor:not-allowed' : ''" :disabled="!isLoadBtnEnabled" @click.native="onLoadClick" variant="primary" cls="float-right mb-4 ml-2">Load Saved Data</form-button>
                    <form-button id="tempSave" :style="saveBtnStyle" :disabled="saveBtnDisabled" @click.native="onSaveClick" variant="primary" cls="float-right mb-4">Temporary Save</form-button>

                </b-form>
                <div v-else>
                    <p>Unfortunately, your browser does not support WebAssembly.
                    Please <a href='https://developer.mozilla.org/en-US/docs/WebAssembly#Browser_compatibility'
                    target='_blank'>switch to a browser that does</a> (e.g., Google Chrome).</p>
                </div>
            </div>
        `,
        "props": {},
        "computed": computedFunctions,

        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data"() {
            return {
                "webAssemblyAvailable": true,
                "canLoad": false,
                "fakeSaving": false,
                "atomClickActions": [
                    {"text": "Delete Atom", "value": "delete"},
                    {"text": "Select Atom as Growing Point", "value": "select"},
                ]
            }
        },

        "methods": methodsFunctions,

        /**
         * Runs when the vue component is mounted.
         * @returns void
         */
        "mounted": mountedFunction
    })
}
