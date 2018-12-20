// Fix Electron menubar icons not working in Gnome
// https://github.com/electron/electron/issues/9046#issuecomment-296169661
if (
    process.platform === "linux" &&
    process.env.XDG_CURRENT_DESKTOP &&
    process.env.XDG_CURRENT_DESKTOP.match(/gnome|unity|pantheon/i)
) {
    process.env.XDG_CURRENT_DESKTOP = "Unity";
}

const menubar = require("menubar");
const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require('child_process');
const notifier = require("node-notifier");
const fs = require("fs");
const os = require("os");
const axios = require("axios");

const {
    ipcMain,
    Menu,
    app
} = require("electron");

// Set app to auto-launch
app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath("exe")
});

const mb = menubar({
    tooltip: "Swapperd",
    preloadWindow: true,
    resizable: false,
    webPreferences: {
        nodeIntegration: false,
        preload: __dirname + "/preload.js",
    },
});

const expressApp = express();

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

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    // Set any anchor links to open in default web browser
    mb.window.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        require("electron").shell.openExternal(url);
    });
});

mb.on("after-create-window", function () {
    if (process.env.NODE_ENV == "development") {
        mb.window.openDevTools();
    }
    const contextMenu = Menu.buildFromTemplate([
        { type: "separator" },
        { label: "Quit Swapperd", click: () => { mb.app.quit(); } }
    ])
    mb.tray.on("right-click", () => {
        mb.tray.popUpContextMenu(contextMenu);
    })
});

const swapperdEndpoint = (network) => {
    if (!network) {
        network = "mainnet";
    }
    switch (network) {
        case "mainnet":
            return "http://localhost:7927";
        case "testnet":
            return "http://localhost:17927";
        default:
            throw new Error(`Invalid network query parameter: ${network}`);
    }
}

expressApp.use(bodyParser.json());
expressApp.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
expressApp.post("/swaps", (req, res) => {
    mb.showWindow();
    mb.window.webContents.send("swap", req.body, req.query.network, req.get("origin"));
    ipcMain.once("swap-response", (event, ...args) => {
        res.status(args[0]);
        res.send(args[1] === undefined ? "" : args[1]);
    });
});
expressApp.get("/*", (req, res) => {
    try {
        const swapperdUrl = `${swapperdEndpoint(req.query.network)}${req.path}`;
        console.log(`requesting: ${swapperdUrl}`);
        axios({
            method: "GET",
            url: swapperdUrl,
        }).then(postResponse => {
            res.status(200);
            res.send(postResponse.data);
        }).catch(err => {
            throw err;
        });
    } catch (error) {
        res.status(500);
        res.send(error);
    }
});
expressApp.listen(7928);

ipcMain.on("create-account", (event, ...args) => {
    let mnemonic = args[2];
    if (process.platform === "win32") {
        let mnemonicFlag = "";
        if (mnemonic !== "") {
            mnemonicFlag = ` --mnemonic ${mnemonic}`
        }
        exec(`"%programfiles(x86)%\\Swapperd\\bin\\installer.exe" --username ${args[0]} --password ${args[1]}${mnemonicFlag}`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            exec('sc create swapperd binpath= "%programfiles(x86)%\\Swapperd\\bin\\swapperd.exe"', () => {
                exec('sc start swapperd', (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    const data = fs.readFileSync(process.env["programfiles(x86)"] + "\\Swapperd\\testnet.json", {
                        encoding: "utf-8"
                    });
                    if (data) {
                        mnemonic = JSON.parse(data).config.mnemonic;
                    }
                    event.returnValue = mnemonic;
                });
            })
        })
    } else {
        exec(`curl https://releases.republicprotocol.com/test/install.sh -sSf | sh -s ${args[0]} ${args[1]} "${mnemonic}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            const data = fs.readFileSync(os.homedir() + "/.swapperd/testnet.json", {
                encoding: "utf-8"
            });
            if (data) {
                mnemonic = JSON.parse(data).config.mnemonic;
            }
            event.returnValue = mnemonic;
        });
    }
});

ipcMain.on("notify", (event, ...args) => {
    notifier.notify({
        title: "Swapperd",
        message: args[0],
        icon: __dirname + "/Icon.icns",
        wait: true,
    });
    event.returnValue = "";
})
