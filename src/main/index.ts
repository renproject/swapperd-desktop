import { setupAutoLaunch } from "./autoLaunch";
import { setupAutoUpdater } from "./autoUpdater";
import { setupExpress } from "./express";
import { setupListeners } from "./listeners";
import { setupIPC } from "./mainIpc";
import { setupMenubar } from "./menubar";

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
setupAutoLaunch(mb);
setupExpress(mb, ipc);
setupListeners(mb, ipc);
setupAutoUpdater(ipc);
