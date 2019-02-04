import {
  ipcMain,
} from "electron";

import { startAutoUpdater } from "./autoUpdater";

import { mb } from "./mb";

import { IPC } from "../common/ipc";

// const menubar = require('menubar');

// require('fix-path')(); // resolve user $PATH env variable

const devMode = process.env.NODE_ENV === "development";

// if (devMode) {
//   require('electron-debug')({
//     showDevTools: true
//   });
// }

const installExtensions = async () => {
  if (process.env.NODE_ENV === "development") {
    // tslint:disable-next-line: no-require-imports
    const installer = require("electron-devtools-installer");

    const extensions = ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;

    return Promise.all(
      extensions.map(name => installer.default(installer[name],
        forceDownload)),
    ).catch(console.log);
  }
};

export const reset = "\x1b[0m";
export const dim = "\x1b[2m";
export const highlight = "\x1b[36m";
// tslint:disable-next-line: no-any
export const log = devMode ? (x: any) => {
  process.stdout.write(`[debug] ${dim}`);
  process.stdout.write(x);
  process.stdout.write(`${reset}\n`);
} : () => null;

mb.on("ready", async () => {
  await installExtensions();

  console.log("app is ready");
});

// // Quit when all windows are closed.
// mb.app.on('window-all-closed', () => {
//   // On OS X it is common for applications and their menu bar
//   // to stay active until the user quits explicitly with Cmd + Q
//   if (process.platform !== 'darwin') {
//     mb.app.quit();
//   }
// });

// ipc communication
ipcMain.on("quit", () => {
  mb.app.quit();
});

mb.app.on("ready", async () => {
  await startAutoUpdater(mb);
});

export const ipc = new IPC(ipcMain, () => mb.window.webContents);
