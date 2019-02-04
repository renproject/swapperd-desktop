
import menubar from "menubar";
import * as path from "path";

import { app } from "electron";

const devMode = process.env.NODE_ENV === "development";

export const mb = menubar({
    tooltip: "Swapperd",
    preloadWindow: true,
    resizable: devMode,
    webPreferences: {
        // nodeIntegration: false,
        preload: `${app.getAppPath()}/dist/main/preload.js`,
    },
    alwaysOnTop: process.env.NODE_ENV === "development",
    icon: path.join(app.getAppPath(), "resources/IconTemplate.png"),
    minWidth: 500,
    maxWidth: 500,
    minHeight: 500,
    //   resizable: true,
    // transparent: true,
});

// Restrict to a single instance
const gotTheLock = mb.app.requestSingleInstanceLock();

if (!gotTheLock) {
    mb.app.quit();
} else {
    // tslint:disable-next-line: no-any
    mb.app.on("second-instance", (_event: any, _commandLine: any, _workingDirectory: any) => {
        // Someone tried to run a second instance, we should focus our window.
        mb.showWindow();
    });

    // Create myWindow, load the rest of the app, etc...
    mb.app.on("ready", () => {
        //
    });
}
