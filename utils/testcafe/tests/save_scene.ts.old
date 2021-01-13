function saveScene() {
    test("TITLETITLE", async (t) => {
        await t
            .click("#proteinvr-save-scene-tab")
            .click("#pvr-scene-file-name")
            .pressKey('ctrl+a delete')
            .typeText("#pvr-scene-file-name", "test.pvr")
            .click("#save-proteinvr-scene")
            .expect(Selector("#status").innerText)
            .eql("Mol Loaded", "Molecule loaded!", {timeout: 15000});

    });
}

saveScene();
