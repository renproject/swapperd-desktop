import * as express from "express";
import * as bodyParser from "body-parser";

/**
 * @type {import("axios").default}
 */
// @ts-ignore
import axios from "axios";

import {
    mb,
    sendSyncWithTimeout,
    log,
    highlight,
    reset,
    dim,
} from "./ipc";


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

expressApp.get("/network", async (req, res) => {
    const network = await sendSyncWithTimeout("get-network", 10, null);
    res.status(200);
    res.send(network);
});

expressApp.get("/version", async (req, res) => {
    const version = await sendSyncWithTimeout("get-version", 10, null);
    res.status(200);
    res.send(version);
});

expressApp.post("/swaps", async (req, res) => {
    log(`${highlight}expressApp${reset}${dim}: ${req.url}`);

    mb.showWindow();

    const response = await sendSyncWithTimeout("swap", 0, {
        body: req.body,
        network: req.query.network,
        origin: req.get("origin")
    });

    res.status(response.status);
    res.send(response.response === undefined ? "" : response.response);
});

expressApp.get("/*", async (req, res) => {
    log(`${highlight}expressApp${reset}${dim}: ${req.url}`);

    const swapperdUrl = `${swapperdEndpoint(req.query.network)}${req.path}`;

    let password;
    try {
        password = await sendSyncWithTimeout("get-password", 10, null);
    } catch (err) {
        res.status(401);
        res.send("Wallet is locked");
        return;
    }

    let postResponse;
    try {
        postResponse = await axios({
            method: "GET",
            url: swapperdUrl,
            auth: {
                username: "",
                password,
            },
        })
    } catch (error) {
        if (error.response) {
            res.status(error.response.status);
            res.send(error.response.data);
        } else {
            res.status(502);
            res.send(error.toString());
        }
        return;
    }

    res.status(200);
    res.send(postResponse.data);
});

expressApp.listen(7928);