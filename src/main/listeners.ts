import * as fs from "fs";
import * as path from "path";

import bcrypt from "bcryptjs";
import notifier from "node-notifier";
import sqlite3All, { Database } from "sqlite3";

import { app } from "electron";

import { checkFileExists } from "common/functions";
import { IPC, } from "common/ipc";
import { Message } from "common/types";

import { installSwapperd } from "./autoUpdater";
import { MenubarApp } from "./menubar";

const sqlite3 = sqlite3All.verbose();

const DEFAULT_ACCOUNT = "master";

export const setupListeners = (mb: MenubarApp, ipc: IPC) => {
    ipc.on(Message.CheckSetup, async (_value, _error?: Error) => {
        // Check if the sqlite database has been initialised successfully
        if (_error) {
            throw new Error("Should not have received error");
        }
        try {
            await getPasswordHash(DEFAULT_ACCOUNT);
            return true;
        } catch (err) {
            return false;
        }
    });

    ipc.on(Message.CreateAccount, async (value, _error?: Error) => {
        if (_error) {
            throw new Error("Should not have received error");
        }

        const {
            mnemonic,
            password,
            // username
        } = value;

        try {
            await installSwapperd();
            // Update the mnemonic if it's not null
            if (mnemonic) {
                await updateMnemonic(mnemonic);
            }
            return await handleAccountCreation(password);
        } catch (err) {
            console.error(err);
            return "";
        }
    });

    ipc.on(Message.Notify, (value, _error?: Error) => {
        if (_error) {
            throw new Error("Should not have received error");
        }

        notifier.notify({
            title: "Swapperd",
            message: value.notification,
            icon: `${__dirname}/Icon.icns`,
            wait: true,
        });
        return;
    });

    ipc.on(Message.VerifyPassword, async (value, _error?: Error) => {
        if (_error) {
            throw new Error("Should not have received error");
        }

        try {
            const {
                passwordHash,
                // nonce
            } = await getPasswordHash(DEFAULT_ACCOUNT);

            return bcrypt.compare(value.password, passwordHash);
        } catch (err) {
            // getPasswordHash will throw an error if it couldn't access the sqlite database
            // or if it could not retrieve the requested value
            console.error(err);
            throw new Error("Failed to verify password");
        }
    });

    ipc.on(Message.Relaunch, (_value, _error?: Error) => {
        mb.app.relaunch();
    });
};

async function storePasswordHash(db: Database, account: string, password: string, nonce: string) {
    const hash = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO accounts VALUES ("${account}", "${hash}", "${nonce}")`, (_result: unknown, err: Error) => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

function swapperdHome() {
    switch (process.platform) {
        case "win32":
            return path.resolve(path.dirname(app.getPath("exe")));
        default:
            return path.join(app.getPath("home"), ".swapperd");
    }
}

async function connectToDB(): Promise<Database> {
    return new Promise((resolve, reject) => {
        let db: Database;
        // tslint:disable-next-line: no-bitwise
        db = new sqlite3.Database(path.join(swapperdHome(), "sqlite.db"), sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                reject(err);
            }
            resolve(db);
        });
    });
}

async function getPasswordHash(account: string) {
    let nonce, passwordHash = "";

    const db: Database = await connectToDB();

    // tslint:disable-next-line: no-any
    const row: any = await new Promise((resolve, reject) => {
        // tslint:disable-next-line: no-any
        db.get(`SELECT * FROM accounts WHERE account="${account}"`, (err: Error, innerRow: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(innerRow);
            }
        });
    });
    // FIXME: row may be undefined
    nonce = row.nonce;
    passwordHash = row.passwordHash;

    db.close();

    return {
        nonce,
        passwordHash
    };
}

async function handleAccountCreation(password: string): Promise<string> {
    // tslint:disable-next-line: non-literal-fs-path
    fs.writeFileSync(path.join(swapperdHome(), "sqlite.db"), "");

    const db: Database = await connectToDB();

    db.run("CREATE TABLE IF NOT EXISTS accounts(account TEXT, passwordHash TEXT, nonce TEXT)");

    // tslint:disable-next-line: non-literal-fs-path
    const data = fs.readFileSync(path.join(swapperdHome(), "testnet.json"), {
        encoding: "utf-8"
    });

    await storePasswordHash(db, DEFAULT_ACCOUNT, password, "");

    db.close();

    return JSON.parse(data).mnemonic;
}

async function updateMnemonic(mnemonic: string): Promise<void> {
    const testnetJSON = path.join(swapperdHome(), "testnet.json");
    const mainnetJSON = path.join(swapperdHome(), "mainnet.json");
    for (const file of [testnetJSON, mainnetJSON]) {
        if (await checkFileExists(file)) {
            await updateMnemonicJsonFile(mnemonic || "", file);
        } else {
            console.error(`Could not find file: ${file}`);
        }
    }
}

// tslint:disable:non-literal-fs-path
async function updateMnemonicJsonFile(mnemonic: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, {
            encoding: "utf-8"
        }, (rerr, data) => {
            if (rerr) {
                reject(rerr);
            }
            const file = JSON.parse(data);
            file.mnemonic = mnemonic;
            fs.writeFile(filePath, JSON.stringify(file), (werr) => {
                if (werr) {
                    reject(werr);
                }
                resolve();
            });
        });
    });
}
// tslint:enable:non-literal-fs-path
