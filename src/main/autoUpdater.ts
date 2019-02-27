import { exec } from "child_process";
import { autoUpdater, UpdateCheckResult } from "electron-updater";

// import { GetPasswordRequest, GetPasswordResponse, IPC, Message } from "common/ipc";
import { getLatestReleaseVersion } from "common/gitReleases";
import { IPC } from "common/ipc";
import { Message } from "common/types";

//////////////////////////////// Swapperd Daemon ///////////////////////////////

const run = async (command: string, onErr?: (data: string) => void) => new Promise((resolve, reject) => {
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
        if (onErr) {
            onErr(data);
        }
    });
});

export const installSwapperd = async (ipc: IPC): Promise<void | {}> => {
    let last = 0;
    const onErr = (data: string) => {
        const match = data.match(/^#*\s*(\d+(.\d)?)%$/);
        if (match && match.length > 1) {
            const percent = parseFloat(match[1]);
            if (!isNaN(percent) && percent > last) {
                ipc.sendMessage(Message.InstallProgress, percent);
                last = percent;
            }
        }
    };

    if (process.platform !== "win32") {
        return run(`curl https://git.io/test-swapperd -sSLf | sh`, onErr);
    }
};

/////////////////////////////// Swapperd Daemon ////////////////////////////////

export const checkForSwapperdUpdates = async (ipc: IPC): Promise<void> => {
    const version = await getLatestReleaseVersion();
    await ipc.sendSyncWithTimeout(Message.LatestSwapperdVersion, 5, version);
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
        // Update check is every two minutes until it actually succeeds
        let timeout = 2 * 60 * 1000;
        try {
            await checkForUpdates(ipc);
            await checkForSwapperdUpdates(ipc);
            // The update check succeeded so don't check again for another hour
            timeout = 60 * 60 * 1000;
        } catch (err) {
            console.error(err);
        }

        setTimeout(async () => interval().catch(console.error), timeout);
    };

    interval().catch(console.error);
};
