import * as extract from "extract-zip";
import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";

import axios from "axios";

// tslint:disable:non-literal-fs-path
// tslint:disable:no-any
interface AfterPackContext {
    outDir: string;
    appOutDir: string;
    packager: any;
    electronPlatformName: string;
    arch: any;
    targets: any;
}

const SWAPPERD_RELEASES_URL = "https://api.github.com/repos/renproject/swapperd/releases/latest";
const WINDOWS_SWAPPERD_FILENAME = "swapper_windows_amd64.zip";

async function downloadFile(url: string, outputFile: string) {
    console.log(`Downloading file ${url} to ${outputFile}`);
    const outPath = path.resolve(outputFile);
    const writer = fs.createWriteStream(outPath);

    const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => {
            console.log("Finished downloading.");
            resolve();
        });
        writer.on("error", reject);
    });
}

async function extractZip(zipFile: string, outputDir: string) {
    console.log(`Extracting ${zipFile} to ${outputDir}`);
    return new Promise((resolve, reject) => {
        extract(`${zipFile}`, {
            dir: outputDir
        }, (error: any) => {
            if (error) {
                reject(error);
            }
            console.log(`Finished extracting.`);
            resolve();
        });
    });
}

async function remove(filePath: string) {
    return new Promise((resolve, reject) => {
        rimraf(filePath, {}, (error: any) => {
            if (error) {
                reject(error);
            }
            console.log(`Removed: ${filePath}`);
            resolve();
        });
    });
}

// tslint:disable-next-line:no-default-export
export default async function (context: AfterPackContext) {
    const platform = context.packager.platform.nodeName;
    if (platform === "win32") {
        try {
            const postResponse = await axios({
                method: "GET",
                url: SWAPPERD_RELEASES_URL,
            });
            const data = postResponse.data;
            const downloadFileName = path.resolve(`./${WINDOWS_SWAPPERD_FILENAME}`);
            for (const asset of data.assets) {
                if (asset.name === WINDOWS_SWAPPERD_FILENAME) {
                    await downloadFile(asset.browser_download_url, downloadFileName);
                    await extractZip(downloadFileName, context.appOutDir);
                    await remove(downloadFileName);
                    return;
                }
            }
            console.error(`Failed to find a release with the name: ${WINDOWS_SWAPPERD_FILENAME}`);
        } catch (error) {
            console.error(error);
            return;
        }
    }
}

// tslint:enable:no-any
// tslint:enable:non-literal-fs-path
