const menubar = require("menubar");
const express = require("express");
const bodyParser = require("body-parser");
const shell = require("shelljs");
const notifier = require("node-notifier");
const fs = require("fs");
const os = require("os");

const { ipcMain, Menu } = require("electron");

const mb = menubar({
    tooltip: "Swapperd",
    showDockIcon: true, // TODO: Remove this
    preloadWindow: true,
    webPreferences: {
        nodeIntegration: false,
        preload: __dirname + "/preload.js",
    },
});
const app = express();

mb.on("ready", function ready() {
    const application = {
        label: "Application",
        submenu: [
            {
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
                    app.quit()
                }
            }
        ]
    };

    const edit = {
        label: "Edit",
        submenu: [
            {
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
});

mb.on("after-create-window", () => {
    mb.window.openDevTools();
});

app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.post("/swaps", (req, res) => {
    mb.showWindow();
    mb.window.webContents.send("swap", req.body);
    ipcMain.once("swap-response", (event, ...args) => {
        res.status(args[0]);
        res.send(args[1]);
    });
});
app.listen(7928);

ipcMain.on("create-account", (event, ...args) => {
    shell.exec(`curl https://releases.republicprotocol.com/test/install.sh -sSf | sh -s testnet ${args[0]} ${args[1]} "${args[2]}"`, (code, stdout, stderr) => {
        let mnemonic = "";
        if (code === 0) {
            const data = fs.readFileSync(os.homedir() + "/.swapperd/testnet.json", { encoding: "utf-8" });
            if (data) {
                mnemonic = JSON.parse(data).config.mnemonic;
            }
        }
        event.returnValue = mnemonic;
    });
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