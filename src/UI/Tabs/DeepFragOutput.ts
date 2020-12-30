// This file is part of DeepFrag, released under the Apache 2.0 License. See
// LICENSE.md or go to https://opensource.org/licenses/Apache-2.0 for full
// details. Copyright 2020 Jacob D. Durrant.


declare var Vue;
declare var FileSaver;

/** An object containing the vue-component computed functions. */
let computedFunctions = {
    /**
     * Get's DeepFrag's CSV output.
     * @returns string  The CSV output.
     */
    "scoresCSV"(): string {
        return this.$store.state["scoresCSV"];
    },

    /**
     * Get the receptor PDB contents.
     * @returns string  The file contents.
     */
    "receptorPdbTxtFrom3DMol"(): string {
        return this.$store.state["receptorPdbTxtFrom3DMol"];
    },

    /**
     * Get the ligand PDB contents.
     * @returns string  The file contents.
     */
    "ligandPdbTxtFrom3DMol"(): string {
        return this.$store.state["ligandPdbTxtFrom3DMol"];
    },

    /**
     * Get the growing-point JSON.
     * @returns string  The file contents.
     */
    "growingPointJSON"(): string {
        return JSON.stringify(
            this.$store.state["growingPointJSON"]
        );
    },

    /**
     * Get the execution time.
     * @returns string  The time.
     */
    "time"(): string {
        return this.$store.state["time"].toString();
    }
}

/** An object containing the vue-component methods functions. */
let methodsFunctions = {
    /**
     * Runs when the user clicks the scoresCSV download button.
     * @returns void
     */
    "scoresCSVDownload"(): void {
        var blob = new Blob([this["scoresCSV"]], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(blob, "deepfrag-scores.csv");
    },

    /**
     * Runs when the user clicks the growingPointJSONDownload download button.
     * @returns void
     */
    "growingPointJSONDownload"(): void {
        var blob = new Blob(
            [this["growingPointJSON"]],
            {type: "text/plain;charset=utf-8"}
        );
        FileSaver.saveAs(blob, "growing-point.json");
    },

    /**
     * Runs when the user clicks the download receptor PDB button.
     * @returns void
     */
    "receptorPDBDownload"(): void {
        var blob = new Blob([this["receptorPdbTxtFrom3DMol"]], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(
            blob,
            (
                this.$store.state["receptorFileName"] + ".pdb"
            ).replace(".pdb.pdb", ".pdb")
        );
    },

    /**
     * Runs when the user clicks the download ligand PDB button.
     * @returns void
     */
    "ligandPDBDownload"(): void {
        var blob = new Blob([this["ligandPdbTxtFrom3DMol"]], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(
            blob,
            (
                this.$store.state["ligandFileName"] + ".pdb"
            ).replace(".pdb.pdb", ".pdb")
        );
    }
}

/**
 * Setup the vina-output Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component('vina-output', {
        "template": `
            <div>
                <sub-section title="Visualization">
                    <form-group
                        label=""
                        id="input-group-receptor-3dmol"
                        description=""
                    >
                        <threedmol
                            id="secondary-viewer"
                            :hoverableClickable="false"
                            :autoLoad="true"
                            :yellowSphere="[$store.state.deepFragParams.center_x, $store.state.deepFragParams.center_y, $store.state.deepFragParams.center_z]"
                            type="receptor"></threedmol>
                    </form-group>
                    <results-table></results-table>
                    <p class="text-center mb-0">Execution time: {{time}} seconds</p>
                </sub-section>

                <sub-section title="Output Files">
                    <form-group v-if="scoresCSV !== ''"
                        label="DeepFrag Fragments, Ranked"
                        id="input-group-ranked-frags"
                        description="The suggested fragments, ordered by score."
                        :labelToLeft="false"
                    >
                        <b-form-textarea
                            readonly
                            id="textarea"
                            v-model="scoresCSV"
                            placeholder="CSV File"
                            rows="3"
                            max-rows="6"
                            style="white-space: pre;"
                            class="text-monospace"
                            size="sm"
                        ></b-form-textarea>
                        <form-button :small="true" @click.native="scoresCSVDownload">Download</form-button>
                    </form-group>

                    <form-group
                        label="Growing Point JSON File"
                        id="input-group-point-json"
                        description="The JSON-formatted 3D coordinate of the growing point."
                        :labelToLeft="false"
                    >
                        <b-form-textarea
                            readonly
                            id="textarea"
                            v-model="growingPointJSON"
                            placeholder="Growing point JSON"
                            rows="3"
                            max-rows="6"
                            style="white-space: pre;"
                            class="text-monospace"
                            size="sm"
                        ></b-form-textarea>
                        <form-button :small="true" @click.native="growingPointJSONDownload">Download</form-button>
                    </form-group>

                    <form-group
                        label="Receptor PDB File"
                        id="input-group-receptor-pdb"
                        description="The PDB-formatted receptor file used for grid generation."
                        :labelToLeft="false"
                    >
                        <b-form-textarea
                            readonly
                            id="textarea"
                            v-model="receptorPdbTxtFrom3DMol"
                            placeholder="Receptor PDB"
                            rows="3"
                            max-rows="6"
                            style="white-space: pre;"
                            class="text-monospace"
                            size="sm"
                        ></b-form-textarea>
                        <form-button :small="true" @click.native="receptorPDBDownload">Download</form-button>
                    </form-group>

                    <form-group
                        label="Ligand PDB File"
                        id="input-group-ligand-pdb"
                        description="The PDB-formatted ligand file used for grid generation."
                        :labelToLeft="false"
                    >
                        <b-form-textarea
                            readonly
                            id="textarea"
                            v-model="ligandPdbTxtFrom3DMol"
                            placeholder="Ligand PDB"
                            rows="3"
                            max-rows="6"
                            style="white-space: pre;"
                            class="text-monospace"
                            size="sm"
                        ></b-form-textarea>
                        <form-button :small="true" @click.native="ligandPDBDownload">Download</form-button>
                    </form-group>
                </sub-section>

                <sub-section title="Caveats">
                    <p>
                        DeepFrag was trained on data from the
                        <a href="http://www.pdbbind.org.cn/" target="_blank">PDBbind
                        database</a>. Accuracy may be artefactually high when
                        running DeepFrag on one of the proteins catalogued in that
                        database.
                    </p>
                </sub-section>
            </div>
        `,
        "props": {},
        "computed": computedFunctions,

        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data"() {
            return {}
        },

        "methods": methodsFunctions
    })
}
