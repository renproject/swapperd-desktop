
// Fix Electron menubar icons not working in Gnome
// https://github.com/electron/electron/issues/9046#issuecomment-296169661
if (
    process.platform === "linux" &&
    process.env.XDG_CURRENT_DESKTOP &&
    process.env.XDG_CURRENT_DESKTOP.match(/gnome|unity|pantheon/i)
) {
    process.env.XDG_CURRENT_DESKTOP = "Unity";
}

import {
    Menu,
    shell,
} from "electron";

import { mb } from "./mb";

import { contextTemplate, template } from "./appMenu";

import { setupAutoLaunch } from "./autoLaunch";
import { setupExpress } from "./express";
import { setupListeners } from "./listeners";

setupAutoLaunch();
setupExpress();
setupListeners();

const devMode = process.env.NODE_ENV === "development";

mb.on("ready", () => {
    // @ts-ignore
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    // Set any anchor links to open in default web browser
    // tslint:disable-next-line: no-any
    mb.window.webContents.on("new-window", (event: any, url: string) => {
        event.preventDefault();
        shell.openExternal(url);
    });
});

mb.on("after-create-window", () => {
    if (devMode) {
        // @ts-ignore
        mb.window.openDevTools();
    }
    const contextMenu = Menu.buildFromTemplate(contextTemplate);
    mb.tray.on("right-click", () => {
        mb.tray.popUpContextMenu(contextMenu);
    });
});

// function uninstall() {
//     if (process.platform === "win32") {
//         let mnemonicFlag = "";
//         if (mnemonic !== "") {
//             mnemonicFlag = ` --mnemonic ${mnemonic}`
//         }
//         exec(`"%programfiles(x86)%\\Swapperd\\bin\\installer.exe" --username ${args[0]} --password ${args[1]}${mnemonicFlag}`, (err, stdout, stderr) => {
//             if (err) {
//                 console.error(err);
//                 return;
//             }
//             exec('sc create swapperd binpath= "%programfiles(x86)%\\Swapperd\\bin\\swapperd.exe"', () => {
//                 exec('sc start swapperd', (err, stdout, stderr) => {
//                     if (err) {
//                         console.error(err);
//                         return;
//                     }

//                 });
//             })
//         })
//     } else {
//         exec(`curl https://releases.republicprotocol.com/swapperd/remove.sh -sSf | sh -s`, (err, stdout, stderr) => {
//             if (err) {
//                 console.error(err);
//                 return;
//             }
//             const data = fs.readFileSync(os.homedir() + "/.swapperd/testnet.json", {
//                 encoding: "utf-8"
//             });
//             if (data) {
//                 mnemonic = JSON.parse(data).config.mnemonic;
//             }
//             event.returnValue = mnemonic;
//         });
//     }
// }
