import axios, { AxiosResponse } from "axios";
import BigNumber from "bignumber.js";
import logger from "electron-log";

import { OrderedMap } from "immutable";

import { sleep } from "./sleep";
import { Network } from "./types";

const MAINNET_ENDPOINT = "http://localhost:7927";
const TESTNET_ENDPOINT = "http://localhost:17927";

const DEFAULT_TIMEOUT = 60 * 1000; // 1 minute
const LONGER_TIMEOUT = 5 * 60 * 1000; // 5 minute

export const NETWORKS = {
    [Network.Mainnet]: "Main Network",
    [Network.Testnet]: "Test Network",
};

export interface IOptions {
    network: string;
    password: string;
}

export interface IPartialWithdrawRequest {
    token: Token;
}

export interface IWithdrawRequest extends IPartialWithdrawRequest {
    to: string;
    amount: string;
    sendAll?: boolean;
    speed?: number;
}

export interface IPartialSwapRequest {
    sendToken: Token;
    receiveToken: Token;

    // SendAmount and ReceiveAmount are hex encoded.
    sendAmount: string;
    receiveAmount: string;

    sendTo: string;
    receiveFrom: string;
    shouldInitiateFirst: boolean;
    brokerFee?: number;
    speed?: number;
}

export interface ISwapRequest extends IPartialSwapRequest {
    id: string;
    timeLock: number;
    secretHash: string;
}

export type IBalances = OrderedMap<Token, { address: string; balance: BigNumber }>;

export interface IBalancesResponseRaw {
    [key: string]: { address: string; balance: string };
}

export interface ISwapItem {
    id: string;
    sendToken: Token;
    receiveToken: Token;
    sendAmount: string;
    receiveAmount: string;
    sendCost: {
        [token: string]: string;
    };
    receiveCost: {
        [token: string]: string;
    };
    timestamp: number;
    status: number;
    timeLock?: number;
}

export interface ISwapsResponse {
    swaps: ISwapItem[];
}

export enum Token {
    WBTC = "WBTC",
    BTC = "BTC",
    REN = "REN",
    TUSD = "TUSD",
    OMG = "OMG",
    ZRX = "ZRX",
    DGX = "DGX",
    ETH = "ETH",
    DAI = "DAI",
    USDC = "USDC",
    GUSD = "GUSD",
    PAX = "PAX",
    ZEC = "ZEC",
}

export interface ITransferItem {
    to: string;
    // tslint:disable-next-line: no-reserved-keywords
    from: string;
    token: {
        name: Token;
        blockchain: string;
    };
    value: string;
    txCost: {
        [token: string]: string;
    };
    txHash: string;
    confirmations: number;
    timestamp: number;
}

export interface ITransfersResponse {
    transfers: ITransferItem[];
}

export interface IInfoResponse {
    version: string;
    bootloaded: boolean;
    supportedTokens: Array<{ name: Token; blockchain: string }>;
}

export const decimals = new Map<Token, number>()
    .set(Token.WBTC, 8)
    .set(Token.BTC, 8)
    .set(Token.REN, 18)
    .set(Token.TUSD, 18)
    .set(Token.OMG, 18)
    .set(Token.ZRX, 18)
    .set(Token.DGX, 9)
    .set(Token.ETH, 18)
    .set(Token.DAI, 18)
    .set(Token.PAX, 18)
    .set(Token.USDC, 6)
    .set(Token.GUSD, 2)
    .set(Token.ZEC, 8);

export function swapperEndpoint(network: string) {
    switch (network) {
        case Network.Mainnet:
            return MAINNET_ENDPOINT;
        case Network.Testnet:
            return TESTNET_ENDPOINT;
        default:
            throw new Error(`Invalid network: ${network}`);
    }
}

export async function getBalances(options: IOptions): Promise<IBalances> {
    const postResponse = await axios({
        method: "GET",
        url: `${swapperEndpoint(options.network)}/balances`,
        timeout: LONGER_TIMEOUT,
        auth: {
            username: "",
            password: options.password,
        },
    });

    const response: IBalancesResponseRaw = postResponse.data;

    const keys = [];

    for (const token of Object.keys(response)) {
        keys.push(token as Token);
    }

    keys.sort();

    let balances: IBalances = OrderedMap();

    for (const token of keys) {
        const decimal = decimals.get(token) || 0;
        balances = balances.set(token, {
            address: response[token].address,
            balance: new BigNumber(response[token].balance).div(new BigNumber(10).pow(decimal)),
        });
    }

    return balances;
}

export async function fetchInfo(options: IOptions): Promise<IInfoResponse> {
    // Check if user has an account set-up
    const response: AxiosResponse<IInfoResponse> = await axios({
        method: "GET",
        url: `${swapperEndpoint(options.network)}/info`,
        timeout: DEFAULT_TIMEOUT,
        auth: {
            username: "",
            password: options.password,
        },
    });
    return response.data;
}

export async function fetchAccountStatus(options: IOptions): Promise<string> {
    // Check if user has an account set-up
    try {
        const info = await fetchInfo(options);
        if (info.bootloaded) {
            return "unlocked";
        } else {
            return "locked";
        }
    } catch (e) {
        logger.error(e);
        return "none";
    }
}

export async function swapperdReady(password: string): Promise<void> {
    let timeout = 60;
    let status;
    do {
        status = await fetchAccountStatus({ network: Network.Mainnet, password });
        if (status !== "none") {
            return;
        }
        // Sleep for 1 second before retrying
        await sleep(1000);
        timeout -= 1;
    } while (status === "none" && timeout > 0);
    throw new Error("Unable to connect to SwapperD back-end.");
}

export async function getSwaps(options: IOptions): Promise<ISwapsResponse> {
    const postResponse = await axios({
        method: "GET",
        url: `${swapperEndpoint(options.network)}/swaps`,
        timeout: LONGER_TIMEOUT,
        auth: {
            username: "",
            password: options.password,
        },
    });

    const swaps: ISwapsResponse = postResponse.data;
    if (swaps.swaps !== null) {
        for (const swap of swaps.swaps) {
            if (swap.sendToken === undefined || swap.receiveToken === undefined) {
                continue;
            }
            let sendDecimal = decimals.get(swap.sendToken);
            let receiveDecimal = decimals.get(swap.receiveToken);
            if (sendDecimal !== undefined && receiveDecimal !== undefined) {
                swap.sendAmount = new BigNumber(swap.sendAmount).div(new BigNumber(10).pow(sendDecimal)).toFixed();
                swap.receiveAmount = new BigNumber(swap.receiveAmount).div(new BigNumber(10).pow(receiveDecimal)).toFixed();
            }
            for (const sendToken of Object.keys(swap.sendCost)) {
                sendDecimal = decimals.get(sendToken as Token);
                if (sendDecimal) {
                    swap.sendCost[sendToken] = new BigNumber(swap.sendCost[sendToken]).div(new BigNumber(10).pow(sendDecimal)).toFixed();
                }
            }
            for (const receiveToken of Object.keys(swap.receiveCost)) {
                receiveDecimal = decimals.get(receiveToken as Token);
                if (receiveDecimal) {
                    swap.receiveCost[receiveToken] = new BigNumber(swap.receiveCost[receiveToken]).div(new BigNumber(10).pow(receiveDecimal)).toFixed();
                }
            }
        }
    }

    return swaps;
}

export async function getTransfers(options: IOptions): Promise<ITransfersResponse> {
    const postResponse = await axios({
        method: "GET",
        url: `${swapperEndpoint(options.network)}/transfers`,
        timeout: LONGER_TIMEOUT,
        auth: {
            username: "",
            password: options.password,
        },
    });

    const transfers: ITransfersResponse = postResponse.data;
    if (transfers.transfers !== null) {
        for (const transfer of transfers.transfers) {
            if (transfer.token.name === undefined) {
                continue;
            }
            let decimal = decimals.get(transfer.token.name);
            if (decimal !== undefined) {
                transfer.value = new BigNumber(transfer.value).div(new BigNumber(10).pow(decimal)).toFixed();
            }
            switch (transfer.token.blockchain) {
                case "zcash":
                    decimal = decimals.get(Token.ZEC);
                    break;
                case "bitcoin":
                    decimal = decimals.get(Token.BTC);
                    break;
                case "ethereum":
                    decimal = decimals.get(Token.ETH);
                    break;
                default:
                // don't do anything
            }

            for (const costToken of Object.keys(transfer.txCost)) {
                const costDecimal = decimals.get(costToken as Token);
                if (costDecimal !== undefined) {
                    transfer.txCost[costToken] = new BigNumber(transfer.txCost[costToken])
                        .div(new BigNumber(10).pow(costDecimal))
                        .toFixed();
                }
            }

            if (decimal !== undefined) {
                // FIXME

                // transfer.txCost = transfer.txCost.forEach()

                // transfer.fee = new BigNumber(transfer.fee).div(new BigNumber(10).pow(decimal)).toFixed();
            }
        }
    }

    return transfers;
}

export async function submitWithdraw(withdrawRequest: IWithdrawRequest, options: IOptions) {
    const decimal = decimals.get(withdrawRequest.token);
    if (decimal !== undefined) {
        withdrawRequest.amount = new BigNumber(withdrawRequest.amount).times(new BigNumber(10).pow(decimal)).toFixed();
    }

    const postResponse = await axios({
        method: "POST",
        url: `${swapperEndpoint(options.network)}/transfers`,
        auth: {
            username: "",
            password: options.password,
        },
        data: withdrawRequest,
    });

    return postResponse.data;
}

export async function submitSwap(swapRequest: IPartialSwapRequest, options: IOptions) {
    return axios({
        method: "POST",
        url: `${swapperEndpoint(options.network)}/swaps`,
        auth: {
            username: "",
            password: options.password,
        },
        data: swapRequest,
    });
}

export async function getInfo(password: string): Promise<boolean> {
    return Promise.all(Object.keys(NETWORKS).map(async (network) => {
        return axios({
            method: "GET",
            url: `${swapperEndpoint(network)}/info`,
            timeout: DEFAULT_TIMEOUT,
            auth: {
                username: "",
                password,
            },
        }).then(resp => {
            if (resp.status === 200) {
                const info: IInfoResponse = resp.data;
                return info.bootloaded;
            } else {
                return false;
            }
        });
    })).then((results) => results.every(status => status)).catch(err => {
        logger.error(err);
        return false;
    });
}
