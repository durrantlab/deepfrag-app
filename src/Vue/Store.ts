// This file is part of DeepFrag, released under the Apache 2.0 License. See
// LICENSE.md or go to https://opensource.org/licenses/Apache-2.0 for full
// details. Copyright 2020 Jacob D. Durrant.


import * as Utils from "../Utils";

// @ts-ignore
import ExampleReceptorPDB from "../example/2XP9.aligned.pdb";

// @ts-ignore
import ExampleLigandSDF from "../example/2XP9.aligned.lig.no_carboxylate.sdf";


declare var Vuex;

interface IVueXStoreSetVar {
    name: string;
    val: any;
}

interface iVueXParam {
    stateVarName?: string;
    name: string;
    val: any;
}

interface IModal {
    title: string;
    body: string;
}

interface IInputFileNames {
    type: string;
    filename: string;
}

interface IReceptorLigandContents {
    receptorContents: string;
    ligandContents: string;
    yellowSphereCoors: number[];
}

export const store = new Vuex.Store({
    "state": {
        "deepFragParams": {
            "center_x": undefined,
            "center_y": undefined,
            "center_z": undefined
        },
        "validation": {
            "receptor": false,
            "ligand": false,
            "center_x": false,
            "center_y": false,
            "center_z": false
        },
        hideDockingBoxParams: false,
        "tabIdx": 0,
        "ligandFileName": "",
        "ligandContents": "",
        "ligandContentsExample": ExampleLigandSDF,
        "ligandPdbTxtFrom3DMol": "",
        "receptorFileName": "",
        "receptorContents": "",
        "receptorContentsExample": ExampleReceptorPDB,
        "receptorPdbTxtFrom3DMol": "",
        "showKeepProteinOnlyLink": true,
        "parametersTabDisabled": false,
        "runningTabDisabled": true,
        "startOverTabDisabled": false,
        "outputTabDisabled": true,
        "deepFragOutput": [],
        "scoresCSV": "",
        "growingPointJSON": [0, 0, 0],
        "modalShow": false,
        "modalTitle": "Title",
        "modalBody": "Some text here...",
        "deepFragParamsValidates": false,
        "time": 0,  // Used to keep track of execution time.
        "selectedAtomClickAction": "select",
        "showFileInputs": true,
        "isExampleData": false
    },
    "mutations": {
        /**
         * Set one of the VueX store variables.
         * @param  {*}                state    The VueX state.
         * @param  {IVueXStoreSetVar} payload  An object containing
         *                                     information about which
         *                                     variable to set.
         * @returns void
         */
        "setVar"(state: any, payload: IVueXStoreSetVar): void {
            state[payload.name] = payload.val;
        },

        /**
         * Set one of the vina parameters.
         * @param  {*}          state    The VueX state.
         * @param  {iVueXParam} payload  An object with information about
         *                               which vina parameter to set.
         * @returns void
         */
        "setDeepFragParam"(state: any, payload: iVueXParam): void {
            // By redefining the whole variable, it becomes reactive. Directly
            // changing individual properties is not reactive.
            let deepFragParams = state["deepFragParams"];
            deepFragParams[payload.name] = payload.val;
            state["deepFragParams"] = deepFragParams;
        },

        /**
         * Set a validation parameter (either validates or doesn't).
         * @param  {*}          state    The VueX state.
         * @param  {iVueXParam} payload  An object containing information
         *                               about what to set.
         * @returns void
         */
        "setValidationParam"(state: any, payload: iVueXParam): void {
            // By redefining the whole variable, it becomes reactive. Directly
            // changing individual properties is not reactive.
            state["validation"] = Utils.getNewObjWithUpdate(
                state["validation"],
                payload.name,
                payload.val
            );
        },

        /**
         * Disable or enable tabs.
         * @param  {*} state    The VueX stste.
         * @param  {*} payload  An object containing information about which
         *                      tabs should be enabled or disabled.
         * @returns void
         */
        "disableTabs"(state: any, payload: any): void {
            const tabDisableVarNames = Object.keys(payload);
            const tabDisableVarNamesLen = tabDisableVarNames.length;
            for (let i = 0; i < tabDisableVarNamesLen; i++) {
                const tabDisableVarName = tabDisableVarNames[i];
                let val = payload[tabDisableVarName];
                val = val === undefined ? true : val;
                state[tabDisableVarName] = val;
            }

            // If the output tab has been enabled, you should also warn the
            // user about closing the website.
            if (payload["outputTabDisabled"] === false) {
                window.addEventListener("beforeunload", (event) => {
                    event.preventDefault();

                    // No modern browser respects the returnValue anymore. See
                    // https://stackoverflow.com/questions/45088861/whats-the-point-of-beforeunload-returnvalue-if-the-message-does-not-get-set
                    event.returnValue = "";
                });
            }
        },

        /**
         * Open the modal.
         * @param  {*}      state    The VueX state.
         * @param  {IModal} payload  An object with the title and body.
         * @returns void
         */
        "openModal"(state: any, payload: IModal): void {
            state["modalTitle"] = payload.title;
            state["modalBody"] = payload.body;
            state["modalShow"] = true;
            jQuery("body").removeClass("waiting");
        },

        /**
         * Update the filenames of the receptor and ligand input files.
         * @param  {*}               state    The VueX state.
         * @param  {IInputFileNames} payload  An object describing the
         *                                    filename change.
         * @returns void
         */
        "updateFileName"(state: any, payload: IInputFileNames): void {
            // Also update file names so example vina command line is valid.
            state[payload.type + "FileName"] = payload.filename;
        },

        "updateLigandContentsPerViewerLigand"(state: any): void {
            // Update the ligand file to reflect any deleted atoms.
            // To trigger pdb formatting.
            state["ligandFileName"] = (state["ligandFileName"] + ".pdb").replace(".pdb.pdb", ".pdb");
            state["ligandContents"] = state["ligandPdbTxtFrom3DMol"];
        }
    },
    "actions": {
        "saveVueXToLocalStorage"(context: any): void {
            // Record any deleted atoms first.
            context.commit("updateLigandContentsPerViewerLigand");

            let data = {}
            const varNames = Object.keys(context.state);
            const varNamesLen = varNames.length;
            for (let i = 0; i < varNamesLen; i++) {
                const varName = varNames[i];
                const val = context.state[varName];
                data[varName] = val;
            }
            sessionStorage.setItem("deepFragSaveData", JSON.stringify(data));
        },
        "loadVueXFromLocalStorage"(context: any): void {
            let data = JSON.parse(
                sessionStorage.getItem("deepFragSaveData")
            );
            const varNames = Object.keys(context.state);
            const varNamesLen = varNames.length;
            let receptorContents = "";
            let ligandContents = "";
            let deepFragParams = {}
            for (let i = 0; i < varNamesLen; i++) {
                const varName = varNames[i];
                let val = data[varName];
                switch (varName) {
                    case "receptorContents":
                        receptorContents = val;
                        break;
                    case "ligandContents":
                        ligandContents = val;
                        break;
                    case "deepFragParams":
                        deepFragParams = val;
                        break;
                    default:
                        context.state[varName] = val;
                }
            }

            this.dispatch("loadReceptorLigandSimultaneously", {
                receptorContents: receptorContents,
                ligandContents: ligandContents,
                yellowSphereCoors: [
                    deepFragParams["center_x"],
                    deepFragParams["center_y"],
                    deepFragParams["center_z"]
                ]
            });
        },

        "loadReceptorLigandSimultaneously"(context: any, payload: IReceptorLigandContents) {
            return new Promise((resolve: Function, reject: Function) => {
                setTimeout(() => {  // Vue.nextTick doesn't work...
                    // Update some values. I found that if I do these all at
                    // once, it zooms to the wrong place. Not sure why, so I'm
                    // going to separate them with setTimeouts.
                    context.commit("setVar", {
                        name: "receptorContents",
                        val: payload.receptorContents
                    });

                    setTimeout(() => {
                        context.commit("setVar", {
                            name: "ligandContents",
                            val: payload.ligandContents
                        });

                        context.commit("setDeepFragParam", {
                            name: "center_x",
                            val: payload.yellowSphereCoors[0]
                        });
                        context.commit("setDeepFragParam", {
                            name: "center_y",
                            val: payload.yellowSphereCoors[1]
                        });
                        context.commit("setDeepFragParam", {
                            name: "center_z",
                            val: payload.yellowSphereCoors[2]
                        });

                        resolve();
                    }, 1500);
                }, 100);
            })
        }
    }
});

// Good for debugging.
window["store"] = store;
