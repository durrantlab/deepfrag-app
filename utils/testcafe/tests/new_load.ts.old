function newLoad(environ: string = undefined, shadows: boolean = false) {
    const environSelect = Selector('#environments-new-scene');
    const environOption = environSelect.find('option');

    var fs = require('fs');
    test("TITLETITLE", async (t) => {
        await t
            .click("#new-tab");

        if (environ !== undefined) {
            await t
                .click(environSelect)
                .click(environOption.withText(environ));
        }

        if (shadows) {
            await t
                .click("#molecular-shadows-new-scene");
        }

        await t
            .click("#submit-new")
            .expect(Selector("#status").innerText)
            .eql("Mol Loaded", "Molecule loaded!", {timeout: 15000});

    });
}

newLoad("Intracellular", true);
