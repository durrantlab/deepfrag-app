# Copyright 2021 Jacob Durrant

# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy
# of the License at

# http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.


"""
rdkit/openbabel utility scripts
"""
# __pragma__ ('skip')
from rdkit import Chem

# __pragma__ ('noskip')

"""?
from .gridder.fake_rdkit import Chem
?"""

import math


def get_coords(mol):
    """Returns an array of atom coordinates from an rdkit mol."""
    conf = mol.GetConformer()
    coords = [conf.GetAtomPosition(i) for i in range(conf.GetNumAtoms())]
    return coords


def get_atomic_nums(mol):
    """Returns an array of atomic numbers from an rdkit mol."""
    return [mol.GetAtomWithIdx(i).GetAtomicNum() for i in range(mol.GetNumAtoms())]


def generate_fragments(mol, max_heavy_atoms, only_single_bonds):
    """Takes an rdkit molecule and returns a list of (parent, fragment) tuples.

    Args:
        mol: The molecule to fragment.
        max_heavy_atoms: The maximum number of heavy atoms to include
            in generated fragments.
        nly_single_bonds: If set to true, this method will only return
            fragments generated by breaking single bonds.

    Returns:
        A list of (parent, fragment) tuples where mol is larger than fragment.
    """

    max_heavy_atoms = 0 if max_heavy_atoms is None else max_heavy_atoms
    only_single_bonds = True if only_single_bonds is None else only_single_bonds

    # list of (parent, fragment) tuples
    splits = []

    # __pragma__ ('skip')
    try:
        # if we have multiple ligands already, split into pieces and then iterate
        ligands = Chem.GetMolFrags(mol, asMols=True, sanitizeFrags=False)

        for i in range(len(ligands)):
            lig = ligands[i]
            other = list(ligands[:i] + ligands[i + 1 :])

            # iterate over bonds
            for i in range(lig.GetNumBonds()):
                # (optional) filter base on single bonds
                if (
                    only_single_bonds
                    and lig.GetBondWithIdx(i).GetBondType()
                    != Chem.rdchem.BondType.SINGLE
                ):
                    continue

                # split the molecule
                split_mol = Chem.rdmolops.FragmentOnBonds(lig, [i])

                # obtain fragments
                fragments = Chem.GetMolFrags(
                    split_mol, asMols=True, sanitizeFrags=False
                )

                # skip if this did not break the molecule into two pieces
                if len(fragments) != 2:
                    continue

                # otherwise make sure the first fragment is larger
                if fragments[0].GetNumAtoms() < fragments[1].GetNumAtoms():
                    fragments = fragments[::-1]

                # make sure the fragment has at least one heavy atom
                if fragments[1].GetNumHeavyAtoms() == 0:
                    continue

                # (optional) filter based on number of heavy atoms in the fragment
                if (
                    max_heavy_atoms > 0
                    and fragments[1].GetNumHeavyAtoms() > max_heavy_atoms
                ):
                    continue

                # if we have other ligands present, merge them with the parent
                parent = fragments[0]

                if len(other) > 0:
                    parent = combine_all([parent] + other)

                # add this pair
                splits.append((parent, fragments[1]))
    except:
        # When running under python, but with fake_rdkit. Don't fragment. Just
        # returm parent.
        splits = [(mol, None)]  # fragment is None
    # __pragma__ ('noskip')

    """?
    splits = [(mol, None)]
    ?"""

    return splits


def load_receptor(rec_path):
    """Loads a receptor from a pdb file and retrieves atomic information.

    Args:
        rec_path: Path to a pdb file.
    """
    rec = Chem.MolFromPDBFile(rec_path, sanitize=False)
    rec = remove_water(rec)
    rec = remove_hydrogens(rec)

    return rec


def remove_hydrogens(m):
    # __pragma__ ('skip')
    for atom in m.GetAtoms():
        atom.SetFormalCharge(0)
    m = Chem.RemoveHs(m)
    # __pragma__ ('noskip')

    """?
    m.atoms = [a for a in m.atoms if a.element != "H"]
    ?"""

    return m


def remove_water(m):
    """Removes water molecules from an rdkit mol."""
    # __pragma__ ('skip')
    try:
        parts = Chem.GetMolFrags(m, asMols=True, sanitizeFrags=False)
        valid = [
            k for k in parts if not Chem.MolToSmiles(k, allHsExplicit=True) == "[OH2]"
        ]

        assert len(valid) > 0, "error: molecule contains only water"

        merged = valid[0]
        for part in valid[1:]:
            merged = Chem.CombineMols(merged, part)
    except:
        m.atoms = [
            a for a in m.atoms if a.resname not in ["WAT", "HOH", "TIP", "TIP3", "OH2"]
        ]
        merged = m
    # __pragma__ ('noskip')

    """?
    m.atoms = [
        a for a in m.atoms if a.resname not in ["WAT", "HOH", "TIP", "TIP3", "OH2"]
    ]
    merged = m
    ?"""

    return merged


def combine_all(frags):
    """Combines a list of rdkit mols."""
    if len(frags) == 0:
        return None

    c = frags[0]
    for f in frags[1:]:
        c = Chem.CombineMols(c, f)

    return c


def load_ligand(sdf):
    """Loads a ligand from an sdf file and fragments it.

    Args:
        sdf: Path to sdf file containing a ligand.
    """
    lig = next(Chem.SDMolSupplier(sdf, sanitize=False))
    lig = remove_water(lig)
    lig = remove_hydrogens(lig)

    frags = generate_fragments(lig, None, None)

    return lig, frags


def mol_to_points(mol, atom_types, note_sulfur=True):
    """convert an rdkit mol to an array of coordinates and layers"""

    atom_types = (
        [6, 7, 8, 16,]  # carbon  # nitrogen  # oxygen  # sulfur
        if atom_types is None
        else atom_types
    )

    coords = get_coords(mol)
    atomic_nums = get_atomic_nums(mol)

    layers = []
    for t in atomic_nums:
        if t == 1:
            # Always ignore hydrogen. Should have already been ignored.
            layers.append(-1)
        elif t == 6:
            # Carbon
            layers.append(0)
        elif t == 7:
            # Nitrogen
            layers.append(1)
        elif t == 8:
            # Oxygen
            layers.append(2)

        # Below differs depending on protein or not.
        elif not note_sulfur:
            # Not noting sulfur (e.g., ligand), but some other atom.
            layers.append(3)
        else:
            # So supposed to note sulfur (protein)
            if t == 16:
                # Noting sulfur (e.g., protein) and sulfur found.
                layers.append(3)
            else:
                # Noting sulfur (e.g., protein) but some other atom.
                layers.append(4)


        # elif not note_sulfur:
        #     # Not noting sulfur (e.g., ligand), but some other atom.
        #     layers.append(3)
        # elif note_sulfur and t == 16:
        #     # Noting sulfur (e.g., protein) and sulfur found.
        #     layers.append(3)
        # elif note_sulfur:
        #     # Noting sulfur (e.g., protein) but some other atom.
        #     layers.append(4)

    # layers = [(atom_types.index(k) if k in atom_types else -1) for k in types]

    # filter by existing layer
    # coords = coords[layers != -1]
    coords = [c for i, c in enumerate(coords) if layers[i] != -1]
    # layers = layers[layers != -1].reshape(-1, 1)  # JDD NOTE: Like .T
    layers = [l for l in layers if l != -1]

    return coords, layers


def get_connection_point(frag):
    """return the coordinates of the dummy atom as a numpy array [x,y,z]"""
    dummy_idx = get_atomic_nums(frag).index(0)
    coords = get_coords(frag)[dummy_idx]

    return coords


def frag_dist_to_receptor_raw(coords, frag):
    """compute the minimum distance between the fragment connection point any receptor atom"""
    conn = get_connection_point(frag)
    # rec_coords = np.array(coords)
    # dist = np.sum((rec_coords - conn) ** 2, axis=1)
    # min_dist = np.sqrt(np.min(dist))
    # print(min_dist)
    # return min_dist

    # non-numpy version
    dists = []
    for i in range(len(coords)):
        coord = coords[i]
        tmp = [coord[0] - conn.x, coord[1] - conn.y, coord[2] - conn.z]
        tmp = [tmp[0] ** 2, tmp[1] ** 2, tmp[2] ** 2]
        s = sum(tmp)
        dists.append(s)
    min_dist = math.sqrt(min(dists))
    return min_dist


def mol_array(mol):
    """convert an rdkit mol to an array of coordinates and atom types"""
    coords = get_coords(mol)
    types = get_atomic_nums(mol)
    # types = np.array(get_atomic_nums(mol)).reshape(-1, 1)
    # arr = np.concatenate([coords, types], axis=1)
    # import pdb; pdb.set_trace()

    arr = []
    for i, coor in enumerate(coords):
        arr.append([coor.x, coor.y, coor.z, types[i]])

    return arr
    # return coords, types
