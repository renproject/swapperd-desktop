// tslint:disable: no-any

import { ipcRenderer } from "electron";

import { IPC } from "common/ipc";

// import { ipcRenderer } from "electron";

export type IPCResponse<T> = [T, Error];

export interface SwapResponseValue {
    body: any;
    network: any;
    origin: any;
}

// const log = process.env.NODE_ENV === "development" ? console.log : () => null;

export const ipc = new IPC(ipcRenderer, () => ipcRenderer);
