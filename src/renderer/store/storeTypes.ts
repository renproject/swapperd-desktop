import { Network } from "common/types";

export interface ApplicationData {
    app: AppData;
    trader: TraderData;
    login: LoginData;
}

export interface AppData {
    updateReady: string | null;
    updatingSwapperd: boolean;
}

export interface LoginData {
    password: string | null;
}

export interface TraderData {
    network: Network;
}
