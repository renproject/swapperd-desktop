import AutoLaunch from "auto-launch";

import { MenubarApp } from "./menubar";

export const setupAutoLaunch = async (mb: MenubarApp) => {

    if (process.platform === "linux") {
        // We use auto-launch because `setLoginItemSettings` doesn't support Linux

        // https://github.com/Teamwork/node-auto-launch/issues/85#issuecomment-403974827
        interface AutoLaunchOptions {
            name: string;
            path?: string;
        }
        const autoLaunchConfig: AutoLaunchOptions = { name: "Swapperd Desktop" };
        if (process.env.APPIMAGE) {
            autoLaunchConfig.path = process.env.APPIMAGE.replace(" ", "\\ ");
        }

        const autoLauncher = new AutoLaunch(autoLaunchConfig);
        await autoLauncher.enable();
    } else {
        // // Set app to auto-launch
        mb.app.setLoginItemSettings({
            openAtLogin: true,
            path: mb.app.getPath("exe")
        });
    }
};
