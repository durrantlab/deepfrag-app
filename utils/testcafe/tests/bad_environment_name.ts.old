// Note this isn't full testing. You'd need a phone for that (with
// DeviceOrientationEvent["requestPermission"]()). But at least tests some of
// the javascript leading up to that.

function badEnvironmentName() {
    test("TITLETITLE", async (t) => {
        await t
            .wait(10000)  // wait because sometimes fails otherwise
            .navigateTo("./?e=environs/badone/")
            .wait(3000)  // wait because sometimes fails otherwise
            .expect(Selector("#simple-modal").innerText)
            .contains("doesn't exist or is unavailable")
            // .click("#modal-close-button-simple-modal")
            // .expect(Selector("#status").innerText)
            // .eql("splash screen loaded", {timeout: 15000});
    });
}

badEnvironmentName();
