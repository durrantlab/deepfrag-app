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

declare function OpenBabelModule();

// Loaded via script tag.
var OB = OpenBabelModule();
window['OB'] = OB;


/**
 * Merge a frag OBMol into a parent OBMol. The parent OBMol is updated in-place.
 * @param parent      Parent OBMol that will be updated.
 * @param frag     Fragment OBMol.
 * @param parentIdx     Index of the connection point atom in the parent.
 * @param fragIdx       Index of the fragment fake atom "*".
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

        atom_map[other_atom.GetIndex()+1] = atom.GetIndex() + 1;
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
}

/**
 * Load and fuse a parent/ligand combination.
 * @param  {string} ligandPDB           The ligand PDB string.
 * @param  {string} fragmentSMILES      SMILES string of the fragment.
 * @param  {Array<number>} center       The location of the growing point.
 * Returns an OBMol with a fused "full ligand."
 */
function loadFused(ligandPDB: string, fragmentSMILES: string, center: number[]): Promise<any> {
    return new Promise((resolve, reject) => {
        // Load ligand and fragment as OBMol's.
        var conv = new OB.ObConversionWrapper()
        var frag = new OB.OBMol();
        var parent = new OB.OBMol();

        conv.setInFormat('', 'smi');
        conv.readString(frag, fragmentSMILES);

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

        // Attach the fragment to the parent.
        fuseMol(parent, frag, parent_atom_idx, frag_atom_idx);

        resolve(parent);
    });
}

/**
 * Generate a 2D embedding of a ligandPDB and fragment as a SMILES string
 * @param  {string} ligandPDB           The ligand PDB string.
 * @param  {string} fragmentSMILES      SMILES string of the fragment.
 * @param  {Array<number>} center       The location of the growing point.
 * @returns Promise  A promise that resolves with a SMILES string of the full ligand..
 */
 export function makeSMILES(ligandPDB: string, fragmentSMILES: string, center: number[]): Promise<string> {
    return loadFused(ligandPDB, fragmentSMILES, center).then((mol) => {
        var conv = new OB.ObConversionWrapper()
        conv.setOutFormat('', 'smi');

        return conv.writeString(mol, true);
    });
}

/**
 * Generate a 3D embedding of a ligandPDB and fragment.
 * @param  {string} ligandPDB           The ligand PDB string.
 * @param  {string} fragmentSMILES      SMILES string of the fragment.
 * @param  {Array<number>} center       The location of the growing point.
 * @param  {string} format              The output file format (e.g. "sdf", "pdb", ...)
 * @returns Promise  A promise that resolves with a string of the requested format..
 */
export function make3D(ligandPDB: string, fragmentSMILES: string, center: number[], format: string): Promise<string> {
    return loadFused(ligandPDB, fragmentSMILES, center).then((mol) => {
        var gen3d = OB.OBOp.FindType('Gen3D');
        gen3d.Do(mol, '');

        var conv = new OB.ObConversionWrapper()
        conv.setOutFormat('', format);

        return conv.writeString(mol, true);
    });
}
