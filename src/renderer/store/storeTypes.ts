import { Network } from "common/types";

export interface ApplicationData {
    trader: TraderData;
    login: LoginData;
}

export interface LoginData {
    password: string | null;
}

export interface TraderData {
    network: Network;
}
