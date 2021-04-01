# Fuser App

## Purpose

The Fuser App adds a molecular fragment (SMILES) to an existing small molecule
(PDB). Users can then download the molecule + fragment (fused) compound in the
SMILES, SDF, or PDB format.

## License

The Fuser app is released under the terms of the (viral) <a
href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html#SEC1"
target="_blank">GPLv2 license.</a> This license is required because Fuser
relies on
[OpenBabel.js](https://github.com/partridgejiang/cheminfo-to-web/tree/master/OpenBabel/OpenBabel-js),
which is compiled from the [OpenBabel source
code](https://github.com/openbabel/openbabel) and so must be GPLv2 licensed.

## Relationship to the DeepFrag App

The Fuser app is distributed via the DeepFrag git repository only for
convenience's sake. A few things to note:

1. The DeepFrag app does not require Fuser in order to perform its core
   function (predicting fragment additions).
2. The Fuser app is entirely independent of the DeepFrag app. It can be used
   as a separate, stand-alone tool. As such, it also has a separate license
   (GPLv2 vs. DeepFrag's Apache2).
3. The DeepFrag app provides web links that send the user to the Fuser app
   when clicked, but the Fuser and DeepFrag apps have independent code bases
   and so are not combined in a way that would make them a single program.
   DeepFrag communicates with Fuser only "at arms length." This approach is
   effectively equivalent to communication between binary programs via
   mechanisms such as pipes, sockets, or command-line arguments.
