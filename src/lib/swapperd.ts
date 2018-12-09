import axios from "axios";
import BigNumber from "bignumber.js";

import { OrderedMap } from "immutable";

export const MAINNET_REF = "mainnet";
export const TESTNET_REF = "testnet";

export interface IWithdrawRequest extends IPartialWithdrawRequest {
    to: string;
    amount: string;
}

export interface IPartialWithdrawRequest {
    token: string;
}

export interface ISwapRequest extends IPartialSwapRequest {
    id: string;
    timeLock: number;
    secretHash: string;
}

export interface IPartialSwapRequest {
    sendToken: string;
    receiveToken: string;

    // SendAmount and ReceiveAmount are hex encoded.
    sendAmount: string;
    receiveAmount: string;

    sendTo: string;
    receiveFrom: string;
    shouldInitiateFirst: boolean;
}

export type IBalances = OrderedMap<string, { address: string, balance: BigNumber }>;

export interface IBalancesResponseRaw {
    [symbol: string]: { address: string, balance: string };
}

export interface ISwapItem {
    id: string;
    sendToken: string;
    receiveToken: string;
    sendAmount: string;
    receiveAmount: string;
    timestamp: number;
    status: number;
}

export interface ISwapsResponse {
    swaps: ISwapItem[];
}

const decimals = new Map<string, number>()
    .set("WBTC", 8)
    .set("BTC", 8)
    .set("ETH", 18);

export async function getBalances(): Promise<IBalances> {
    const postResponse = await axios({
        method: "GET",
        url: "http://localhost:7927/balances",
    });

    const response: IBalances = postResponse.data;

    const keys = [];

    for (const token in response) {
        if (response.hasOwnProperty(token)) {
            keys.push(token);
        }
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

export function checkAccountExists(): boolean {
    // Check if user has an account set-up
    const xhr = new XMLHttpRequest();
    try {
        xhr.open("GET", "http://localhost:7927/whoami", false);
        xhr.send("");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function getSwaps(): Promise<ISwapsResponse> {
    const postResponse = await axios({
        method: "GET",
        url: "http://localhost:7927/swaps",
    });

    const swaps: ISwapsResponse = postResponse.data;
    if (swaps.swaps !== null) {
        for (const swap of swaps.swaps) {
            if (swap.sendToken === undefined || swap.receiveToken === undefined) {
                continue;
            }
            const sendDecimal = decimals.get(swap.sendToken);
            const receiveDecimal = decimals.get(swap.receiveToken);
            if (sendDecimal !== undefined && receiveDecimal !== undefined) {
                swap.sendAmount = new BigNumber(swap.sendAmount).div(new BigNumber(10).pow(sendDecimal)).toFixed();
                swap.receiveAmount = new BigNumber(swap.receiveAmount).div(new BigNumber(10).pow(receiveDecimal)).toFixed();
            }
        }
    }

    return swaps;
}

export async function submitWithdraw(withdrawRequest: IWithdrawRequest, password: string) {
    const decimal = decimals.get(withdrawRequest.token);
    if (decimal !== undefined) {
        withdrawRequest.amount = new BigNumber(withdrawRequest.amount).times(new BigNumber(10).pow(decimal)).toFixed();
    }

    const postResponse = await axios({
        method: "POST",
        url: "http://localhost:7927/withdrawals",
        auth: {
            username: "",
            password,
        },
        data: withdrawRequest,
    });

    return postResponse.data;
}

export async function submitSwap(swapRequest: IPartialSwapRequest, password: string) {
    const postResponse = await axios({
        method: "POST",
        url: "http://localhost:7927/swaps",
        auth: {
            username: "",
            password,
        },
        data: swapRequest,
    });

    return postResponse.data;
}