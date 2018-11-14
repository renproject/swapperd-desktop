const menubar = require("menubar");
const WebSocket = require("ws");

const mb = menubar({
    tooltip: "Swapperd",
    showDockIcon: true,
});

mb.on("ready", function ready() {
    console.log("App is being served...");
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