# Notes on Grid Generation

This directory contains the pure-Python source code for generating voxel grids
from receptor and ligand structures. See `./transpile_to_js.sh` for an example
of how to compile the Python source code to JavaScript. Compilation requires
[transcrypt](https://www.transcrypt.org/).

Note that `./transpile_to_js.sh` saves the compiled JavaScript to the
`./__target__/` directory. These files must be manually copied to the
`../gridder/` directory so the DeepFrag browser app can access them.
