import logger from "electron-log";

import {
  ipcMain,
} from "electron";

import { IPC } from "common/ipc";
import { MenubarApp } from "./menubar";

const devMode = process.env.NODE_ENV === "development";

// In production mode, only log info level messages
if (!devMode) {
  logger.transports.file.level = "info";
}

export const reset = "\x1b[0m";
export const dim = "\x1b[2m";
export const highlight = "\x1b[36m";
// tslint:disable-next-line: no-any
export const log = devMode ? (x: any) => {
  logger.debug(`${dim}${x}${reset}`);
} : () => null;

export const setupIPC = (mb: MenubarApp) => {

  // ipc communication
  ipcMain.on("quit", () => {
    mb.app.quit();
  });

  return new IPC(ipcMain, () => mb.window.webContents);
};
