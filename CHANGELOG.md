Changes
=======

1.0.1
-----

* Changed name in package.json and package-lock.json to "deepfrag-app" to
  avoid confusion with the original DeepFrag model.
* Similarly, updated the name of the zip file to deepfrag-app.zip. Updated
  `README.md` to reflect this change.
* Updated `README.md` with instructions describing how to run a local server
  using Python3.
* Created the Fuser web app, which can add a molecular fragment (SMILES) to a
  small molecule (PDB). This web app is entirely separate from DeepFrag. It is
  separately licensed under the GPLv2 license. See `fuser-app/README.md`.
* Changed Closure compilation to be less aggressive, to avoid errors.
* Improved rotation-augmentation code. Now defaults to 32 rotations, as in the
  original DeepFrag implementation. By default, the web app now also applies a
  random rotation at every inference, as in the original DeepFrag
  implementation.

1.0.0
-----

* The initial version.
* Apache License 2.0.
