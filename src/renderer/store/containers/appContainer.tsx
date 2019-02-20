import * as React from "react";

import { Container, Subscribe } from "unstated";

import { getBalances } from "@/lib/swapperd";
import { initialState } from "@/store/initialState";
import { ApplicationData } from "@/store/storeTypes";
import { Network } from "common/types";

export class AppContainer extends Container<ApplicationData> {
    public state = initialState;

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
    public setNetwork = async (network: Network) =>
        this.setState({ trader: { ...this.state.trader, network } })

    /**
     * updateBalances fetches and updates the balances from Swapperd.
     *
     * @throws an error if the call to getBalances() failed
     */
    public updateBalances = async (): Promise<void> => {
        const { login: { password }, trader: { network }  } = this.state;
        if (password !== null) {
            const balances = await getBalances({ network, password });
            const currentBalances = this.state.trader.balances.get(network);
            if (!balances.equals(currentBalances)) {
                const newBalances = this.state.trader.balances.set(network, balances);
                await this.setState({ trader: {...this.state.trader, balances: newBalances}});
            }
        }
    }

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
