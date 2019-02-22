import { Network } from "common/types";

import { IBalances } from "@/lib/swapperd";

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
    balances: Map<Network, IBalances>;
}
