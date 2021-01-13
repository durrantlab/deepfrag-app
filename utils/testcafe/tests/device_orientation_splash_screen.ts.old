// Note this isn't full testing. You'd need a phone for that (with
// DeviceOrientationEvent["requestPermission"]()). But at least tests some of
// the javascript leading up to that.

function deviceOrientationSplashScreen() {
    test("TITLETITLE", async (t) => {
        await t
            .navigateTo("./?testdosplash")
            .click("#modal-close-button-simple-modal")
            .expect(Selector("#status").innerText)
            .eql("splash screen loaded", {timeout: 15000});
    });
}

deviceOrientationSplashScreen();
