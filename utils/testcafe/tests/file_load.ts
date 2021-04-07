import { ClientFunction } from 'testcafe';

function fileLoad(
    txtName: string, receptorFilename: string, ligandFilename: string,
    checkStartOver: boolean = false, useExamples: boolean = false,
    testDownload: boolean = false, useFullRotations: boolean = false,
    testFuser: boolean = false,
    useFiveRotations: boolean = false
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
        // functionality.numRotationsRange
        await t
            .click("#tempSave")

        if (useFiveRotations) {
            const setRotVal = ClientFunction(selector => {
                // @ts-ignore
                store.commit("setVar", {name: "numRotations", val: 5})
            });

            await setRotVal('#numRotationsRange');
        }

        if (!useFullRotations) {
            await t.click("#simplifyRotation");
        }

        // Run deepfrag.
        await t
            .expect(Selector("#startDeepFrag").innerText)
            .eql("PRESS START", "Found PRESS START!", {timeout: 15000})
            .click("#startDeepFrag")
            .expect(Selector("#executionTime").exists).ok()
            .wait(500)

        const time = await Selector("#executionTime", { timeout: 60000 }).innerText;
        let firstSMILESSelStr = "#outputTable > tbody > tr:nth-child(1) > td:nth-child(2)";
        const firstSMILES = await Selector(firstSMILESSelStr, { timeout: 100000 }).innerText;

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
        } else if (testFuser) {
            await t
                .click(firstSMILESSelStr + " a")
                .wait(2000)
                .click("#expand")
                .wait(500)
                .click("#downloadSMILESBtn")
                .wait(500)

                .expect(Selector("body").innerText).notContains(
                    "Processing...",
                    "Waited for 'Processing' to clear, but never did.",
                    { timeout: 60000 }
                )

                .click("#downloadSDFBtn")
                .wait(500)

                .expect(Selector("body").innerText).notContains(
                    "Processing...",
                    "Waited for 'Processing' to clear, but never did.",
                    { timeout: 60000 }
                )

                .click("#downloadPDBBtn")
                .wait(500)

                .expect(Selector("body").innerText).notContains(
                    "Processing...",
                    "Waited for 'Processing' to clear, but never did.",
                    { timeout: 60000 }
                )

                .click("#extraOptimization")
                .wait(500)

                .click("#downloadSMILESBtn")
                .wait(500)

                .expect(Selector("body").innerText).notContains(
                    "Processing...",
                    "Waited for 'Processing' to clear, but never did.",
                    { timeout: 60000 }
                )

                .click("#downloadSDFBtn")
                .wait(500)

                .expect(Selector("body").innerText).notContains(
                    "Processing...",
                    "Waited for 'Processing' to clear, but never did.",
                    { timeout: 60000 }
                )

                .click("#downloadPDBBtn")
                .wait(500)

                .expect(Selector("body").innerText).notContains(
                    "Processing...",
                    "Waited for 'Processing' to clear, but never did.",
                    { timeout: 60000 }
                );
        }

        console.log("\n", txtName + "_TITLETITLE", "\n", time, firstSMILES);
        // console.log(time);
        // console.log(firstSMILES);
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

fileLoad(
    "Big Test Fuser + Full Rotations",  // txtName
    undefined,            // receptorFilename
    undefined,            // ligandFilename
    false,                // checkStartOver
    true,                 // useExamples
    true,                 // testDownload
    true,                 // useFullRotations
    true,                 // testFuser
    false                 // useFiveRotations
);

fileLoad(
    "Big Test No Fuser Fast Rots",  // txtName
    undefined,            // receptorFilename
    undefined,            // ligandFilename
    true,                 // checkStartOver
    true,                 // useExamples
    true,                 // testDownload
    false,                // useFullRotations
    false,                // testFuser
    false                 // useFiveRotations
);

const receptorFilenamesLen = receptorFilenames.length;
for (let i = 0; i < receptorFilenamesLen; i++) {
    const receptorFilename = receptorFilenames[i];
    const ligandFilenamesLen = ligandFilenames.length;
    for (let i = 0; i < ligandFilenamesLen; i++) {
        const ligandFilename = ligandFilenames[i];
        fileLoad(
            receptorFilename + "--" + ligandFilename,  // txtName
            receptorFilename,                          // receptorFilename
            ligandFilename,                            // ligandFilename
            true,                                      // checkStartOver
            false,                                     // useExamples
            false,                                     // testDownload
            false,                                     // useFullRotations
            false,                                     // testFuser
            true                                       // useFiveRotations
        );
    }
}
