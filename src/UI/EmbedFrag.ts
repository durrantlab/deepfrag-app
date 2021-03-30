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

declare var Vue;

export function setup(): void {
    Vue.component('embed-frag', {
        props: ['index', 'fragment'],

        // <form-button :small="true" @click.native="makeSMILES">SMILES</form-button>
        // <form-button :small="true" @click.native="makeSDF">SDF</form-button>
        // <form-button :small="true" @click.native="makePDB">PDB</form-button>

        template: /* html */ `
            <div style="display:flex;">
                <form-button :small="true" @click.native="downloadMolecule">Download</form-button>
            </div>
        `,
        methods: {
            "downloadMolecule"(): void {
                let ligandPDB = this.$store.state["ligandPdbTxtFrom3DMol"];
                let fragSMILES = this.fragment;
                let center = this.$store.state["growingPointJSON"];

                import("lz-string").then((LZString) => {
                    // let ligandPDBCompressed = LZString.compress(ligandPDB);
                    let ligandPDBCompressed = LZString.compressToEncodedURIComponent(ligandPDB);
                    let url = `fuser-app/index.html?pdb=${ligandPDBCompressed}&smi=${encodeURIComponent(fragSMILES)}&x=${encodeURIComponent(center[0].toString())}&y=${encodeURIComponent(center[1].toString())}&z=${encodeURIComponent(center[2].toString())}`
                    window.open(url);
                });
            }
        }
    })
}
