import { IpcMain, IpcRenderer, WebContents } from "electron";

import { Network } from "common/types";

// tslint:disable: no-any

// import { ipcRenderer } from "electron";

export type IPCResponse<T> = [T, Error];
declare global {
    interface Window {
        ipcRenderer: IpcRenderer;
    }
}

export enum Message {
    // renderer to main
    CreateAccount = "create-account",
    Notify = "notify",
    VerifyPassword = "verify-password",
    Relaunch = "relaunch",

    // main to renderer
    GetPassword = "get-password",
    Swap = "swap",
    SwapResponse = "swap-response", // must be `${Message.Swap}-response`
    GetNetwork = "get-network",
    UpdateReady = "update-ready",
}

export type CreateAccountRequest = { mnemonic: string | null; password: string };
export type CreateAccountResponse = string;

export type NotifyRequest = { notification: string };
export type NotifyResponse = void;

export type VerifyPasswordRequest = { password: string };
export type VerifyPasswordResponse = boolean;

export type RelaunchRequest = null;
export type RelaunchResponse = void;

export type GetPasswordRequest = null;
export type GetPasswordResponse = string;

export type SwapRequest = { body: any; network: Network; origin: any };
export type SwapResponse = { status: number; response?: any };

export type GetNetworkRequest = null;
export type GetNetworkResponse = string;

export type UpdateReadyRequest = string;
export type UpdateReadyResponse = void;

export class IPC {

    private readonly self: IpcRenderer | IpcMain;
    private readonly other: () => IpcRenderer | WebContents;

    constructor(self: IpcRenderer | IpcMain, other: () => IpcRenderer | WebContents) {
        this.self = self;
        this.other = other;
    }

    public sendToMain = <T>(path: string, value: T | null, error?: Error | null) => {
        // log(`sendToMain ${path} ${JSON.stringify(value)} ${error}`);
        this.other().send(path, value, error);
    }

    // In order to use this, two routes must be defined in index.js, `${route}` and
    // `${route}-response`.
    public sendSyncWithTimeout = async <Input, Output>(route: string, seconds: number, value: Input): Promise<Output> => new Promise<Output>((resolve, reject) => {
        // log(`sendSyncWithTimeout ${route}`);

        this.once(`${route}-response`, (response: Output | null, error?: Error) => {
            // log(`sendSyncWith ${route} => (${error ? `err: ${error}` : value})`);

            if (error) {
                reject(error);
            }

            // tslint:disable-next-line: no-non-null-assertion
            resolve(response!);
        });

        this.sendToMain(route, value);

        // Reject after 1 minute
        if (seconds) {
            setTimeout(() => { reject(new Error("timeout")); }, seconds * 1000);
        }
    })

    public on = <Input, Output>(route: string, callback: (params: Input, error: Error) => Output | Promise<Output>, options?: { dontReply?: boolean }) => {
        this.self.on(route, async (_event: any, ...args: IPCResponse<Input>) => {
            // log(`handling on(${route}) with args: (${JSON.stringify(args)})`);
            let response: Output | null = null;
            try {
                const [params, error] = args;
                response = await callback(params, error);
            } catch (error) {
                console.error(error);
                this.sendToMain<Output>(`${route}-response`, response, error);
                return;
            }

            if (!options || !options.dontReply) {
                this.sendToMain(`${route}-response`, response);
            }
        });
    }

    public delayedOn = <Input>(route: string, callback: (params: Input, error: Error) => void | Promise<void>) => { this.on(route, callback, { dontReply: true }); };

    public once = <Input>(route: string, callback: (params: Input | null, error?: Error) => void | Promise<void>) => {
        this.self.once(route, async (_event: any, ...args: IPCResponse<Input>) => {
            try {
                const [params, error] = args;
                callback(params, error);
            } catch (error) {
                callback(null, error);
            }
        });
    }
}
