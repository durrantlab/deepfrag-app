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


declare var $3Dmol;
declare var Vue;

/** An object containing the vue-component computed functions. */
let computedFunctions = {
    /**
     * Get the value of the receptorContents variable.
     * @returns string  The value.
     */
    "receptorContents"(): string {
        return this.$store.state["receptorContents"];
    },

    /**
     * Get the value of the ligandContents variable.
     * @returns string  The value.
     */
    "ligandContents"(): string {
        return this.$store.state["ligandContents"];
    },

    /**
     * Get the value of the deepFragParams variable.
     * @returns string  The value.
     */
    deepFragParams(): string {
        return this.$store.state["deepFragParams"];
    },

    /**
     * Get the value of the surfBtnVariant variable.
     * @returns string|boolean  The value.
     */
    "surfBtnVariant"(): string|boolean {
        return (this["renderProteinSurface"] === true) ? undefined : "default";
    },

    /**
     * Get the value of the allAtmBtnVariant variable.
     * @returns string|boolean  The value.
     */
    "allAtmBtnVariant"(): string|boolean {
        return (this["renderProteinSticks"] === true) ? undefined : "default";
    },

    /**
     * Gets the coordinates of the yellow sphere.
     * @returns Array<number>  The coordinates.
     */
    "yellowSphereCoords"(): number[] {
        return [
            this.$store.state["deepFragParams"]["center_x"],
            this.$store.state["deepFragParams"]["center_y"],
            this.$store.state["deepFragParams"]["center_z"]
        ]
    }
}

/** An object containing the vue-component methods functions. */
let methodsFunctions = {
    /**
     * Runs when a new model has been added.
     * @param  {number} duration  How long to wait before adding that
     *                            model to 3dmol.js widget.
     * @returns void
     */
    modelAdded(duration: number): void {
        // Put app into waiting state.
        jQuery("body").addClass("waiting");
        this["msg"] = "Loading...";

        setTimeout(() => {
            // Initialize the viewer if necessary.
            if (this["viewer"] === undefined) {
                let element = jQuery("#" + this["id"] + "-" + this["type"] + "-3dmol");
                let config = {
                    "backgroundColor": "white",
                    "hoverDuration": 100
                };
                this["viewer"] = $3Dmol.createViewer(element, config);
                this["viewer"]["enableFog"](true);
            }

            let loadMolTxt = (typeStr: string): any => {
                let txt = this[typeStr + "Contents"];
                if (txt !== "") {
                    // Only proceed with load if pdb source has changed.
                    if (this[typeStr + "MolTxtOfLoaded"] !== txt) {
                        this[typeStr + "MolTxtOfLoaded"] = txt;

                        // Remove model if it has already been previously
                        // loaded.
                        let prevIdx = [0, 1].filter(
                            i => this["viewer"]["getModel"](i)?.molType === typeStr
                        )[0];
                        if (prevIdx !== undefined) {
                            this["viewer"]["removeModel"](
                                this["viewer"]["getModel"](prevIdx)
                            );
                        }

                        let ext = this.$store.state[typeStr + "FileName"].split(".");
                        ext = ext[ext.length - 1].lower();

                        this[typeStr + "Mol"] = this["viewer"]["addModel"](txt, ext, {"keepH": true});
                        this[typeStr + "Mol"].molType = typeStr;

                        // Also construct PDB from 3dmol object for passing to
                        // deepfrag when the time comes. Doing it this way so
                        // 3dmoljs can do the file-format conversion.
                        this.$store.commit("setVar", {
                            name: typeStr + "PdbTxtFrom3DMol",
                            val: mol3DToPDB(this[typeStr + "Mol"])
                        });

                        return this[typeStr + "Mol"];
                    }
                }
            }

            this["viewer"]["removeAllSurfaces"]();
            this["surfaceObj"] = undefined;

            let receptorModel = loadMolTxt("receptor");
            if (receptorModel !== undefined) {
                this.receptorAdded(receptorModel);
                this["receptorMol"] = receptorModel;
            }

            let ligandModel = loadMolTxt("ligand");
            if (ligandModel !== undefined) {
                this.ligandAdded(ligandModel);
                this["ligandMol"] = ligandModel;
            }

            this.zoomToMols(duration);

            // Stop waiting state.
            jQuery("body").removeClass("waiting");
        }, 50);
    },

    /**
     * Zooms to the molecules (ligand or receptor, as appropriate).
     * @param  {number} [duration=500]  How duration of the zoom.
     * @returns void
     */
    zoomToMols(duration = 500): void {
        this.render3Dmol();
        let parm = {
            "model": this["ligandMol"] !== undefined ? this["ligandMol"] : this["receptorMol"]
        };
        this["viewer"]["zoomTo"](parm, duration);
        this["viewer"]["zoom"](0.8, duration);
    },

    /**
     * Runs when a receptor has been added.
     * @param  {*} mol  The 3dmol.js molecule object.
     * @returns void
     */
    receptorAdded(mol: any): void {
        // Make the atoms of the protein clickable if it is receptor.
        if (this["type"] === "receptor") {
            this.makeAtomsLabelledClickable(mol, "receptor", false);
        }

        this.showSurfaceAsAppropriate();
        this.showSticksAsAppropriate();
    },

    /**
     * Renders 3Dmol.js viewer if receptorMol and ligandMol, when defined,
     * contain atoms. Designed to prevent an error.
     * @returns void
     */
    render3Dmol(): void {
        // let tt = this;
        for (let k of ["receptorMol", "ligandMol"]) {
            let atoms = this[k]?.selectedAtoms({});
            if (atoms !== undefined) {
                if (atoms.length == 0) {
                    // To prevent an error in some situations. For example,
                    // poorly formatted input file.
                    this.$store.commit("openModal", {
                        title: "Error Loading File!",
                        body: `<p>Could not load file <code>${this.$store.state[k.replace(/Mol/g, "FileName")]}</code>. Are you certain this file is properly formatted?</p>`
                    });

                    return;
                } else {
                    // Check to make sure resn. You'll get errors otherwise. Check
                    // just first atom to be speedy (assume all missing resn if
                    // first one is).
                    if (atoms[0].resn === undefined) {
                        const atomsLen = atoms.length;
                        for (let i = 0; i < atomsLen; i++) {
                            const atom = atoms[i];
                            atom["resn"] = "";
                        }
                    }
                }
            }
            // let tt = this[k];
            // debugger;
        }

        this["viewer"]["render"]();
    },

    /**
     * Runs when a ligand has been added.
     * @param  {*} mol  The 3dmol.js molecule object.
     * @returns void
     */
    ligandAdded(mol): void {
        mol.setStyle({}, {
            "stick": { "radius": 0.4 },
            "sphere": { "scale": 0.3 }
        });

        this.render3Dmol();

        this.makeAtomsLabelledClickable(mol, "ligand", true);
    },

    /**
     * Runs after an atom has been clicked.
     * @param  {*}       atom     The atom that was clicked.
     * @param  {*}       mol      The 3dmol.js molecule.
     * @param  {string}  typeStr  "ligand" or "receptor".
     * @returns void
     */
    clickAtom(atom: any, mol: any, typeStr: string): void {
        if (this.$store.state["selectedAtomClickAction"] === "delete") {
            mol["removeAtoms"]([atom]);

            // Also construct PDB from 3dmol object for passing to
            // deepfrag when the time comes. Doing it this way so
            // 3dmoljs can do the file-format conversion.
            this.$store.commit("setVar", {
                name: typeStr + "PdbTxtFrom3DMol",
                val: mol3DToPDB(this[typeStr + "Mol"])
            });
        } else if (atom.elem !== "H") {
            // Save location of click if not hydrogen atom.
            this.$store.commit("setDeepFragParam", {
                name: "center_x",
                val: atom["x"]
            });
            this.$store.commit("setDeepFragParam", {
                name: "center_y",
                val: atom["y"]
            });
            this.$store.commit("setDeepFragParam", {
                name: "center_z",
                val: atom["z"]
            });

            this.$store.commit("setValidationParam", {
                name: "center_x",
                val: true
            });
            this.$store.commit("setValidationParam", {
                name: "center_y",
                val: true
            });
            this.$store.commit("setValidationParam", {
                name: "center_z",
                val: true
            });
        }

        this.render3Dmol();
    },

    /**
     * Gets the width of the window. Used to detect if mobile-sized browser.
     * @returns number  The width in pixels.
     */
    windowWidth(): number {
        // See
        // https://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
        return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    },

    /**
     * Makes the atoms of a 3dmol.js molecule clicable.
     * @param  {*}       mol            The 3dmol.js molecule.
     * @param  {string}  typeStr        "ligand" or "receptor".
     * @param  {bool}    makeClickable  If true, make atoms clickable too.
     * @returns void
     */
    makeAtomsLabelledClickable(mol: any, typeStr: string, makeClickable = false): void {
        if (!this["hoverableClickable"]) {
            return;
        }

        if (makeClickable) {
            mol.setClickable({}, true, (atom) => {
                this.clickAtom(atom, mol, typeStr);
            });
        }

        // Also make labels.
        var atoms = mol.selectedAtoms({});
        let len = atoms.length;
        if (len > 0) {
            this["viewer"]["setHoverable"]({}, true, (atom: any) => {
                let lbl = (atom["resn"] !== undefined) ? atom["resn"].trim() : "";
                lbl += (atom["resi"] !== undefined) ? atom["resi"].toString() : "";
                lbl += (atom["atom"] !== undefined) ? ":" + atom["atom"].trim() : "";
                atom["chain"] = (atom["chain"] !== undefined) ? atom["chain"].trim() : "";
                if (atom["chain"] !== "") {
                    lbl += ":" + atom["chain"];
                }
                this["viewer"]["addLabel"](lbl, {"position": atom, "backgroundOpacity": 0.8});

                if (
                    (this["ligandMol"] !== undefined) &&
                    (atom["model"] === this["ligandMol"]["getID"]()) &&
                    (this.windowWidth() < 695)
                ) {
                    // On mobile, treat hover like click. Makes it easier.
                    this.clickAtom(atom, mol, typeStr);
                }
            }, (atom: any) => {
                this["viewer"]["removeAllLabels"]();
            })
        }
    },

    /**
     * Sets the highlight sphere (to mark growing point).
     * @param  {number} x  The x coordinate of the point.
     * @param  {number} y  The y coordinate of the point.
     * @param  {number} z  The z coordinate of the point.
     * @returns void
     */
    setHighlightSphere(x: number, y: number, z: number): void {
        // Remove the sphere if it already exists.
        if (this.highlightAtomSphere !== undefined) {
            this["viewer"]["removeShape"](this.highlightAtomSphere);
        }

        this.highlightAtomSphere = this["viewer"]["addSphere"]({
            "center": {"x": x, "y": y, "z": z},
            "radius": 1.0,
            "color": "yellow",
            "opacity": 0.8
        });

        this.render3Dmol();
    },

    /**
     * Show a molecular surface representation if it is appropriate
     * given user settings.
     * @returns void
     */
    showSurfaceAsAppropriate(): void {
        // If no protein has been loaded, no need to proceed.
        if (this["receptorMol"] === undefined) {
            return;
        }

        if (this["renderProteinSurface"] === true) {
            // You're supposed to render the surface. What if it
            // doesn't exist yet?
            if (this["surfaceObj"] === undefined) {
                this["viewer"]["removeAllSurfaces"]();
                this["surfaceObj"] = this["viewer"]["addSurface"](
                    $3Dmol.SurfaceType.MS, {
                        "color": 'white',
                        "opacity": 0.85
                    },
                    {
                        "model": this["receptorMol"]
                    }
                );
            }

            // Now it exists for sure. Make sure it is visible.
            this["viewer"]["setSurfaceMaterialStyle"](
                this["surfaceObj"]["surfid"],
                {
                    "color": 'white',
                    "opacity": 0.85
                }
            )
            this.render3Dmol();
        } else {
            // So you need to hide the surface, if it exists.
            if (this["surfaceObj"] !== undefined) {
                this["viewer"]["setSurfaceMaterialStyle"](
                    this["surfaceObj"]["surfid"],
                    { "opacity": 0 }
                );
                this.render3Dmol();
            }
        }
    },

    /**
     * Show a sticks representation if it is appropriate given user
     * settings.
     * @returns void
     */
    showSticksAsAppropriate(): void {
        // If no protein has been loaded, no need to proceed.
        if (this["receptorMol"] === undefined) {
            return;
        }

        if (this["renderProteinSticks"] === true) {
            // Set up the style.
            this["receptorMol"].setStyle(
                {},
                {
                    "stick": { "radius": 0.1 },  // 0.15
                    "cartoon": { "color": 'spectrum' },
                }
            );
            this.render3Dmol();

        } else {
            // Set up the style.
            this["receptorMol"].setStyle({}, {});  // This is better. Clear first.
            this.render3Dmol();
            this["receptorMol"].setStyle(
                {},
                { "cartoon": { "color": 'spectrum' } }
            );
            this.render3Dmol();
        }
    },

    /**
     * Toggles the surface representation on and off.
     * @returns void
     */
    "toggleSurface"(): void {
        this["renderProteinSurface"] = !this["renderProteinSurface"];
        this.showSurfaceAsAppropriate();
    },

    /**
     * Toggles the sricks representation on and off.
     * @returns void
     */
    "toggleSticks"(): void {
        this["renderProteinSticks"] = !this["renderProteinSticks"];
        this.showSticksAsAppropriate();
    },
}

/** An object containing the vue-component watch functions. */
let watchFunctions = {
    /**
     * Watch when the receptorContents computed property.
     * @param  {string} newReceptorContents  The new value of the property.
     * @returns void
     */
    "receptorContents": function (newReceptorContents: string): void {
        // The purpose of this is to react when new receptorContents are
        // added.

        let duration: number = (newReceptorContents === "") ? 0 : 500;
        this.modelAdded(duration);
    },

    /**
     * Watch the ligandContents computed property.
     * @param  {string} newLigandContents  The new value of the property.
     * @returns void
     */
    "ligandContents": function (newLigandContents: string): void {
        // The purpose of this is to react when new ligandContents are added.
        let duration: number = (newLigandContents === "") ? 0 : 500;
        this.modelAdded(duration);
    },

    /**
     * Watch the yellowSphereCoords computed property.
     * @param  {*} newYellowSphereCoords  The new value of the property.
     * @returns void
     */
    "yellowSphereCoords": function(newYellowSphereCoords: any): void {
        if (newYellowSphereCoords[0] !== undefined) {
            this.setHighlightSphere(
                newYellowSphereCoords[0],
                newYellowSphereCoords[1],
                newYellowSphereCoords[2]
            );
        }
    }
}

/**
 * The vue-component mounted function.
 * @returns void
 */
function mountedFunction(): void {
    this["renderProteinSurface"] = this["proteinSurface"];
}

/**
 * Setup the threedmol Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('threedmol', {
        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data"() {
            return {
                "viewer": undefined,
                "surfaceObj": undefined,
                "receptorMol": undefined,
                "ligandMol": undefined,
                "receptorPdbOfLoaded": "",  // To prevent from loading twice.
                "ligandPdbOfLoaded": "",  // To prevent from loading twice.
                "renderProteinSurface": undefined,
                "renderProteinSticks": true,
                highlightAtomSphere: undefined,
            }
        },
        "computed": computedFunctions,
        "template": `
            <div class="container-3dmol" style="display:grid;">
                <div
                    :id="id + '-' + type + '-3dmol'"
                    style="height: 500px; width: 100%; position: relative;">

                    <b-card
                        class="text-center"
                        style="width: 100%; height: 100%;"
                        title="Missing Receptor and/or Ligand"
                    >
                        <b-card-text v-if="autoLoad">
                            Loading...
                        </b-card-text>
                        <b-card-text v-else>
                            Use the file inputs above to select the receptor and
                            ligand PDBQT files.
                        </b-card-text>
                    </b-card>
                </div>
                <div v-if="type!=='ligand'" style="margin-top:-34px; padding-right:9px;" class="mr-1">
                    <form-button :variant="surfBtnVariant" @click.native="toggleSurface" :small="true">Surface</form-button>
                    <form-button :variant="allAtmBtnVariant" @click.native="toggleSticks" :small="true">All Atoms</form-button>
                </div>
            </div>`,
        "watch": watchFunctions,
        "props": {
            "type": String, // receptor or ligand. Used only to
                            // determine if it's been loaded yet.
            "proteinSurface": {
                "type": Boolean,
                "default": false
            },
            "autoLoad": {
                "type": Boolean,
                "default": false
            },
            "id": {
                "type": String,
                "default": "id"
            },
            "hoverableClickable": {
                "type": Boolean,
                "default": true
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

/**
 * Justifies text. Useful for constructing the PDB string.
 * @param  {string}  str           The string to justify.
 * @param  {number}  cols          The number of columns.
 * @param  {boolean} [right=true]  Whether to right justify (vs. left).
 * @param  {string}  [deflt="X"]   The default value if str is undefined.
 * @returns string  The justified string.
 */
function justify(str: string, cols: number, right = true, deflt = "X"): string {
    if (str === undefined) {
        str = deflt;
    }

    if (str.length > cols) {
        // String is too long. Trim it.
        if (right) {
            return str.slice(str.length - cols);
        } else {
            return str.slice(0, cols);
        }
    } else {
        // String is not too long. Pad it.
        let padNum = cols - str.length;
        for (let i = 0; i < padNum; i++) {
            if (right) {
                str = " " + str;
            } else {
                str = str + " ";
            }
        }
        return str;
    }
}

/**
 * Given a 3Dmol.js molecule, create a PDB-formatted string.
 * @param  {*} mol  The 3Dmol.js molecule.
 * @returns string  The PDB-formatted string.
 */
function mol3DToPDB(mol: any): string {
    let atoms: any[] = mol.selectedAtoms({});
    const atomsLen = atoms.length;
    let pdbTxt = "";
    for (let i = 0; i < atomsLen; i++) {
        const atom = atoms[i];
        if (atom["pdbline"] !== undefined) {
            // pdbline already exists, so just use that.
            pdbTxt += atom["pdbline"] + "\n";
        } else {
            // You will need to reconstruct the pdb line.
            let hetFlag = atom["hetflag"] ? "ATOM  " : "HETATM";
            let idx = justify((i + 1).toString(), 5, true);  // right

            let atomName = justify(atom["atom"], 5, true, "X");  // left. note not exactly correct, but works for deepfrag.

            let resName = justify(atom["resn"], 4, true, "XXX");  // right
            let chain = justify(atom["chain"], 2, true, "X");  // right
            let resnum = justify(atom["resi"], 4, true, "1");  // right

            let x = justify(atom["x"].toFixed(3), 11, true, "0.000");
            let y = justify(atom["y"].toFixed(3), 8, true, "0.000");
            let z = justify(atom["z"].toFixed(3), 8, true, "0.000");

            let elem = justify(atom["elem"], 2, true, "X");

            pdbTxt += hetFlag + idx + atomName + resName + chain + resnum + " " + x + y + z + "  1.00  0.00          " + elem + "\n";
        }

    }

    return pdbTxt;
}
