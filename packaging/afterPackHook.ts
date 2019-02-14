// tslint:disable:non-literal-fs-path
// tslint:disable:no-any

import * as extract from "extract-zip";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import axios from "axios";

import { checkFileExists } from "../src/common/functions";

const SWAPPERD_RELEASES_URL = "https://api.github.com/repos/renproject/swapperd/releases/latest";
const WINDOWS_SWAPPERD_FILE = "swapper_windows_amd64";
const WINDOWS_SWAPPERD_FILE_EXT = `.zip`;
const WINDOWS_SWAPPERD_FILE_WITH_EXT = `${WINDOWS_SWAPPERD_FILE}${WINDOWS_SWAPPERD_FILE_EXT}`;

interface AfterPackContext {
    outDir: string;
    appOutDir: string;
    packager: any;
    electronPlatformName: string;
    arch: any;
    targets: any;
}

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
        extract(zipFile, {
            dir: outputDir
        }, (error) => {
            if (error) {
                reject(error);
            }
            console.log(`Finished extracting.`);
            resolve();
        });
    });
}

// tslint:disable-next-line:no-default-export
export default async function (context: AfterPackContext) {
    const platform = context.packager.platform.nodeName;
    if (platform === "win32") {
        try {
            // Prefer local windows SwapperD for test builds
            const localSwapperZip = `./${WINDOWS_SWAPPERD_FILE_WITH_EXT}`;
            if (await checkFileExists(localSwapperZip)) {
                console.log(`Found local SwapperD zip: ${path.resolve(localSwapperZip)}`);
                await extractZip(localSwapperZip, context.appOutDir);
                return;
            }

            // Local SwapperD zip does not exist so fetch it from Github
            const postResponse = await axios({
                method: "GET",
                url: SWAPPERD_RELEASES_URL,
            });
            const data = postResponse.data;
            for (const asset of data.assets) {
                if (asset.name === WINDOWS_SWAPPERD_FILE_WITH_EXT) {
                    const fileName = `${WINDOWS_SWAPPERD_FILE}_${asset.id}_${asset.node_id}${WINDOWS_SWAPPERD_FILE_EXT}`;
                    const downloadFileName = path.resolve((path.join(os.tmpdir(), fileName)));
                    if (await checkFileExists(downloadFileName)) {
                        console.log(`${downloadFileName} already exists.`);
                    } else {
                        await downloadFile(asset.browser_download_url, downloadFileName);
                    }
                    await extractZip(downloadFileName, context.appOutDir);
                    return;
                }
            }
            console.error(`Failed to find a release with the name: ${WINDOWS_SWAPPERD_FILE_WITH_EXT}`);
        } catch (error) {
            console.error(error);
            return;
        }
    }
}

// tslint:enable:no-any
// tslint:enable:non-literal-fs-path
