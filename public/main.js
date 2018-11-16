const menubar = require("menubar");
const WebSocket = require("ws");
const Menu = require("electron").Menu;
const fs = require("fs");
const server = require("./server.js");

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

    const template = [
        application,
        edit
    ]

    Menu.setApplicationMenu(Menu.buildFromTemplate(template))

    /* fs.access("~/.swapperd/testnet.json", fs.constants.F_OK, (err) => {
        if (err) {
            serve();            
        }
    }); */

    server.Serve();
});

const wss = new WebSocket.Server({
    port: 8080
});

const wss2 = new WebSocket.Server({
    port: 8081
})

let client = WebSocket;
let client2 = WebSocket;

wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        if (message === "connect") {
            client = ws;
        }
        client.send(message);
        mb.showWindow();
    });
});

wss2.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        if (message === "connect") {
            client2 = ws;
        }
        client2.send(message);
    })
})