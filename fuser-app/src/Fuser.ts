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


declare function OpenBabelModule();

// Loaded via script tag.
var OB;

/**
 * Waits for open babel to load.
 * @returns Promise  The promise returned when it is ready.
 */
export function loadOB(): Promise<any> {
    if (OB !== undefined) {
        // Already loaded.
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        OB = OpenBabelModule();
        window['OB'] = OB;

        let checkReady = () => {
            if (OB.ObConversionWrapper) {
                resolve(undefined);
            } else {
                setTimeout(checkReady.bind(this), 500);
            }
        }

        checkReady();
    });
}

/**
 * Merge a frag OBMol into a parent OBMol. The parent OBMol is updated in-place.
 * @param parent     Parent OBMol that will be updated.
 * @param frag       Fragment OBMol.
 * @param parentIdx  Index of the connection point atom in the parent.
 * @param fragIdx    Index of the fragment fake atom "*".
 */
function fuseMol(parent: any, frag: any, parentIdx: number, fragIdx: number): void {
    // other idx -> base idx
    var atom_map = {}

    // Add all atoms.
    for (var i = 1; i < frag.NumAtoms() + 1; ++i) {
        if (i == fragIdx) continue;

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
        } else if (end == fragIdx) {
            // parent<->begin
            parent.AddBondWithParam(parentIdx, atom_map[begin], order, 0, -1);
        } else {
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
    var currHCount = conn.GetImplicitHCount()
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
function loadFused(ligandPDB: string, smi: string, center: number[], optimizeFragGeometry = false): Promise<any> {
    return new Promise((resolve, reject) => {
        // Load ligand and fragment as OBMol's.
        var conv = new OB.ObConversionWrapper()
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
            var dist2 = (dx*dx) + (dy*dy) + (dz*dz);

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
 export function makeSMILES(ligandPDB: string, smi: string, center: number[]): Promise<string> {
    return loadFused(ligandPDB, smi, center, false).then((mol) => {
        var conv = new OB.ObConversionWrapper()
        conv.setOutFormat('', 'smi');

        return conv.writeString(mol, true);
    });
}

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
export function make3D(ligandPDB: string, smi: string, center: number[], format: string, extraOptimization: boolean = false): Promise<string> {
    return loadFused(ligandPDB, smi, center, true).then((mol) => {
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

        var conv = new OB.ObConversionWrapper()
        conv.setOutFormat('', format);

        return conv.writeString(mol, true);
    });
}
