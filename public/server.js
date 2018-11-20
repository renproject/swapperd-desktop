const express = require("express");
const bodyParser = require("body-parser");
const shell = require("shelljs");
const ipcMain = require("electron").ipcMain;

function local() {
    const app = express();
    app.use(bodyParser.json());
    app.post("/account", (req, res) => {
        shell.exec(`curl https://releases.republicprotocol.com/test/install.sh -sSf | sh -s testnet ${req.body.username} ${req.body.password}`, (code, stdout, stderr) => {
            if (code !== 0) {
                res.status(400);
                res.send(stderr);
            } else {
                res.status(200);
                res.send(stdout);
            }
        });
    });
    app.listen(7928);
}

function serve(socket) {
    const app = express();
    app.use(bodyParser.json());
    app.post("/swaps", (req, res) => {
        socket.send(req.body);
        res.status(201);
        res.send(req.body);
    });
    app.listen(7929);
}

module.exports = {
    Local: local,
    Serve: serve,
};