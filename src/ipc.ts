export type IPCResponse<T> = [T, Error];

export interface SwapResponseValue {
    body: any,
    network: any,
    origin: any,
}


export function sendToMain<T>(path: string, value: T | null, error?: Error | null) {
    console.log(`sendToMain ${path} ${JSON.stringify(value)} ${error}`);

    (window as any).ipcRenderer.send(path, value, error);
}

// In order to use this, two routes must be defined in main.js, `${route}` and
// `${route}-response`.
export const sendSyncWithTimeout = async <Input, Output>(route: string, seconds: number, value: Input): Promise<Output> => new Promise<Output>((resolve, reject) => {
    console.log(`sendSyncWithTimeout ${route}`);

    once(`${route}-response`, (response: Output, error: Error) => {
        if (error) {
            reject(error);
        }

        resolve(response);
    });

    sendToMain(route, value);

    // Reject after 1 minute
    setTimeout(() => reject(new Error("timeout")), seconds * 1000);
});


export const on = <Input, Output>(route: string, callback: (params: Input, error: Error) => Output | Promise<Output>, dontReply?: boolean) => {
    (window as any).ipcRenderer.on(route, async (event: any, ...args: IPCResponse<Input>) => {
        console.log(`handling on ${route}`);
        let response: Output | null = null;
        try {
            const [params, error] = args;
            response = await callback(params, error);
        } catch (error) {
            sendToMain<Output>(`${route}-response`, response, error);
            return;
        }

        if (!dontReply) {
            sendToMain(`${route}-response`, response);
        }
    });
}

export const once = <Input>(route: string, callback: (params: Input | null, error?: Error) => void | Promise<void>) => {
    (window as any).ipcRenderer.once(route, async (event: any, ...args: IPCResponse<Input>) => {
        console.log(`handling once ${route}`);
        try {
            const [params, error] = args;
            callback(params, error);
        } catch (error) {
            callback(null, error);
        }
    });
}