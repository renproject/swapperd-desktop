
import AutoLaunch from "auto-launch";

// We use auto-launch because `setLoginItemSettings` doesn't support Linux

// // Set app to auto-launch
// app.setLoginItemSettings({
//     openAtLogin: true,
//     path: app.getPath("exe")
// });

export const setupAutoLaunch = () => {

    const autoLauncher = new AutoLaunch({
        name: "Swapperd Desktop",
    });

    autoLauncher.isEnabled()
        .then((isEnabled: boolean) => {
            if (isEnabled) {
                return;
            }
            autoLauncher.enable().catch(console.error);
        })
        .catch(console.error);

};
