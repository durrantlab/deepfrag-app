function fileLoad(
    txtName: string, receptorFilename: string, ligandFilename: string,
    checkStartOver: boolean = false, useExamples: boolean = false,
    testDownload: boolean = false
) {
    test(txtName + "_TITLETITLE", async (t) => {
        // Load files.
        if (useExamples) {
            // Use the example button
            await t
                .click("#useExampleFiles")
        } else {
            // Load the files
            await t
                .setFilesToUpload(
                    "#form-file-receptor",
                    receptorFilename
                )
                .wait(1000)
                .setFilesToUpload(
                    "#form-file-ligand",
                    ligandFilename
                );
        }

        // Test temp save. This really just checks for javascript errors, not
        // functionality.
        await t
            .click("#tempSave")

        // Run deepfrag.
        await t
            .expect(Selector("#startDeepFrag").innerText)
            .eql("PRESS START", "Found PRESS START!", {timeout: 15000})
            .click("#startDeepFrag")
            .expect(Selector("#executionTime").exists).ok()
            .wait(500)

        const time = await Selector("#executionTime").innerText;
        const firstSMILES = await Selector("#outputTable > tbody > tr:nth-child(1) > td:nth-child(2)").innerText;

        if (testDownload) {
            await t
                .click("#downloadScores")
                .click("#downloadGrowingPoint")
                .click("#downloadReceptorPDB")
                .click("#downloadLigandPDB")
        }

        if (checkStartOver) {
            await t
                .click(".nav:nth-child(1) > .nav-item:nth-child(4) > a")
                .setNativeDialogHandler(() => true)
                .click("#startOver")
                .expect(Selector("#form-file-receptor").exists).ok()
        }

        console.log("\n");
        console.log(time);
        console.log(firstSMILES);
    });
}

let receptorFilenames = [
    "../../src/example/2XP9.aligned.pdb",
    "../../src/example/2XP9.aligned.xyz",
    "../../src/example/2XP9.aligned.pqr",
];
let ligandFilenames = [
    "../../src/example/2XP9.aligned.lig.sdf",
    "../../src/example/2XP9.aligned.lig.mol2",
    "../../src/example/2XP9.aligned.lig.pdb",
    "../../src/example/2XP9.aligned.lig.xyz"
]

fileLoad("Use example files", undefined, undefined, true, true, true);

const receptorFilenamesLen = receptorFilenames.length;
for (let i = 0; i < receptorFilenamesLen; i++) {
    const receptorFilename = receptorFilenames[i];
    const ligandFilenamesLen = ligandFilenames.length;
    for (let i = 0; i < ligandFilenamesLen; i++) {
        const ligandFilename = ligandFilenames[i];
        fileLoad(
            receptorFilename + "--" + ligandFilename,
            receptorFilename,
            ligandFilename,
            true, false, false
        );
    }
}
