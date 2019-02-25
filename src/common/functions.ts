import * as fs from "fs";

export async function checkFileExists(pathString: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // tslint:disable-next-line:non-literal-fs-path
        fs.stat(pathString, (err, _stat) => {
            if (!err) {
                // File exists
                resolve(true);
            } else if (err.code === "ENOENT") {
                // File does not exist
                resolve(false);
            } else {
                reject(err);
            }
        });
    });
}
