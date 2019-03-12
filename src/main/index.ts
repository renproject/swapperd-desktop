import logger from "electron-log";

import { CONSOLE_MAIN_FORMAT, FILE_FORMAT } from "../common/logger";
import { setupAutoLaunch } from "./autoLaunch";
import { setupAutoUpdater } from "./autoUpdater";
import { setupExpress } from "./express";
import { setupListeners } from "./listeners";
import { setupIPC } from "./mainIpc";
import { setupMenubar } from "./menubar";

logger.transports.console.format = CONSOLE_MAIN_FORMAT;
logger.transports.file.format = FILE_FORMAT;

// In production mode, only log info level messages
if (process.env.NODE_ENV !== "development") {
    logger.transports.file.level = "info";
}

// Fix Electron menubar icons not working in Gnome
// https://github.com/electron/electron/issues/9046#issuecomment-296169661
if (
    process.platform === "linux" &&
    process.env.XDG_CURRENT_DESKTOP &&
    process.env.XDG_CURRENT_DESKTOP.match(/gnome|unity|pantheon/i)
) {
    process.env.XDG_CURRENT_DESKTOP = "Unity";
}

const mb = setupMenubar();
const ipc = setupIPC(mb);
setupAutoLaunch(mb).catch(logger.error);
setupExpress(mb, ipc);
setupListeners(mb, ipc);
setupAutoUpdater(ipc);
