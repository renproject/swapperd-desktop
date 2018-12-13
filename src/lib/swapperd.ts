import axios from "axios";
import BigNumber from "bignumber.js";

import { OrderedMap } from "immutable";

const MAINNET_ENDPOINT = "http://localhost:7927";
const TESTNET_ENDPOINT = "http://localhost:17927";

export const MAINNET_REF = "mainnet";
export const TESTNET_REF = "testnet";

export const NETWORKS = {
    [MAINNET_REF]: "Main Network",
    [TESTNET_REF]: "Test Network",
};

export interface IOptions {
    network: string;
}

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

export interface IInfoResponse {
    version: string;
    bootloaded: boolean;
    supportedBlockchains: Array<{ name: string, address: string }>;
    supportedTokens: Array<{ name: string, blockchain: string }>;
}

const decimals = new Map<string, number>()
    .set("WBTC", 8)
    .set("BTC", 8)
    .set("ETH", 18);

function swapperEndpoint(network: string) {
    switch (network) {
        case MAINNET_REF:
            return MAINNET_ENDPOINT;
        case TESTNET_REF:
            return TESTNET_ENDPOINT;
        default:
            throw new Error(`Invalid network: ${network}`);
    }
}

export async function getBalances(options: IOptions): Promise<IBalances> {
    const postResponse = await axios({
        method: "GET",
        url: `${swapperEndpoint(options.network)}/balances`,
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

export async function fetchAccountStatus(options: IOptions): Promise<string> {
    // Check if user has an account set-up
    try {
        const response = await axios({
            method: "GET",
            url: `${swapperEndpoint(options.network)}/info`,
        });
        const info: IInfoResponse = response.data;
        console.log(JSON.stringify(info));
        if (info.bootloaded) {
            return "unlocked";
        } else {
            return "locked";
        }
    } catch (e) {
        console.error(e);
        return "none";
    }
}

export async function getSwaps(options: IOptions): Promise<ISwapsResponse> {
    const postResponse = await axios({
        method: "GET",
        url: `${swapperEndpoint(options.network)}/swaps`,
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

export async function submitWithdraw(withdrawRequest: IWithdrawRequest, password: string, options: IOptions) {
    const decimal = decimals.get(withdrawRequest.token);
    if (decimal !== undefined) {
        withdrawRequest.amount = new BigNumber(withdrawRequest.amount).times(new BigNumber(10).pow(decimal)).toFixed();
    }

    const postResponse = await axios({
        method: "POST",
        url: `${swapperEndpoint(options.network)}/withdrawals`,
        auth: {
            username: "",
            password,
        },
        data: withdrawRequest,
    });

    return postResponse.data;
}

export async function submitSwap(swapRequest: IPartialSwapRequest, password: string, options: IOptions) {
    return axios({
        method: "POST",
        url: `${swapperEndpoint(options.network)}/swaps`,
        auth: {
            username: "",
            password,
        },
        data: swapRequest,
    });
}

export async function bootload(password: string): Promise<boolean> {
    return Promise.all(Object.keys(NETWORKS).map((network) => {
        return axios({
            method: "POST",
            url: `${swapperEndpoint(network)}/bootload`,
            auth: {
                username: "",
                password,
            },
        }).then(resp => {
            console.log(`Response when bootloading ${NETWORKS[network]}: ${resp.status}`);
            return resp.status === 200;
        });
    })).then((results) => results.every(status => status)).catch(err => {
        console.error(err);
        return false;
    });
}
