// The Fuser web app adds a molecular fragment to a parent molecule. Copyright
// (C) 2021, Jacob Durrant.
define("Fuser", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.make3D = exports.makeSMILES = exports.loadOB = void 0;
    // Loaded via script tag.
    var OB;
    /**
     * Waits for open babel to load.
     * @returns Promise  The promise returned when it is ready.
     */
    function loadOB() {
        var _this = this;
        if (OB !== undefined) {
            // Already loaded.
            return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
            OB = OpenBabelModule();
            window['OB'] = OB;
            var checkReady = function () {
                if (OB.ObConversionWrapper) {
                    resolve(undefined);
                }
                else {
                    setTimeout(checkReady.bind(_this), 500);
                }
            };
            checkReady();
        });
    }
    exports.loadOB = loadOB;
    /**
     * Merge a frag OBMol into a parent OBMol. The parent OBMol is updated in-place.
     * @param parent     Parent OBMol that will be updated.
     * @param frag       Fragment OBMol.
     * @param parentIdx  Index of the connection point atom in the parent.
     * @param fragIdx    Index of the fragment fake atom "*".
     */
    function fuseMol(parent, frag, parentIdx, fragIdx) {
        // other idx -> base idx
        var atom_map = {};
        // Add all atoms.
        for (var i = 1; i < frag.NumAtoms() + 1; ++i) {
            if (i == fragIdx)
                continue;
            var atom = parent.NewAtom();
            var other_atom = frag.GetAtom(i);
            atom.SetAtomicNum(other_atom.GetAtomicNum());
            atom_map[other_atom.GetIndex() + 1] = atom.GetIndex() + 1;
        }
        // Add all bonds.
        for (var i = 0; i < frag.NumBonds(); ++i) {
            var bond = frag.GetBond(i);
            var begin = bond.GetBeginAtomIdx();
            var end = bond.GetEndAtomIdx();
            var order = bond.GetBondOrder();
            if (begin == fragIdx) {
                // parent<->end
                parent.AddBondWithParam(parentIdx, atom_map[end], order, 0, -1);
            }
            else if (end == fragIdx) {
                // parent<->begin
                parent.AddBondWithParam(parentIdx, atom_map[begin], order, 0, -1);
            }
            else {
                // begin<->end
                parent.AddBondWithParam(atom_map[begin], atom_map[end], order, 0, -1);
            }
        }
        // Decrement implicit hydrogen count on parent connection atom.
        //
        // For certain nonsensical inputs this isn't possible because the implicit
        // hydrogen count is already zero. For example: trying to fuse a fragment
        // to the oxygen in a ketone.
        var conn = parent.GetAtom(parentIdx);
        var currHCount = conn.GetImplicitHCount();
        if (currHCount >= 1) {
            conn.SetImplicitHCount(currHCount - 1);
        }
    }
    /**
     * Load and fuse a parent/ligand combination.
     * @param  {string} ligandPDB           The ligand PDB string.
     * @param  {string} smi      SMILES string of the fragment.
     * @param  {Array<number>} center       The location of the growing point.
     * @param  {boolean} optimizeFragGeometry  Whether to optimize the fragment geometry.
     * Returns an OBMol with a fused "full ligand."
     */
    function loadFused(ligandPDB, smi, center, optimizeFragGeometry) {
        if (optimizeFragGeometry === void 0) { optimizeFragGeometry = false; }
        return new Promise(function (resolve, reject) {
            // Load ligand and fragment as OBMol's.
            var conv = new OB.ObConversionWrapper();
            var frag = new OB.OBMol();
            var parent = new OB.OBMol();
            conv.setInFormat('', 'smi');
            conv.readString(frag, smi);
            conv.setInFormat('', 'pdb');
            conv.readString(parent, ligandPDB);
            // Search for the connection point atom.
            var parent_atom_idx = -1;
            var atom_dist = -1;
            for (var i = 1; i < parent.NumAtoms() + 1; ++i) { // OBMol atoms are 1-indexed
                var atom = parent.GetAtom(i);
                var dx = (atom.GetX() - center[0]);
                var dy = (atom.GetY() - center[1]);
                var dz = (atom.GetZ() - center[2]);
                var dist2 = (dx * dx) + (dy * dy) + (dz * dz);
                if (parent_atom_idx == -1 || dist2 < atom_dist) {
                    parent_atom_idx = i;
                    atom_dist = dist2;
                }
            }
            // Find the fragment connection atom.
            var frag_atom_idx = -1;
            for (var i = 1; i < frag.NumAtoms() + 1; ++i) {
                if (frag.GetAtom(i).GetAtomicNum() == 0) {
                    frag_atom_idx = i;
                    break;
                }
            }
            // Add hydrogen atoms to fragment.
            frag.AddHydrogensWithParam(false, true, 7.4);
            // Attach the fragment to the parent.
            fuseMol(parent, frag, parent_atom_idx, frag_atom_idx);
            resolve(parent);
        });
    }
    /**
     * Generate a 2D embedding of a ligandPDB and fragment as a SMILES string
     * @param  {string} ligandPDB           The ligand PDB string.
     * @param  {string} smi      SMILES string of the fragment.
     * @param  {Array<number>} center       The location of the growing point.
     * @returns Promise  A promise that resolves with a SMILES string of the full ligand..
     */
    function makeSMILES(ligandPDB, smi, center) {
        return loadFused(ligandPDB, smi, center, false).then(function (mol) {
            var conv = new OB.ObConversionWrapper();
            conv.setOutFormat('', 'smi');
            return conv.writeString(mol, true);
        });
    }
    exports.makeSMILES = makeSMILES;
    /**
     * Generate a 3D embedding of a ligandPDB and fragment.
     * @param  {string} ligandPDB           The ligand PDB string.
     * @param  {string} smi                 SMILES string of the fragment.
     * @param  {Array<number>} center       The location of the growing point.
     * @param  {string}  format             The output file format (e.g. "sdf",
     *                                      "pdb", ...)
     * @param  {boolean} extraOptimization  Whethr to perform extra optimization
     *                                      on the 3D atomic coordinates.
     * @returns Promise  A promise that resolves with a string of the requested
     * format..
     */
    function make3D(ligandPDB, smi, center, format, extraOptimization) {
        if (extraOptimization === void 0) { extraOptimization = false; }
        return loadFused(ligandPDB, smi, center, true).then(function (mol) {
            var gen3d = OB.OBOp.FindType('Gen3D');
            gen3d.Do(mol, '');
            mol.AddHydrogensWithParam(false, true, 7.4);
            if (extraOptimization) {
                // Minimize geometry a bit. This also adds hydrogens.
                var gen = new OB.OB3DGenWrapper();
                var loopCount = 1;
                for (var i = 0; i < loopCount; ++i) {
                    gen.generate3DStructure(mol, "MMFF94");
                }
            }
            var conv = new OB.ObConversionWrapper();
            conv.setOutFormat('', format);
            return conv.writeString(mol, true);
        });
    }
    exports.make3D = make3D;
});
// The Fuser web app adds a molecular fragment to a parent molecule. Copyright
// (C) 2021, Jacob Durrant.
define("App", ["require", "exports"], function (require, exports) {
    "use strict";
    var varNames = [
        "pdb",
        "smi",
        "x",
        "y",
        "z"
    ];
    var btnHTML = {};
    /**
     * Changes the state of a button (disables or enables).
     * @param  {string}  id          The ID of the button (DOM).
     * @param  {boolean} [val=true]  Whether to disable (true) or enable (false).
     * @returns Promise  A promise that resolves when half a second has passed.
     */
    function waitButton(id, val) {
        if (val === void 0) { val = true; }
        var btn = jQuery("#" + id);
        if (val) {
            btnHTML[id] = btn.html();
            btn.html("Processing...");
            btn.prop("disabled", true);
        }
        else {
            btn.html(btnHTML[id]);
            btn.prop("disabled", false);
        }
        return new Promise(function (resolve, reject) {
            setInterval(function () {
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
    function saveAsWrapper(blob, filename) {
        // See https://stackoverflow.com/questions/27298813/filesaver-and-requirejs-mismatched-anonymous-define
        return new Promise(function (resolve, reject) {
            requirejs(["../external/FileSaver.min"], function () {
                saveAs(blob, filename);
            });
        });
    }
    /**
     * Gets the values of the form elements and puts them in an object.
     * @returns * The object with the values.
     */
    function getVarVals() {
        var vals = {};
        var varNamesLen = varNames.length;
        for (var i = 0; i < varNamesLen; i++) {
            var varName = varNames[i];
            vals[varName] = $("#" + varName).val();
        }
        return vals;
    }
    /**
     * Runs if there is an error from openbabel.js when generating 3D molecules..
     * @returns void
     */
    function on3DError() {
        alert("Unable to create molecule! If you checked \"Optimize atomic coordinates\", try unchecking it. If you still get an error, generate a SMILES string instead of an SDF or PDB file. Your molecule is likely too large or complex to generate 3D atomic coordinates in the browser.");
        waitButton("downloadPDBBtn", false);
    }
    /**
     * Runs if there is an error from openbabel.js when generating a SMI file..
     * @returns void
     */
    function onSMIError() {
        alert("Unable to create molecule! Your molecule is likely too large or complex to \"fuse\" in the browser, or perhaps your browser does not support WebAssembly.");
        waitButton("downloadPDBBtn", false);
    }
    $("#downloadSMILESBtn").on("click", 
    /**
     * Creates and downloads a fused compound in the SMILES format.
     * @returns void
     */
    function () {
        var Fuser;
        waitButton("downloadSMILESBtn", true).then(function () {
            return new Promise(function (resolve_1, reject_1) { require(["./Fuser"], resolve_1, reject_1); });
        }).then(function (fuser) {
            Fuser = fuser;
            return Promise.resolve(Fuser.loadOB());
        }).then(function () {
            var vals = getVarVals();
            var pdb = vals["pdb"];
            return Fuser.makeSMILES(pdb, vals["smi"], [parseInt(vals["x"]), parseInt(vals["y"]), parseInt(vals["z"])]);
        }).then(function (smi) {
            var blob = new Blob([smi + '\n'], { type: "text/plain;charset=utf-8" });
            saveAsWrapper(blob, "fused.smi");
            waitButton("downloadSMILESBtn", false);
        })["catch"](function (e) {
            onSMIError();
        });
    });
    $("#downloadSDFBtn").on("click", 
    /**
     * Creates and downloads a fused compound in the SDF format.
     * @returns void
     */
    function () {
        var Fuser;
        var extraOptim = $("#extraOptimization").prop("checked");
        waitButton("downloadSDFBtn", true).then(function () {
            return new Promise(function (resolve_2, reject_2) { require(["./Fuser"], resolve_2, reject_2); });
        }).then(function (fuser) {
            Fuser = fuser;
            return Fuser.loadOB();
        }).then(function () {
            var vals = getVarVals();
            var pdb = vals["pdb"];
            var center = [parseInt(vals["x"]), parseInt(vals["y"]), parseInt(vals["z"])];
            return Fuser.make3D(pdb, vals["smi"], center, 'sdf', extraOptim);
        }).then(function (sdf) {
            var blob = new Blob([sdf + '\n'], { type: "text/plain;charset=utf-8" });
            saveAsWrapper(blob, "fused.sdf");
            waitButton("downloadSDFBtn", false);
        })["catch"](function (e) {
            on3DError();
        });
    });
    $("#downloadPDBBtn").on("click", 
    /**
     * Creates and downloads a fused compound in the PDB format.
     * @returns void
     */
    function () {
        var Fuser;
        var extraOptim = $("#extraOptimization").prop("checked");
        waitButton("downloadPDBBtn", true).then(function () {
            return new Promise(function (resolve_3, reject_3) { require(["./Fuser"], resolve_3, reject_3); });
        }).then(function (fuser) {
            Fuser = fuser;
            return Fuser.loadOB();
        }).then(function () {
            var vals = getVarVals();
            var pdb = vals["pdb"];
            var center = [parseInt(vals["x"]), parseInt(vals["y"]), parseInt(vals["z"])];
            return Fuser.make3D(pdb, vals["smi"], center, 'pdb', extraOptim);
        }).then(function (pdb) {
            var blob = new Blob([pdb + '\n'], { type: "text/plain;charset=utf-8" });
            saveAsWrapper(blob, "fused.pdb");
            waitButton("downloadPDBBtn", false);
        })["catch"](function (e) {
            on3DError();
        });
    });
    $("#expand").on("click", 
    /**
     * Shows any form elements that are currently hidden.
     * @returns void
     */
    function () {
        var varNamesLen = varNames.length;
        for (var i = 0; i < varNamesLen; i++) {
            var varName = varNames[i];
            jQuery("#" + varName + "-row").slideDown();
        }
        $(".hide-on-expand").hide();
    });
    /**
     * Sets up the Fuser app. The "main" function.
     * @returns void
     */
    function setupApp() {
        var queryString = window.location.search;
        var urlParams = new URLSearchParams(queryString);
        // e.g.,
        // http://0.0.0.0:8000/?pdb=IIFQ8gsgBDsIyygYSgDXW+iYBYcDoAGOHKAWjgCZ9LKBmGOAVnxzgHZGjCZDvsBSAFChIAyohTpUmRgLz52TCRTr44hBlDgA2GpQCcXQjyh8TA7MNHRsWmFIwy52BYR0MKBOHCPa9BpSc2vxmoZYOIuC2iKSwjjLO2vLUOjoqJDR0AByMetn0xqbmphHIUWLYTJJoTliucPiBuar4dDoI-kRwWo0WYf1l1tECOjXSssmuqZrkVG3KjCx0hHF9xeERw5WIwQ61ifWxjewGpBSNdOzBmTjERbybltsxsLmwAHIHk53H6oUUaiUPCMNR0Aw3UIlMowD4VV4wPz7CZJX6wHDUQhMTw9IgdRjUJg4PzrR6DLbw7AacZ1FyxahXc7zWidHw0bLvUkDUoUmxUtFgb6olI0QJzPgGbLVbSNILSrnQmFgSmIKiIQUoo7o1LpObUbLsXp8Hq9KFPATKvmq+zIIVamDgxQGIyAtpsUFtYEPbkw8pW+BxGAa2lTRCOrEIC6KanaAhYtZm8mWS0jVXS5EhtEOgw0HRMtQ4dichkgkL9RVDFXwMafO102COuiUSOZU6meY6dgJ8vm7Bw-2MPa2zX1h3ZRTYuZg7K9Pp570V3mp+DvWF10MN8c4TtzAg6foafDpSE9pMCfvLxhI4eZgQ5fDZakUFg4bJrRodEmJnnPKswSg8gkPx3uO7CUNUFD5I+jCNEwBoLr2kh-lAzY0oco5QPeb4ZOw+BEvKfB0EwNYKoh8TIbQaHAXYoEQnM44GE2jCEYQX6nj+ggUTaQHCjRR5MBBvjRu+rBdghZ5WBRgY3uhG5jnhHhzDmhBeto1DsKx4kcZJA4oemMnUWG477pwFC4XmEhqYo2Ttt+vrCEAA&smi=*C(%3DO)O&x=38.753&y=-13.383&z=11.064
        var params = {};
        var showIfPrepopulated = jQuery(".show-if-prepopulated");
        var namesLen = varNames.length;
        for (var i = 0; i < namesLen; i++) {
            var name_1 = varNames[i];
            params[name_1] = urlParams.get(name_1);
            if (params[name_1] !== null) {
                if (name_1 === "pdb") {
                    params[name_1] = LZString.decompressFromEncodedURIComponent(params[name_1]);
                }
                jQuery("#" + name_1).val(params[name_1]);
                showIfPrepopulated.show();
            }
            else {
                // Not pre-populated from URL, so show it.
                jQuery("#" + name_1 + "-row").show();
            }
        }
    }
    setupApp();
});
