function typeText(txt: string, filename: string, environ: string = undefined, shadows: boolean = false) {
    const environSelect = Selector('#environments-pdbOrSdfText');
    const environOption = environSelect.find('option');

    var fs = require('fs');
    let tt = fs.readFileSync(filename, 'utf8');
    test(txt + "_TITLETITLE", async (t) => {
        await t
            .click("#pdb-sdf-text-tab")
            .typeText("#pdbOrSdfText", tt);  // {speed: 100});

        if (environ !== undefined) {
            await t
                .click(environSelect)
                .click(environOption.withText(environ));
        }

        if (shadows) {
            await t
                .click("#molecular-shadows-pdbOrSdfText");
        }

        await t
            .click("#load-local-file-text")
            .expect(Selector("#status").innerText)
            .eql("Mol Loaded", "Molecule loaded!", {timeout: 15000});

    });
}

typeText("small.sdf", "./small.sdf", "Intracellular", true);
typeText("small.pdb", "./small.pdb", "Lipid Bilayer", false);
