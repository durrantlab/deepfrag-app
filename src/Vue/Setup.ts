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


import * as FileInput from "../UI/Forms/FileInput";
import * as DeepFragParams from "../UI/Tabs/DeepFragParams";
import * as DeepFragRunning from "../UI/Tabs/DeepFragRunning";
import * as DeepFragOutput from "../UI/Tabs/DeepFragOutput";
import * as StartOver from "../UI/Tabs/StartOver";
import * as FormGroup from "../UI/Forms/FormGroup";
import * as ThreeDMol from "../UI/ThreeDMol";
import * as ResultsTable from "../UI/ResultsTable";
import * as EmbedFrag from "../UI/EmbedFrag";
import * as OpenModal from "../UI/Modal/OpenModal";
import * as SubSection from "../UI/SubSection";
import * as FormButton from "../UI/Forms/FormButton";

declare var Vue;
declare var Vuex;
declare var BootstrapVue;

/**
 * Load and setup all Vue components.
 * @returns void
 */
export function setup(): void {
    Vue.use(BootstrapVue)
    Vue.use(Vuex)

    SubSection.setup();
    FormButton.setup();
    OpenModal.setup();
    FormGroup.setup();
    ThreeDMol.setup();
    FileInput.setup();
    ResultsTable.setup();
    EmbedFrag.setup();
    DeepFragParams.setup();
    DeepFragRunning.setup();
    DeepFragOutput.setup();
    StartOver.setup();
}
