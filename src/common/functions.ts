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

export const rawError = (errorObject: Error) => {
    // https://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json/11616993#11616993

    // Note: cache should not be re-used by repeated calls to JSON.stringify.
    // tslint:disable-next-line:no-any
    let cache: any[] | null = [];
    const rawErrorJSON = JSON.stringify(errorObject, (key, value) => {
        if (key === "request") {
            return "... omitted";
        }
        if (cache && typeof value === "object" && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Duplicate reference found
                try {
                    // If this value does not reference a parent it can be deduped
                    return JSON.parse(JSON.stringify(value));
                } catch (error) {
                    // discard key if value cannot be deduped
                    return;
                }
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    });
    cache = null; // Enable garbage collection

    return rawErrorJSON;
};
