const {
    exec
} = require('child_process');
const notifier = require("node-notifier");
const fs = require("fs");
const os = require("os");
const path = require("path");
const sqlite3 = require('sqlite3').verbose();

const bcrypt = require('bcrypt');

const {
    on,
} = require("./ipc");

const {
    updateSwapperd,
} = require("./update");


on("create-account",
    /**
     * @param {any} value
     * @param {Error} error
     */
    (value, _error) => new Promise(async (resolve, reject) => {
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
                mnemonicFlag = ` --mnemonic ${mnemonic}`
            }
            exec(`"%programfiles(x86)%\\Swapperd\\bin\\installer.exe"${mnemonicFlag}`, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                exec('sc create swapperd binpath= "%programfiles(x86)%\\Swapperd\\bin\\swapperd.exe"', () => {
                    exec('sc start swapperd', async (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            return reject(err);
                        }
                        return resolve(await handleAccountCreation(password));
                    });
                })
            })
        } else {
            try {
                // await updateSwapperd(mnemonic);
                return resolve(await handleAccountCreation(password));
            } catch (error) {
                reject(error);
            }
        }
    })
);


on("notify", (value, _error) => {
    if (_error) {
        throw new Error("Should not have received error");
    }

    notifier.notify({
        title: "Swapperd",
        message: value.notification,
        icon: __dirname + "/Icon.icns",
        wait: true,
    });
    return;
})

on("verify-password", async (value, _error) => {
    if (_error) {
        throw new Error("Should not have received error");
    }

    const {
        passwordHash,
        nonce
    } = await getPasswordHash("master");

    return await bcrypt.compare(value.password, passwordHash);
})


async function storePasswordHash(db, account, password, nonce) {
    const hash = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO accounts VALUES ("${account}", "${hash}", "${nonce}")`, (result, err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

function swapperdHome() {
    return process.platform === "win32" ? path.join(process.env["programfiles(x86)"], "Swapperd") : path.join(os.homedir(), ".swapperd");
}

async function getPasswordHash(account) {
    let nonce, passwordHash = "";

    const db = connectToDB();

    try {
        const row = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM accounts WHERE account="${account}"`, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
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

async function handleAccountCreation(password) {
    fs.writeFileSync(path.join(swapperdHome(), "sqlite.db"), "");

    const db = connectToDB();

    db.run('CREATE TABLE IF NOT EXISTS accounts(account TEXT, passwordHash TEXT, nonce TEXT)');

    const data = fs.readFileSync(path.join(swapperdHome(), "testnet.json"), {
        encoding: "utf-8"
    });

    await storePasswordHash(db, "master", password, "");

    db.close();

    return JSON.parse(data).mnemonic
}

function connectToDB() {
    return new sqlite3.Database(path.join(swapperdHome(), "sqlite.db"), sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(`Failed to connect to the SQLite database: ${err.message}`);
            return;
        }
        console.log('Connected to the SQLite database.');
    });
}