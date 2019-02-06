import * as bodyParser from "body-parser";
import express from "express";

import axios from "axios";

import { MenubarApp } from "./menubar";

import {
    dim,
    highlight,
    log,
    reset,
} from "./mainIpc";

import { IPC } from "common/ipc";

const swapperdEndpoint = (networkIn: string) => {
    const network = networkIn || "mainnet";
    switch (network) {
        case "mainnet":
            return "http://localhost:7927";
        case "testnet":
            return "http://localhost:17927";
        default:
            throw new Error(`Invalid network query parameter: ${network}`);
    }
};

export const setupExpress = (mb: MenubarApp, ipc: IPC) => {
    const expressApp = express();

    expressApp.use(bodyParser.json());
    expressApp.use((_req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    expressApp.get("/network", async (_req, res) => {
        const network = await ipc.sendSyncWithTimeout("get-network", 10, null);
        res.status(200);
        res.send(network);
    });

    expressApp.get("/version", async (_req, res) => {
        const version = await ipc.sendSyncWithTimeout("get-version", 10, null);
        res.status(200);
        res.send(version);
    });

    expressApp.post("/swaps", async (req, res) => {
        log(`${highlight}expressApp${reset}${dim}: ${req.url}`);

        mb.showWindow();

        // tslint:disable-next-line: no-any
        const response: any = await ipc.sendSyncWithTimeout("swap", 0, {
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

        let password: string;
        try {
            password = await ipc.sendSyncWithTimeout("get-password", 10, null);
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
            });
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
};
