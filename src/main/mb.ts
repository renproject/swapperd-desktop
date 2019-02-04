
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
