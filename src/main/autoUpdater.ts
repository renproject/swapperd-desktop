import * as path from "path";
import * as sudo from "sudo-prompt";

import { exec } from "child_process";
import { app } from "electron";
import { autoUpdater, UpdateCheckResult } from "electron-updater";

// import { GetPasswordRequest, GetPasswordResponse, IPC, Message } from "common/ipc";
import { IPC } from "common/ipc";
import { Message } from "common/types";

//////////////////////////////// Swapperd Daemon ///////////////////////////////

const run = async (command: string) => new Promise((resolve, reject) => {
    const cmd = exec(command, (error) => {
        if (error) {
            reject(error);
        }
        resolve();
    });

    // cmd.stdout.pipe(process.stdout);
    // cmd.stderr.pipe(process.stderr);

    cmd.stdout.on("data", (data) => {
        console.log(data);
    });

    cmd.stderr.on("data", (data) => {
        console.error(data);
    });
});

export const installOrUpdateSwapperd = async (mnemonic: string | null): Promise<void> => {
    let mnemonicFlag = "";
    switch (process.platform) {
        case "win32":
            if (mnemonic) {
                mnemonicFlag = `--mnemonic ${mnemonic}`;
            }

            const installerPath = path.join(path.dirname(app.getPath("exe")), "bin", "installer.exe");
            const options = {
                name: "SwapperD Desktop",
            };
            sudo.exec(
                `"${installerPath}" ${mnemonicFlag}`,
                options,
                // tslint:disable-next-line:no-any
                (error: any, _stdout: any, _stderr: any) => {
                    if (error) {
                        throw error;
                    }
                }
            );
            return;
        default:
            if (mnemonic) {
                mnemonicFlag = `-s "${mnemonic}"`;
            }
            await run(`curl https://releases.republicprotocol.com/swapperd/install.sh -sSf | sh ${mnemonicFlag}`);
            return;
    }
};

/////////////////////////////// Swapperd Desktop ///////////////////////////////

export const checkForUpdates = async (_ipc: IPC): Promise<UpdateCheckResult | null> => {

    const [resultPromise] = await Promise.all([
        // installOrUpdateSwapperd(null),
        autoUpdater.checkForUpdatesAndNotify(),
    ]);

    // try {
    //     await ipc.sendSyncWithTimeout<GetPasswordRequest, GetPasswordResponse>(Message.GetPassword, 10, null);
    // } catch (err) {
    //     throw new Error("Can't update until password is unlocked");
    // }

    return resultPromise;
};

// tslint:disable-next-line: no-any
export const setupAutoUpdater = (ipc: IPC) => {

    autoUpdater.on("checking-for-update", () => {
        console.log("Checking for updates...");
    });

    autoUpdater.on("update-available", (_info) => {
        console.log("Update available.");
    });

    autoUpdater.on("update-not-available", (_info) => {
        console.log("Update not available.");
    });

    autoUpdater.on("error", (err: Error) => {
        console.log(`Error in auto-updater: ${err}`);
    });

    autoUpdater.on("download-progress", (progressObj) => {
        console.log(`\
Download speed: ${progressObj.bytesPerSecond} \
- Downloaded ${progressObj.percent}% \
(${progressObj.transferred}/${progressObj.total})`);
    });

    autoUpdater.on("update-downloaded", (_info) => {
        console.log("Update downloaded");

        /**
         * Code to restart automatically:
         * `autoUpdater.quitAndInstall();` doesn't seem to work on Linux
         * `mb.app.relaunch();` not tested
         */

        const newVersion = "";

        ipc.sendMessage(Message.UpdateReady, newVersion);
    });

    const interval = async () => {
        let timeout = 1 * 60 * 1000;
        try {
            await checkForUpdates(ipc);
            timeout = 60 * 60 * 1000;
        } catch (err) {
            console.error(err);
        }

        setTimeout(async () => interval().catch(console.error), timeout);
    };

    interval().catch(console.error);
};
