import * as React from "react";

import electron from "electron";

import { Container, Subscribe } from "unstated";

import { getBalances } from "@/lib/swapperd";
import { initialState } from "@/store/initialState";
import { ApplicationData } from "@/store/storeTypes";
import { Network } from "common/types";

import { ElectronStore } from "main/store";

export class AppContainer extends Container<ApplicationData> {
    public state = initialState;

    constructor() {
        super();
        this.restore();
    }

    // App data
    public setUpdateReady = async (version: string) =>
        this.setState({ app: { ...this.state.app, updateReady: version } })
    public clearUpdateReady = async () =>
        this.setState({ app: { ...this.state.app, updateReady: null } })

    // Login data
    public setPassword = async (password: string) =>
        this.setState({ login: { ...this.state.login, password } })
    public clearPassword = async () =>
        this.setState({ login: { ...this.state.login, password: null } })

    // Swapperd Updating state
    public setUpdatingSwapperd = async (updating: boolean) =>
        this.setState({ app: { ...this.state.app, updatingSwapperd: updating } })

    // Trader data
    public setNetwork = async (network: Network) => {
        await this.setState({ trader: { ...this.state.trader, network } });
        // Preserve the network state in local storage
        const store: ElectronStore = await fetchStore();
        await store.setNetwork(network);
    }

    /**
     * updateBalances fetches and updates the balances from Swapperd.
     *
     * @throws an error if the call to getBalances() failed
     */
    public updateBalances = async (whichNetwork?: Network): Promise<void> => {
        const network = (whichNetwork) ? whichNetwork : this.state.trader.network;
        const { login: { password } } = this.state;
        if (password !== null) {
            const balances = await getBalances({ network, password });
            const currentBalances = this.state.trader.balances.get(network);
            if (!balances.equals(currentBalances)) {
                const newBalances = this.state.trader.balances.set(network, balances);
                await this.setState({ trader: {...this.state.trader, balances: newBalances}});
            }
        }
    }

    private restore = async (): Promise<void> => {
        // Restore the last stored network setting
        const store: ElectronStore = await fetchStore();
        const network = await store.getNetwork();
        await this.setNetwork(network);
    }
}

async function fetchStore(): Promise<ElectronStore> {
    return new Promise((resolve, _reject) => {
        const store: ElectronStore = electron.remote.getGlobal("store");
        resolve(store);
    });
}

export interface ConnectedProps {
    container: AppContainer;
}

// Typesafe version of https://github.com/goncy/unstated-connect
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export function connect<X extends ConnectedProps>(_container: typeof AppContainer) {
    return (Component: React.ComponentClass<X>) => (props: Omit<X, "container">) => (
        <Subscribe to={[_container]}>
            {(...containers) => <Component {...({ ...props, container: containers[0] } as unknown as X)} />}
        </Subscribe>
    );
}
