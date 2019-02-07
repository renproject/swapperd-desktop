
export enum Network {
    Mainnet = "mainnet",
    Testnet = "testnet",
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
    _SwapResponse = "swap-response",
    GetNetwork = "get-network",
    UpdateReady = "update-ready",
}

export type ResponseType<X extends Message> =
    X extends Message.CreateAccount ? string :
    X extends Message.Notify ? void :
    X extends Message.VerifyPassword ? boolean :
    X extends Message.Relaunch ? void :
    X extends Message.GetPassword ? string :
    // tslint:disable-next-line: no-any
    X extends Message.Swap ? { status: number; response?: any } :
    X extends Message.GetNetwork ? string :
    X extends Message.UpdateReady ? void :
    never;

export type RequestType<X extends Message> =
    X extends Message.CreateAccount ? { mnemonic: string | null; password: string } :
    X extends Message.Notify ? { notification: string } :
    X extends Message.VerifyPassword ? { password: string } :
    X extends Message.Relaunch ? null :
    X extends Message.GetPassword ? null :
    // tslint:disable-next-line: no-any
    X extends Message.Swap ? { body: any; network: Network; origin: any } :
    X extends Message._SwapResponse ? ResponseType<Message.Swap> :
    X extends Message.GetNetwork ? null :
    X extends Message.UpdateReady ? string :
    never;
