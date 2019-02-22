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
    balances: Map<Network, IBalances>;
}

export interface OptionsData {
    network: Network;
    hideZeroBalances: boolean;
    defaultTransactionSpeed: number;
}
