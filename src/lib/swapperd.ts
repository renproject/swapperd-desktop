import axios from 'axios';
import BigNumber from 'bignumber.js';
import * as child from 'child_process';
import * as fs from 'fs';

export enum Network {
    Mainnet = "mainnet",
    Testnet = "testnet",
}

export interface IWithdrawRequest extends IPartialWithdrawRequest {
    to: string;
    amount: string;
}

export interface IPartialWithdrawRequest {
    token: string;
}

export interface ISwapRequest extends IPartialSwapRequest {
    id: string,
    timeLock: number,
    secretHash: string,
}

export interface IPartialSwapRequest {
    sendToken: string,
    receiveToken: string,

    // SendAmount and ReceiveAmount are hex encoded.
    sendAmount: string,
    receiveAmount: string,

    sendTo: string,
    receiveFrom: string,
    shouldInitiateFirst: boolean,
}

export interface IBalanceItem {
    token: string;
    address: string;
    amount: string;
}
export interface IBalancesResponse {
    balances: IBalanceItem[]
}

const decimals = new Map<string, number>()
    .set("WBTC", 8)
    .set("BTC", 8)
    .set("ETH", 18);

export const getBalances = async () => {
    const postResponse = await axios({
        method: 'GET',
        url: "http://localhost:7777/balances",
        // auth: {
        //     username,
        //     password,
        // },
    });

    const balances: IBalancesResponse = postResponse.data;

    for (const balance of balances.balances) {
        const token = balance.token;
        const decimal = decimals.get(token);
        if (decimal !== undefined) {
            balance.amount = new BigNumber(balance.amount).div(new BigNumber(10).pow(decimal)).toFixed();
        }
    }

    return balances;
}

export const checkAccountExists = async (): Promise<boolean> => {
    return fs.existsSync("~/.swapperd/testnet.json")
}

export const createAccount = async (network: Network, username: string, password: string) => {
    child.exec(`install.sh ${network} ${username} ${password}`)
}

export const submitWithdraw = async (withdrawRequest: IWithdrawRequest, username: string, password: string) => {

    const decimal = decimals.get(withdrawRequest.token);
    if (decimal !== undefined) {
        withdrawRequest.amount = new BigNumber(withdrawRequest.amount).times(new BigNumber(10).pow(decimal)).toFixed();
    }


    const postResponse = await axios({
        method: 'POST',
        url: "http://localhost:7777/withdrawals",
        auth: {
            username,
            password,
        },
        data: withdrawRequest,
    });

    const response: any = postResponse.data;

    return response;
}