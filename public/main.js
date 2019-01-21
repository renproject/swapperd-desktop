// @ts-check

// Fix Electron menubar icons not working in Gnome
// https://github.com/electron/electron/issues/9046#issuecomment-296169661
// if (
//     process.platform === "linux" &&
//     process.env.XDG_CURRENT_DESKTOP &&
//     process.env.XDG_CURRENT_DESKTOP.match(/gnome|unity|pantheon/i)
// ) {
//     process.env.XDG_CURRENT_DESKTOP = "Unity";
// }

const {
    Menu,
    app
} = require("electron");

const {
    mb,
} = require("./js/ipc");

require("./js/express");
require("./js/listeners");


// Set app to auto-launch
app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath("exe")
});

const devMode = process.env.NODE_ENV == "development";

mb.on("ready", function ready() {
    const application = {
        label: "Application",
        submenu: [{
                label: "About",
                selector: "orderFrontStandardAboutPanel:"
            },
            {
                type: "separator"
            },
            {
                label: "Quit",
                accelerator: "Command+Q",
                click: () => {
                    mb.app.quit();
                }
            }
        ]
    };

    const edit = {
        label: "Edit",
        submenu: [{
                label: "Undo",
                accelerator: "CmdOrCtrl+Z",
                selector: "undo:"
            },
            {
                label: "Redo",
                accelerator: "Shift+CmdOrCtrl+Z",
                selector: "redo:"
            },
            {
                type: "separator"
            },
            {
                label: "Cut",
                accelerator: "CmdOrCtrl+X",
                selector: "cut:"
            },
            {
                label: "Copy",
                accelerator: "CmdOrCtrl+C",
                selector: "copy:"
            },
            {
                label: "Paste",
                accelerator: "CmdOrCtrl+V",
                selector: "paste:"
            },
            {
                label: "Select All",
                accelerator: "CmdOrCtrl+A",
                selector: "selectAll:"
            }
        ]
    };

    const template = [
        application,
        edit
    ];

    // @ts-ignore
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    // Set any anchor links to open in default web browser
    mb.window.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        require("electron").shell.openExternal(url);
    });
});

mb.on("after-create-window", function () {
    if (devMode) {
        // @ts-ignore
        mb.window.openDevTools();
        // @ts-ignore
        mb.window.openDevTools();
    }
    const contextMenu = Menu.buildFromTemplate([{
            type: "separator"
        },
        {
            label: "Quit Swapperd",
            click: () => {
                mb.app.quit();
            }
        }
    ])
    mb.tray.on("right-click", () => {
        mb.tray.popUpContextMenu(contextMenu);
    })
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