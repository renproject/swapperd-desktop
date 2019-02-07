import * as extract from "extract-zip";
import * as fs from "fs";
import * as path from "path";

import axios from "axios";

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

async function downloadFile(url: string, outputFile: string) {
    console.log(`Downloading file ${url} to ${outputFile}`);
    const outPath = path.resolve(outputFile);
    // tslint:disable-next-line:non-literal-fs-path
    const writer = fs.createWriteStream(outPath);

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
}

async function extractZip(zipFile: string, outputDir: string) {
    console.log(`Extracting ${zipFile} to ${outputDir}`);
    return new Promise((resolve, reject) => {
        extract(`./${zipFile}`, {
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

// tslint:disable-next-line:no-default-export
export default async function (context: AfterPackContext) {
    const platform = context.packager.platform.nodeName;
    console.log(platform);
    const outputDir = context.appOutDir;
    console.log(outputDir);
    if (platform === "win32") {
        let postResponse;
        try {
            postResponse = await axios({
                method: "GET",
                url: SWAPPERD_RELEASES_URL,
            });
            const data = postResponse.data;
            const fileName = "swapper_windows_amd64.zip";
            data.assets.forEach(async (asset: any) => {
                if (asset.name === fileName) {
                    console.log(asset.browser_download_url);
                    await downloadFile(asset.browser_download_url, `./${fileName}`);
                    await extractZip(`./${fileName}`, outputDir);
                }
            });
        } catch (error) {
            console.error(error);
            return;
        }
    }
}

// tslint:enable:no-any
