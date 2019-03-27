import logger from "electron-log";

import { exec } from "child_process";
import { autoUpdater, UpdateCheckResult } from "electron-updater";

// import { GetPasswordRequest, GetPasswordResponse, IPC, Message } from "common/ipc";
import { getLatestReleaseVersion, getLatestAsset } from "common/gitReleases";
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
        logger.info(data);
    });

    cmd.stderr.on("data", (data) => {
        logger.error(data);
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
                // Sometimes the percentage jumps to 100% straight away so ignore it if that happens
                if (percent === 100 && last === 0) {
                    return;
                }
                ipc.sendMessage(Message.InstallProgress, percent);
                last = percent;
            }
        }
    };

    if (process.platform !== "win32") {
        const asset = await getLatestAsset("install.sh");
        logger.info(`Running install.sh from: ${asset.browser_download_url}`);
        return run(`curl ${asset.browser_download_url} -sSLf | sh`, onErr);
    }
};

/////////////////////////////// Swapperd Daemon ////////////////////////////////

export const checkForSwapperdUpdates = async (ipc: IPC): Promise<void> => {
    const version = await getLatestReleaseVersion();
    logger.info(`Latest SwapperD version is: ${version}`);
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
        logger.info("Checking for updates...");
    });

    autoUpdater.on("update-available", (_info) => {
        logger.info("Update available.");
    });

    autoUpdater.on("update-not-available", (_info) => {
        logger.info("Update not available.");
    });

    autoUpdater.on("error", (err: Error) => {
        logger.info(`Error in auto-updater: ${err}`);
    });

    autoUpdater.on("download-progress", (progressObj) => {
        logger.info(`\
Download speed: ${progressObj.bytesPerSecond} \
- Downloaded ${progressObj.percent}% \
(${progressObj.transferred}/${progressObj.total})`);
    });

    autoUpdater.on("update-downloaded", (_info) => {
        logger.info("Update downloaded");

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
            logger.error(err);
        }

        setTimeout(async () => interval().catch(logger.error), timeout);
    };

    interval().catch(logger.error);
};
