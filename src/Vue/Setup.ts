// This file is part of DeepFrag, released under the Apache 2.0 License. See
// LICENSE.md or go to https://opensource.org/licenses/Apache-2.0 for full
// details. Copyright 2020 Jacob D. Durrant.


import * as FileInput from "../UI/Forms/FileInput";
import * as DeepFragParams from "../UI/Tabs/DeepFragParams";
import * as DeepFragRunning from "../UI/Tabs/DeepFragRunning";
import * as DeepFragOutput from "../UI/Tabs/DeepFragOutput";
import * as StartOver from "../UI/Tabs/StartOver";
import * as FormGroup from "../UI/Forms/FormGroup";
import * as ThreeDMol from "../UI/ThreeDMol";
import * as ResultsTable from "../UI/ResultsTable";
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
    DeepFragParams.setup();
    DeepFragRunning.setup();
    DeepFragOutput.setup();
    StartOver.setup();
}
