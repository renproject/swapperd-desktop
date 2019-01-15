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
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const axios = require("axios");
const bcrypt = require('bcrypt');

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

const devMode = process.env.NODE_ENV == "development";

const mb = menubar({
    tooltip: "Swapperd",
    preloadWindow: true,
    resizable: devMode,
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
    if (devMode) {
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
        mb.window.webContents.send("get-password")
        ipcMain.once("password", (event, ...args) => {
            if (args[0] !== "") {
                axios({
                    method: "GET",
                    url: swapperdUrl,
                    auth: {
                        username: "",
                        password,
                    },
                }).then(postResponse => {
                    res.status(200);
                    res.send(postResponse.data);
                }).catch(err => {
                    throw err;
                });
            } else {
                res.status(401);
                res.send("Wallet is locked");
            }
        });
    } catch (error) {
        res.status(500);
        res.send(error);
    }
});
expressApp.listen(7928);

ipcMain.on("create-account", (event, ...args) => {
    let mnemonic = args[2];
    let mnemonicFlag = "";
    if (process.platform === "win32") {
        if (mnemonic !== "") {
            mnemonicFlag = ` --mnemonic ${mnemonic}`
        }
        exec(`"%programfiles(x86)%\\Swapperd\\bin\\installer.exe"${mnemonicFlag}`, (err, stdout, stderr) => {
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
                    event.returnValue = handleAccountCreation(args[1]);
                });
            })
        })
    } else {
        if (mnemonic !== "") {
            mnemonicFlag = `-s "${mnemonic}"`
        }
        exec(`curl https://releases.republicprotocol.com/swapperd/install.sh -sSf | sh ${mnemonicFlag}`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            event.returnValue = handleAccountCreation(args[1]);
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

ipcMain.on("verify-password", async (event, ...args) => {
    const { passwordHash, nonce } = await getPasswordHash("master");
    bcrypt.compare(args[0], passwordHash, (err, resp) => {
        if (err) {
            console.error(err);
            return;
        }
        event.returnValue = resp;
    })
})

function uninstall() {
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

                });
            })
        })
    } else {
        exec(`curl https://releases.republicprotocol.com/swapperd/remove.sh -sSf | sh -s`, (err, stdout, stderr) => {
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
}

function storePasswordHash(db, account, password, nonce) {
    bcrypt.hash(password, 10, function(err, hash) {
        if (err) {
            console.error(err);
            return;
        }
        db.run(`INSERT INTO accounts VALUES ("${account}", "${hash}", "${nonce}")`, (result, err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(result);
        })
    });
}

function swapperdHome() {
    return process.platform === "win32" ? path.join(process.env["programfiles(x86)"], "Swapperd"): path.join(os.homedir(), ".swapperd");
}

async function getPasswordHash(account) {
    let nonce, passwordHash = "";

    const db = connectToDB();
    
    try {
        const row = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM accounts WHERE account="${account}"`, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        nonce = row.nonce;
        passwordHash = row.passwordHash;
    } catch (err) {
        console.error(err);
    }

    db.close();

    return { nonce, passwordHash };
}

function handleAccountCreation(password) {
    fs.writeFileSync(path.join(swapperdHome(), "sqlite.db"), "");

    const db = connectToDB();

    db.run('CREATE TABLE IF NOT EXISTS accounts(account TEXT, passwordHash TEXT, nonce TEXT)');

    const data = fs.readFileSync(path.join(swapperdHome(), "testnet.json"), {
        encoding: "utf-8"
    });

    storePasswordHash(db, "master", password, "");

    db.close();

    return JSON.parse(data).mnemonic
}

function connectToDB() {
    return new sqlite3.Database(path.join(swapperdHome(), "sqlite.db"), sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
        console.error(`Failed to connect to the SQLite database: ${err.message}`);
        return;
        }
        console.log('Connected to the SQLite database.');
    });
}