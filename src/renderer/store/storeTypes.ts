import { Network } from "common/types";

import { IBalances, ISwapsResponse, ITransfersResponse } from "common/swapperD";

export interface ApplicationData {
    app: AppData;
    trader: TraderData;
    login: LoginData;
}

export interface AppData {
    updateReady: string | null;
    updatingSwapperD: boolean;
    installProgress: number | null;
}

export interface LoginData {
    password: string | null;
}

export interface TraderData {
    balances: Map<Network, IBalances>;
    swaps: Map<Network, ISwapsResponse>;
    transfers: Map<Network, ITransfersResponse>;
}

export interface OptionsData {
    network: Network;
    hideZeroBalances: boolean;
    defaultTransactionSpeed: number;
}
