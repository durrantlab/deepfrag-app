# DeepFrag Browser App 1.0.0

## Introduction

DeepFrag is a deep-learning model that recommends strategies for lead
optimization. The [original
implementation](http://durrantlab.com/deepfragmodel) is a Python script and so
requires a certain degree of computational expertise. To encourage broader
adoption, we have created the DeepFrag browser app, which provides a
user-friendly graphical user interface that runs the DeepFrag model in users'
web browsers. The browser app does not require users to upload their molecular
structures to a third-party server, nor does it require the separate
installation of any third-party software. It can be accessed free of charge,
without requiring registration, at
[http://durrantlab.com/deepfrag](http://durrantlab.com/deepfrag).

## Compatibility

We have tested the DeepFrag library on macOS 10.14.5, Windows 10.0.19041 Home,
and Ubuntu Linux 18.04.5 LTS.

|Browser                |Operating System          |
|-----------------------|--------------------------|
|Chrome 88.0.4324.87    | macOS 10.14.5            |
|Firefox 84.0           | macOS 10.14.5            |
|Safari 13.1.1          | macOS 10.14.5            |
|Chrome 87.0.4280.141   | Windows 10.0.19041 Home  |
|Firefox 84.0.2         | Windows 10.0.19041 Home  |
|Edge 87.0.664.75       | Windows 10.0.19041 Home  |
|Chrome 87.0.4280.141   | Android 10               |
|Firefox 84.1.4         | Android 10               |
|Safari 14              | iPhone SE iOS 14.3       |
|Chromium 87.0.4280.141 | Ubuntu Linux 18.04.5 LTS |
|Firefox 84.0.2         | Ubuntu Linux 18.04.5 LTS |

## Repository Contents

* `src/`: The DeepFrag source files. You cannot use these files directly. They
  must be compiled. For a compiled, ready-to-use copy of the DeepFrag browser
  app, see the [Releases
  page](https://git.durrantlab.pitt.edu/jdurrant/deepfrag-app/-/releases).
* `utils/`, `package.json`, `package-lock.json`, `tsconfig.json`: Files used
  to compile the contents of the `src/` directory to the `dist/` directory.
* `CHANGELOG.md`, `CONTRIBUTORS.md`, `LICENSE.md`, `README.md`: Documentation
  files.

## Description of Use

### Input Parameters Tab

After visiting the DeepFrag browser-app URL, users will first encounter the
"Input Parameters" tab. In the "Input Receptor and Ligand Files" subsection,
users can specify the protein receptor and ligand file for optimization in any
of several popular molecular-model formats. The contents of these files are
loaded into the browser's memory, but they are never transmitted/uploaded to
any third-party server. Users who wish to simply test DeepFrag can instead
click the "Use Example Files" button to load in a pre-prepared structure of
Pin1p bound to a small-molecule ligand (PDB 2XP9).

The "Molecular Viewer" subsection contains a 3Dmol.js molecular viewer were
the specified files are displayed. This subsection also includes two toggle
buttons. The "Delete Atom" button allows users to remove ligand atoms from the
structure by clicking on them. The "Select Atom as Growing Point" toggle
button allows users to indicate which ligand atom should serve as the growing
point (i.e., connection point) that connects the predicted fragments to the
parent ligand molecule. After users click the appropriate ligand atom, a
yellow transparent sphere indicates the location of the growing point.

At the bottom of the Input Parameters tab, the "Temporary Save" button saves
the specified parameters (i.e., receptor/ligand files, connection point, etc.)
to the browser's session storage. These same parameters can be later restored
using the "Load Saved Data" button. Otherwise, the user simply clicks the
"Start DeepFrag" button to begin the DeepFrag run. The browser implementation
is identical to the production model, but without grid rotation/fragment
averaging.

### Output Tab

DeepFrag displays the "Output" tab once the calculations are complete. The
"Visualization" subsection again displays the specified receptor, ligand, and
growing point for user convenience. Below the molecular visualization, a table
shows the SMILES strings, molecular structures, and DeepFrag scores of the top
twenty predicted fragments, sorted from most to least promising.

The "Output Files" subsection allows users to directly view DeepFrag output
text files. They can also press the associated "Download" buttons to save the
files to disk. These files include a more complete list of the predicted
fragments (TSV format), the 3D coordinates of the selected growing point (JSON
format), and the receptor and ligand files used for analysis (PDB format).

### Start Over Tab

The "Start Over" tab displays a simple button that allows the user to restart
the DeepFrag app. A warning message reminds the user that they will lose the
results of the current DeepFrag run unless they have saved their output files.

## Running the DeepFrag Browser App on Your Own Computer

Most users will wish to simply access the already compiled, publicly available
[DeepFrag browser app](http://durrantlab.com/deepfrag). If you wish to instead
run DeepFrag browser app on your own UNIX-like computer (LINUX, macOS, etc.),
follow these instructions:

1. Download the compiled app from the [Releases
   page](https://git.durrantlab.pitt.edu/jdurrant/deepfrag-app/-/releases)
2. Uncompress the file: `unzip deepfrag.zip`
3. Change to the new `deepfrag/` directory: `cd deepfrag`
4. Start a local server.
   * You can use `Node.js` and `npm`:
     * `npm install -g http-server`
     * `http-server`
   * [With some
     coding](https://curiousprog.com/2018/10/08/serving-webassembly-files-with-a-development-web-server/),
     you can also use Python 2.7's built-in server:
     * `python -m SimpleHTTPServer 8000`
5. Access the server from your web-browser (e.g., `http://localhost:8000/`,
   `http://0.0.0.0:8000/`, etc.)

Running DeepFrag on other operating systems (e.g., Windows) should be similar.

## Compiling the DeepFrag Browser App

The vast majority of users will not need to compile the DeepFrag browser app
on their own. Simply use the [online version](http://durrantlab.com/deepfrag)
or download the already compiled files from the [Releases
page](https://git.durrantlab.pitt.edu/jdurrant/deepfrag-app/-/releases). If
you need to make modifications to the source code, these instructions should
help with re-compiling on UNIX-like systems:

1. Clone or download the git repository: `git clone https://git.durrantlab.pitt.edu/jdurrant/deepfrag-app.git`
2. Change into the new `deepfrag-app` directory: `cd deepfrag-app`
3. Install the required `npm` packages: `npm install`
4. Fix any vulnerabilities: `npm audit fix`
5. Make sure Python is installed system wide, and that `python` works from the
   command line (tested using Python 2.7.15)
6. To deploy a dev server: `npm run start`
7. To compile the contents of `src/` to `dist/`: `npm run build`

## Notes on User Analytics

In some circumstances, the DeepFrag browser app may report usage statistics to
Google Analytics. These reports are useful for securing and justifying funding
for the Durrant lab. Usage statistics are only sent if the browser-app URL
contains the substring "durrantlab," so installing DeepFrag on your own server
should prevent reporting. Even when using the publicly available version of
DeepFrag hosted at
[http://durrantlab.com/deepfrag](http://durrantlab.com/deepfrag), information
about your specific receptor and ligand files is never transmitted to any
remote server.
