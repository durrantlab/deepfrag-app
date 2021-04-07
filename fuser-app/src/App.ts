// The Fuser web app adds a molecular fragment to a parent molecule. Copyright
// (C) 2021, Jacob Durrant.

// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation; either version 2 of the License, or (at your option)
// any later version.

// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
// more details.

// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc., 51
// Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.


declare var saveAs;
declare var requirejs;
declare var LZString;

var varNames = [
    "pdb",
    "smi",
    "x",
    "y",
    "z"
];

let btnHTML = {};

/**
 * Changes the state of a button (disables or enables).
 * @param  {string}  id          The ID of the button (DOM).
 * @param  {boolean} [val=true]  Whether to disable (true) or enable (false).
 * @returns Promise  A promise that resolves when half a second has passed.
 */
function waitButton(id: string, val: boolean = true): Promise<any> {
    let btn = jQuery("#" + id);

    if (val) {
        btnHTML[id] = btn.html();
        btn.html("Processing...");
        btn.prop("disabled", true);
    } else {
        btn.html(btnHTML[id]);
        btn.prop("disabled", false);
    }

    return new Promise((resolve, reject) => {
        setInterval(() => {
            resolve(undefined);
        }, 500);
    });
}

/**
 * A wrapper arounf the FileSaver.saveAs function. Uses requirejs to load the
 * module if needed.
 * @param  {*}      blob      The blob to save (download).
 * @param  {string} filename  The filename.
 * @returns Promise  A promise that resolves when the module is loaded and the
 *                   file has been saved.
 */
function saveAsWrapper(blob: any, filename: string): Promise<any> {
    // See https://stackoverflow.com/questions/27298813/filesaver-and-requirejs-mismatched-anonymous-define
    return new Promise((resolve, reject) => {
        requirejs(["../external/FileSaver.min"], function() {
            saveAs(blob, filename);
        });
    });
}

/**
 * Gets the values of the form elements and puts them in an object.
 * @returns * The object with the values.
 */
function getVarVals(): any {
    let vals = {};
    const varNamesLen = varNames.length;
    for (let i = 0; i < varNamesLen; i++) {
        const varName = varNames[i];
        vals[varName] = $("#" + varName).val();
    }
    return vals;
}

/**
 * Runs if there is an error from openbabel.js when generating 3D molecules..
 * @returns void
 */
function on3DError(): void {
    alert("Unable to create molecule! If you checked \"Optimize atomic coordinates\", try unchecking it. If you still get an error, generate a SMILES string instead of an SDF or PDB file. Your molecule is likely too large or complex to generate 3D atomic coordinates in the browser.")
    waitButton("downloadPDBBtn", false);
}

/**
 * Runs if there is an error from openbabel.js when generating a SMI file..
 * @returns void
 */
function onSMIError(): void {
    alert("Unable to create molecule! Your molecule is likely too large or complex to \"fuse\" in the browser, or perhaps your browser does not support WebAssembly.")
    waitButton("downloadPDBBtn", false);
}

$("#downloadSMILESBtn").on(
    "click",

    /**
     * Creates and downloads a fused compound in the SMILES format.
     * @returns void
     */
    function (): void {
        let Fuser;
        waitButton("downloadSMILESBtn", true).then(() => {
            return import("./Fuser");
        }).then((fuser) => {
            Fuser = fuser;
            return Promise.resolve(Fuser.loadOB());
        }).then(() => {
            let vals = getVarVals();
            let pdb = vals["pdb"];
            return Fuser.makeSMILES(
                pdb, vals["smi"],
                [parseInt(vals["x"]), parseInt(vals["y"]), parseInt(vals["z"])]
            );
        }).then((smi) => {
            var blob = new Blob([smi + '\n'], {type: "text/plain;charset=utf-8"});
            saveAsWrapper(blob, "fused.smi");
            waitButton("downloadSMILESBtn", false);
        }).catch((e) => {
            onSMIError();
        });
    }
);

$("#downloadSDFBtn").on(
    "click",

    /**
     * Creates and downloads a fused compound in the SDF format.
     * @returns void
     */
     function (): void {
        let Fuser;
        let extraOptim = $("#extraOptimization").prop("checked");
        waitButton("downloadSDFBtn", true).then(() => {
            return import("./Fuser");
        }).then((fuser) => {
            Fuser = fuser;
            return Fuser.loadOB();
        }).then(() => {
            let vals = getVarVals();
            let pdb = vals["pdb"];
            let center = [parseInt(vals["x"]), parseInt(vals["y"]), parseInt(vals["z"])];
            return Fuser.make3D(pdb, vals["smi"], center, 'sdf', extraOptim);
        }).then((sdf) => {
            var blob = new Blob([sdf + '\n'], {type: "text/plain;charset=utf-8"});
            saveAsWrapper(blob, "fused.sdf");
            waitButton("downloadSDFBtn", false);
        }).catch((e) => {
            on3DError();
        });
    }
)

$("#downloadPDBBtn").on(
    "click",

    /**
     * Creates and downloads a fused compound in the PDB format.
     * @returns void
     */
    function (): void {
        let Fuser;
        let extraOptim = $("#extraOptimization").prop("checked");
        waitButton("downloadPDBBtn", true).then(() => {
            return import("./Fuser");
        }).then((fuser) => {
            Fuser = fuser;
            return Fuser.loadOB();
        }).then(() => {
            let vals = getVarVals();
            let pdb = vals["pdb"];
            let center = [parseInt(vals["x"]), parseInt(vals["y"]), parseInt(vals["z"])];
            return Fuser.make3D(pdb, vals["smi"], center, 'pdb', extraOptim);
        }).then((pdb) => {
            var blob = new Blob([pdb + '\n'], {type: "text/plain;charset=utf-8"});
            saveAsWrapper(blob, "fused.pdb");
            waitButton("downloadPDBBtn", false);
        }).catch((e) => {
            on3DError();
        });
    }
)

$("#expand").on(
    "click",

    /**
     * Shows any form elements that are currently hidden.
     * @returns void
     */
    function(): void {
        const varNamesLen = varNames.length;
        for (let i = 0; i < varNamesLen; i++) {
            const varName = varNames[i];
            jQuery("#" + varName + "-row").slideDown();
        }
        $(".hide-on-expand").hide();
    }
);

/**
 * Sets up the Fuser app. The "main" function.
 * @returns void
 */
function setupApp(): void {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    // e.g.,
    // http://0.0.0.0:8000/?pdb=IIFQ8gsgBDsIyygYSgDXW+iYBYcDoAGOHKAWjgCZ9LKBmGOAVnxzgHZGjCZDvsBSAFChIAyohTpUmRgLz52TCRTr44hBlDgA2GpQCcXQjyh8TA7MNHRsWmFIwy52BYR0MKBOHCPa9BpSc2vxmoZYOIuC2iKSwjjLO2vLUOjoqJDR0AByMetn0xqbmphHIUWLYTJJoTliucPiBuar4dDoI-kRwWo0WYf1l1tECOjXSssmuqZrkVG3KjCx0hHF9xeERw5WIwQ61ifWxjewGpBSNdOzBmTjERbybltsxsLmwAHIHk53H6oUUaiUPCMNR0Aw3UIlMowD4VV4wPz7CZJX6wHDUQhMTw9IgdRjUJg4PzrR6DLbw7AacZ1FyxahXc7zWidHw0bLvUkDUoUmxUtFgb6olI0QJzPgGbLVbSNILSrnQmFgSmIKiIQUoo7o1LpObUbLsXp8Hq9KFPATKvmq+zIIVamDgxQGIyAtpsUFtYEPbkw8pW+BxGAa2lTRCOrEIC6KanaAhYtZm8mWS0jVXS5EhtEOgw0HRMtQ4dichkgkL9RVDFXwMafO102COuiUSOZU6meY6dgJ8vm7Bw-2MPa2zX1h3ZRTYuZg7K9Pp570V3mp+DvWF10MN8c4TtzAg6foafDpSE9pMCfvLxhI4eZgQ5fDZakUFg4bJrRodEmJnnPKswSg8gkPx3uO7CUNUFD5I+jCNEwBoLr2kh-lAzY0oco5QPeb4ZOw+BEvKfB0EwNYKoh8TIbQaHAXYoEQnM44GE2jCEYQX6nj+ggUTaQHCjRR5MBBvjRu+rBdghZ5WBRgY3uhG5jnhHhzDmhBeto1DsKx4kcZJA4oemMnUWG477pwFC4XmEhqYo2Ttt+vrCEAA&smi=*C(%3DO)O&x=38.753&y=-13.383&z=11.064

    let params = {};

    let showIfPrepopulated = jQuery(".show-if-prepopulated");

    const namesLen = varNames.length;
    for (let i = 0; i < namesLen; i++) {
        const name = varNames[i];
        params[name] = urlParams.get(name);
        if (params[name] !== null) {
            if (name === "pdb") {
                params[name] = LZString.decompressFromEncodedURIComponent(params[name]);
            }
            jQuery("#" + name).val(params[name]);
            showIfPrepopulated.show();
        } else {
            // Not pre-populated from URL, so show it.
            jQuery("#" + name + "-row").show();
        }
    }
}

setupApp();
