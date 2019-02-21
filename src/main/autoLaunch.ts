import AutoLaunch from "auto-launch";

import { MenubarApp } from "./menubar";

export const setupAutoLaunch = (mb: MenubarApp) => {

    if (process.platform === "linux") {
        // We use auto-launch because `setLoginItemSettings` doesn't support Linux
        const autoLauncher = new AutoLaunch({ name: "Swapperd Desktop" });

        autoLauncher.isEnabled()
            .then((isEnabled: boolean) => {
                if (isEnabled) {
                    return;
                }
                autoLauncher.enable().catch(console.error);
            })
            .catch(console.error);

    } else {
        // // Set app to auto-launch
        mb.app.setLoginItemSettings({
            openAtLogin: true,
            path: mb.app.getPath("exe")
        });
    }
};
