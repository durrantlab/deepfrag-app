function webTextToUse(txt: string, environ: string = undefined, shadows: boolean = false) {
    const environSelect = Selector('#environments-urlOrPDB');
    const environOption = environSelect.find('option');

    test(txt + "_TITLETITLE", async (t) => {
        await t
            .click("#modal-close-button-load-save-modal")
            .click("#open-button")
            .typeText("#urlOrPDB", txt);

        if (environ !== undefined) {
            await t
                .click(environSelect)
                .click(environOption.withText(environ));
        }

        if (shadows) {
            await t
                .click("#molecular-shadows-urlOrPDB");
        }

        await t
            .click("#submit")
            .expect(Selector("#status").innerText)
            .eql("Mol Loaded", "Molecule loaded!", {timeout: 15000});
    });
}

webTextToUse("3NIR", "Nighttime", true);
webTextToUse("https://files.rcsb.org/view/3NIR.pdb", "Daytime", false);
webTextToUse("nanokid.sdf", "Blood");
webTextToUse("1xdn.pvr");
