const express = require("express");
const bodyParser = require("body-parser");

/**
 * @type {import("axios").default}
 */
// @ts-ignore
const axios = require("axios");

const {
    mb,
    sendSyncWithTimeout,
} = require("./ipc");


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


const expressApp = express();

expressApp.use(bodyParser.json());
expressApp.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

expressApp.post("/network", async (req, res) => {
    const network = await sendSyncWithTimeout("get-network", 10, null);
    res.status(200);
    res.send(network);
});

expressApp.post("/swaps", async (req, res) => {
    console.log(`expressApp: ${req.url}`);

    mb.showWindow();

    const response = await sendSyncWithTimeout("swap", 0, {
        body: req.body,
        network: req.query.network,
        origin: req.get("origin")
    });

    res.status(response.status);
    res.send(response.body === undefined ? "" : response.body);
});

expressApp.get("/*", async (req, res) => {
    console.log(`expressApp: ${req.url}`);

    const swapperdUrl = `${swapperdEndpoint(req.query.network)}${req.path}`;

    let password;
    try {
        password = await sendSyncWithTimeout("get-password", 10, null);
    } catch (err) {
        res.status(401);
        res.send("Wallet is locked");
        return;
    }

    const postResponse = await axios({
        method: "GET",
        url: swapperdUrl,
        auth: {
            username: "",
            password,
        },
    })

    res.status(200);
    res.send(postResponse.data);
});

expressApp.listen(7928);