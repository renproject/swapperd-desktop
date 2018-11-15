const menubar = require("menubar");
const WebSocket = require("ws");
const Menu = require("electron").Menu;
const fs = require("fs");
const http = require("http");

const mb = menubar({
    tooltip: "Swapperd",
    showDockIcon: true,
});

mb.on("ready", function ready() {
    console.log("App is being served...");

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
    }

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
    }

    if (!fs.existsSync("~/.swapperd/testnet.json")) {
        http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(req.url);
            res.end();
        }).listen(7778);
    }

    const template = [
        application,
        edit
    ]

    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
});

const wss = new WebSocket.Server({
    port: 8080
});

let client = WebSocket;

wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        if (message === "connect") {
            client = ws;
        }
        client.send(message);
        mb.showWindow();
    });
});