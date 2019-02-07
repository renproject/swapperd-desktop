import { Container } from "unstated";

import { initialState } from "@/store/initialState";
import { ApplicationData } from "@/store/storeTypes";
import { Network } from "common/types";

export class AppContainer extends Container<ApplicationData> {
    public state = initialState;

    // Login data
    public setPassword = async (password: string) =>
        this.setState({ login: { ...this.state.login, password } })
    public clearPassword = async () =>
        this.setState({ login: { ...this.state.login, password: null } })

    // Trader data
    public setNetwork = async (network: Network) =>
        this.setState({ trader: { ...this.state.trader, network } })

}
