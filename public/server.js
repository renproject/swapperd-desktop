const express = require("express");
const bodyParser = require("body-parser");
const shell = require("shelljs");

function serve() {
    const app = express();
    app.use(bodyParser.json());
    app.post("/account", (req, res) => {
        shell.exec(`curl https://releases.republicprotocol.com/test/install.sh -sSf | sh -s testnet ${req.body.username} ${req.body.password}`, (code, stdout, stderr) => {
            if (code !== 0) {
                res.status(400);
                res.send(stderr);
            } else {
                res.status(200);
                res.send(stdout)
            }
        });
    });
    app.listen(7778);
}

module.exports = {
    Serve: serve,
};