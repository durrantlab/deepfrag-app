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

import {makeSMILES, make3D} from "../DeepFrag/Fuser"

declare var Vue;
declare var FileSaver;

function getFileSaver(): Promise<any> {
    return Promise.resolve(FileSaver);
}

export function setup(): void {
    Vue.component('embed-frag', {
        props: ['index', 'fragment'],
        template: `
        <div style="display:flex;">
            <form-button :small="true" @click.native="makeSMILES">SMILES</form-button>
            <form-button :small="true" @click.native="makeSDF">SDF</form-button>
            <form-button :small="true" @click.native="makePDB">PDB</form-button>
        </div>
        `,
        methods: {
            makeSMILES() {
                var ligandPDB = this.$store.state["ligandPdbTxtFrom3DMol"];
                var fragSMILES = this.fragment;
                var center = this.$store.state["growingPointJSON"];

                makeSMILES(ligandPDB, fragSMILES, center).then((smi) => {
                    var blob = new Blob([smi + '\n'], {type: "text/plain;charset=utf-8"});
                    getFileSaver().then((FileSaver) => {
                        FileSaver.saveAs(blob, `deepfrag_${this.$store.state["ligandFileName"]}_pred_${this.index}.smi`);
                    });
                });
            },
            makeSDF() {
                var ligandPDB = this.$store.state["ligandPdbTxtFrom3DMol"];
                var fragSMILES = this.fragment;
                var center = this.$store.state["growingPointJSON"];

                make3D(ligandPDB, fragSMILES, center, 'sdf').then((smi) => {
                    var blob = new Blob([smi + '\n'], {type: "text/plain;charset=utf-8"});
                    getFileSaver().then((FileSaver) => {
                        FileSaver.saveAs(blob, `deepfrag_${this.$store.state["ligandFileName"]}_pred_${this.index}.sdf`);
                    });
                });
            },
            makePDB() {
                var ligandPDB = this.$store.state["ligandPdbTxtFrom3DMol"];
                var fragSMILES = this.fragment;
                var center = this.$store.state["growingPointJSON"];

                make3D(ligandPDB, fragSMILES, center, 'pdb').then((smi) => {
                    var blob = new Blob([smi + '\n'], {type: "text/plain;charset=utf-8"});
                    getFileSaver().then((FileSaver) => {
                        FileSaver.saveAs(blob, `deepfrag_${this.$store.state["ligandFileName"]}_pred_${this.index}.pdb`);
                    });
                });
            },
        }
    })
}
