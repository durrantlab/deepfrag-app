// This file is part of DeepFrag, released under the Apache 2.0 License. See
// LICENSE.md or go to https://opensource.org/licenses/Apache-2.0 for full
// details. Copyright 2020 Jacob D. Durrant.

declare var Vue;

/** An object containing the vue-component computed functions. */
let computedFunctions = {
    /** Gets and sets the file. On setting, also checks for a valid extension
     * and opens the convert modal if necessary. */
    "val": {
        get(): any {
            return this["file"];
        },

        set(val: any): void {
            if (val === null) {
                // Reseting the value. Nothing to do here.
                return;
            }

            this["file"] = val;
            this.$store.commit("setValidationParam", {
                name: this["id"],
                val: true,
            });

            this.$store.commit("updateFileName", {
                type: this["id"],
                filename: val.name,
            });

            this.getModelFileContents(this["file"]).then((text: string) => {
                this.$store.commit("setVar", {
                    name: this["id"] + "Contents",
                    val: text,
                });
            });
        },
    },

    "placeholderToUse"(): string {
        let possibleName = this.$store.state[this["id"] + "FileName"];
        if (possibleName !== "") {
            this["file"] = true;
            return possibleName;
        }

        return this["placeholder"];
    },

    /**
     * Determine whether the component value is valid.
     * @returns boolean  True if it is valid, false otherwise.
     */
    "isValid"(): boolean {
        if (this["file"] !== false && this["file"] !== null) {
            return true;
        } else if (this.$store.state[this["id"] + "ForceValidate"] === true) {
            // This runs when you convert from a non-pdbqt file converted to
            // pdbqt.
            let flnm = this.$store.state[this["id"] + "FileName"];
            this["file"] = new File([], flnm);
            this["placeholder"] = flnm;
            return true;
        }
        return false;
    },
};

/** An object containing the vue-component methods functions. */
let methodsFunctions = {
    /**
     * Given a file object, returns a promise that resolves the text
     * in that file.
     * @param  {*} fileObj  The file object.
     * @returns Promise
     */
    getModelFileContents(fileObj): Promise<any> {
        return new Promise((resolve, reject) => {
            var fr = new FileReader();
            fr.onload = () => {
                // @ts-ignore: Not sure why this causes Typescript problems.
                var data = new Uint8Array(fr.result);
                resolve(new TextDecoder("utf-8").decode(data));
            };
            fr.readAsArrayBuffer(fileObj);

            // Reset the show non-protein atom's link.
            if (this["id"] === "receptor") {
                this.$store.commit("setVar", {
                    name: "showKeepProteinOnlyLink",
                    val: true,
                });
            }
        });
    },
};

/**
 * The vue-component mounted function.
 * @returns void
 */
function mountedFunction(): void {
    // Make default validation entry.
    if (this.$store.state["validation"][this["id"]] === undefined) {
        this.$store.commit("setValidationParam", {
            name: this["id"],
            val: false,
        });
    }

    // If it's not required, automatically validate.
    if (this["required"] === false) {
        this.$store.commit("setValidationParam", {
            name: this["id"],
            val: true,
        });

        jQuery("." + this["id"])
            .find("input")
            .removeClass("is-invalid");
    }
}

/**
 * Setup the file-input Vue commponent.
 * @returns void
 */
export function setup(): void {
    Vue.component("file-input", {
        /**
         * Get the data associated with this component.
         * @returns any  The data.
         */
        "data"(): any {
            return {
                file: false,
                placeholder: "Choose a file or drop it here...",
            };
        },
        "methods": methodsFunctions,
        "template": `
            <form-group
                :label="label"
                :id="'input-group-' + id"
                :description="description"
                styl="line-height:0;"
            >
                <template v-slot:extraDescription>
                    <slot name="extraDescription"></slot>
                </template>
                <b-form-file
                    v-model="val"
                    :state="Boolean(file)"
                    :placeholder="placeholderToUse"
                    drop-placeholder="Drop file here..."
                    :class="id" :accept="accept"
                    :required="required"
                ></b-form-file>
                <small v-if="(!isValid) && (required === true)" alert tabindex="-1" class="text-danger form-text">{{invalidMsg}}</small>
            </form-group>
        `,
        "props": {
            "label": String,
            "id": String,
            "description": String,
            "invalidMsg": {
                "type": String,
                "default": "This field is required!",
            },
            "required": {
                "type": Boolean,
                "default": true,
            },
            "accept": {
                "type": String,
                "default": ".pdb,.sdf,.xyz,.pqr,.mol2",
            }
        },
        "computed": computedFunctions,

        /**
         * Runs when the vue component is mounted.
         * @returns void
         */
        "mounted": mountedFunction,
    });
}
