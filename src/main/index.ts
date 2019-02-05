// require('fix-path')(); // resolve user $PATH env variable

// Fix Electron menubar icons not working in Gnome
// https://github.com/electron/electron/issues/9046#issuecomment-296169661
if (
    process.platform === "linux" &&
    process.env.XDG_CURRENT_DESKTOP &&
    process.env.XDG_CURRENT_DESKTOP.match(/gnome|unity|pantheon/i)
) {
    process.env.XDG_CURRENT_DESKTOP = "Unity";
}

import { setupAutoLaunch } from "./autoLaunch";
import { setupExpress } from "./express";
import { setupIPC } from "./ipc";
import { setupListeners } from "./listeners";
import { setupMenubar } from "./mb";

const mb = setupMenubar();
const ipc = setupIPC(mb);
setupAutoLaunch();
setupExpress(mb, ipc);
setupListeners(ipc);

console.log("testing");
