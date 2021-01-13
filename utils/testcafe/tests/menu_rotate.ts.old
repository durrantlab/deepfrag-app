function menuRotate() {
    test("TITLETITLE", async (t) => {
        await t
            .click("#modal-close-button-load-save-modal")
            .click("#menu-button")
            .click("#btn-Rotate")
            .click("#btn-Rotate-XAxis")
            .wait(1000)
            .click("#btn-Rotate-YAxis")
            .wait(1000)
            .click("#btn-Rotate-ZAxis")
            .wait(1000)
            .expect(Selector("#status").innerText)
            .eql("Rotate done: {X: 0.12940952255126037 Y:0.12940952255126037 Z:-0.01703708685546585 W:0.9829629131445341}", "Rotated!")
            .click("#btn-Rotate-UndoRotate")
            .wait(1000)
            .expect(Selector("#status").innerText)
            .eql("Rotate done: {X: 0.11141107393065441 Y:0.14519373836191624 Z:0.11141107393065441 W:0.9767773152319457}", "Rotated!")
            .click("#modal-close-button-menu-2d");

            // .pressKey('ctrl+a delete')
            // .typeText("#pvr-scene-file-name", "test.pvr")
            // .click("#save-proteinvr-scene")

    });
}

menuRotate();
