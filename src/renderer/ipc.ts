import { ipcRenderer } from "electron";

export type IPCResponse<T> = [T, Error];

export interface SwapResponseValue {
    body: any,
    network: any,
    origin: any,
}

const log = process.env.NODE_ENV === "development" ? console.log : () => null;

export function sendToMain<T>(path: string, value: T | null, error?: Error | null) {
    // log(`sendToMain ${path} ${JSON.stringify(value)} ${error}`);
    ipcRenderer.send(path, value, error);
}

// In order to use this, two routes must be defined in main.js, `${route}` and
// `${route}-response`.
export const sendSyncWithTimeout = async <Input, Output>(route: string, seconds: number, value: Input): Promise<Output> => new Promise<Output>((resolve, reject) => {
    // log(`sendSyncWithTimeout ${route}`);

    once(`${route}-response`, (response: Output | null, error?: Error) => {
        log(`sendSyncWith ${route} => (${error ? `err: ${error}` : value})`);

        if (error) {
            reject(error);
        }

        resolve(response!);
    });

    sendToMain(route, value);

    // Reject after 1 minute
    setTimeout(() => reject(new Error("timeout")), seconds * 1000);
});


export const on = <Input, Output>(route: string, callback: (params: Input, error: Error) => Output | Promise<Output>, dontReply?: boolean) => {
    ipcRenderer.on(route, async (event: any, ...args: IPCResponse<Input>) => {
        log(`handling on(${route}) with args: (${JSON.stringify(args)})`);
        let response: Output | null = null;
        try {
            const [params, error] = args;
            response = await callback(params, error);
        } catch (error) {
            console.error(error);
            sendToMain<Output>(`${route}-response`, response, error);
            return;
        }

        if (!dontReply) {
            sendToMain(`${route}-response`, response);
        }
    });
}

export const once = <Input>(route: string, callback: (params: Input | null, error?: Error) => void | Promise<void>) => {
    ipcRenderer.once(route, async (event: any, ...args: IPCResponse<Input>) => {
        try {
            const [params, error] = args;
            callback(params, error);
        } catch (error) {
            callback(null, error);
        }
    });
}