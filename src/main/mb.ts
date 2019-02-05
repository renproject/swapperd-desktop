import * as path from "path";

import {
    app,
    Menu,
    shell,
} from "electron";
import menubar from "menubar";

import { format as formatUrl } from "url";

import { getMenuTemplate } from "./appMenu";

import { startAutoUpdater } from "./autoUpdater";

const devMode = process.env.NODE_ENV === "development";

export type MenubarApp = ReturnType<typeof menubar>;

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

const icon = "resources/IconTemplate.png";

export const setupMenubar = () => {

    const mb = menubar({
        tooltip: "Swapperd",
        preloadWindow: true,
        resizable: devMode,
        webPreferences: {
            // nodeIntegration: false,
            // preload: `${app.getAppPath()}/dist/main/preload.js`,
            webSecurity: false,
        },
        alwaysOnTop: process.env.NODE_ENV === "development",
        icon: devMode ? icon : path.join(app.getAppPath(), icon),
        index: devMode ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}` : formatUrl({
            pathname: path.join(__dirname, "index.html"),
            protocol: "file",
            slashes: true
        }),

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

    mb.on("ready", async () => {
        const [, template] = getMenuTemplate(mb);

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));

        // Set any anchor links to open in default web browser
        // tslint:disable-next-line: no-any
        mb.window.webContents.on("new-window", (event: any, url: string) => {
            event.preventDefault();
            shell.openExternal(url);
        });

        await startAutoUpdater(mb);

        await installExtensions();

        console.log("app is ready");
    });

    mb.on("after-create-window", () => {
        if (devMode) {
            // @ts-ignore
            mb.window.openDevTools();
            // @ts-ignore
            mb.window.openDevTools();
        }

        // tslint:disable-next-line: whitespace
        const [contextTemplate,] = getMenuTemplate(mb);

        const contextMenu = Menu.buildFromTemplate(contextTemplate);
        mb.tray.on("right-click", () => {
            mb.tray.popUpContextMenu(contextMenu);
        });
    });

    // // Quit when all windows are closed.
    // mb.app.on('window-all-closed', () => {
    //   // On OS X it is common for applications and their menu bar
    //   // to stay active until the user quits explicitly with Cmd + Q
    //   if (process.platform !== 'darwin') {
    //     mb.app.quit();
    //   }
    // });

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

    return mb;
};
