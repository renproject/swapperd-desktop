
import { autoUpdater, UpdateCheckResult } from "electron-updater";

// tslint:disable-next-line: no-any
export const startAutoUpdater = async (mb: any): Promise<UpdateCheckResult | null> => {

    autoUpdater.on("checking-for-update", () => {
        console.log("Checking for update...");
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
        const logMessage = `\
Download speed: ${progressObj.bytesPerSecond} \
- Downloaded ${progressObj.percent}% \
(${progressObj.transferred}/${progressObj.total})`;

        console.log(logMessage);
    });

    autoUpdater.on("update-downloaded", (_info) => {
        console.log("Update downloaded");
        // autoUpdater.quitAndInstall();

        mb.app.relaunch();
    });

    return autoUpdater.checkForUpdatesAndNotify();
};
