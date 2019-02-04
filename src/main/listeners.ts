import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import bcrypt from "bcrypt";
import notifier from "node-notifier";
import sqlite3All, { Database } from "sqlite3";

import { exec } from "child_process";

import { ipc } from "./ipc";

const sqlite3 = sqlite3All.verbose();

// import { updateSwapperd, } from "./update";

export const setupListeners = () => {
    ipc.on("create-account",
        async (value: { mnemonic: string; password: string }, _error?: Error) => new Promise(async (resolve, reject) => {
            if (_error) {
                reject("Should not have received error");
            }

            const {
                mnemonic,
                password,
                // username
            } = value;

            let mnemonicFlag = "";
            if (process.platform === "win32") {
                if (mnemonic !== "") {
                    mnemonicFlag = ` --mnemonic ${mnemonic}`;
                }
                exec(`"%programfiles(x86)%\\Swapperd\\bin\\installer.exe"${mnemonicFlag}`, (err, _stdout, _stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    exec("sc create swapperd binpath= \"%programfiles(x86)%\\Swapperd\\bin\\swapperd.exe\"", () => {
                        exec("sc start swapperd", async (error, _stdout2, _stderr2) => {
                            if (error) {
                                console.error(error);
                                reject(error);
                                return;
                            }
                            resolve(await handleAccountCreation(password));
                            return;
                        });
                    });
                });
            } else {
                try {
                    // await updateSwapperd(mnemonic);
                    resolve(await handleAccountCreation(password));
                    return;
                } catch (error) {
                    reject(error);
                }
            }
        })
    );
};

ipc.on("notify", (value: { notification: string }, _error?: Error) => {
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

ipc.on("verify-password", async (value: { password: string }, _error?: Error): Promise<boolean> => {
    if (_error) {
        throw new Error("Should not have received error");
    }

    const {
        passwordHash,
        // nonce
    } = await getPasswordHash("master");

    return bcrypt.compare(value.password, passwordHash);
});

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
    return process.platform === "win32" ? path.join(process.env["programfiles(x86)"] || "", "Swapperd") : path.join(os.homedir(), ".swapperd");
}

const connectToDB = (): Database => {
    // tslint:disable-next-line: no-bitwise
    return new sqlite3.Database(path.join(swapperdHome(), "sqlite.db"), sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(`Failed to connect to the SQLite database: ${err.message}`);
            return;
        }
        console.log("Connected to the SQLite database.");
    });
};

async function getPasswordHash(account: string) {
    let nonce, passwordHash = "";

    const db: Database = connectToDB();

    try {
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
    } catch (err) {
        console.error(err);
    }

    db.close();

    return {
        nonce,
        passwordHash
    };
}

async function handleAccountCreation(password: string) {
    // tslint:disable-next-line: non-literal-fs-path
    fs.writeFileSync(path.join(swapperdHome(), "sqlite.db"), "");

    const db: Database = connectToDB();

    db.run("CREATE TABLE IF NOT EXISTS accounts(account TEXT, passwordHash TEXT, nonce TEXT)");

    // tslint:disable-next-line: non-literal-fs-path
    const data = fs.readFileSync(path.join(swapperdHome(), "testnet.json"), {
        encoding: "utf-8"
    });

    await storePasswordHash(db, "master", password, "");

    db.close();

    return JSON.parse(data).mnemonic;
}
