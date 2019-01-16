import * as React from "react";

import { getBalances, getSwaps, getTransfers, IBalances, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse, ITransfersResponse, Network, fetchInfo } from "../lib/swapperd";
import { AcceptMnemonic } from "./AcceptMnemonic";
import { ApproveSwap } from "./ApproveSwap";
import { ApproveWithdraw } from "./ApproveWithdraw";
import { Balances } from "./Balances";
import { CreateAccount } from "./CreateAccount";
import { Header } from "./Header";
import { Swaps } from "./Swaps";
import { UnlockScreen } from "./UnlockScreen";
import { SwapResponseValue, on, sendToMain } from '../ipc';
import { OrderedMap } from 'immutable';
import BigNumber from 'bignumber.js';
import { Record } from '../lib/record';

export class NetworkDetails extends Record({
    balances: null as IBalances | null,
    balancesError: null as string | null,
    swaps: null as ISwapsResponse | null,
    transfers: null as ITransfersResponse | null,
}) { }

export class NetworkState extends Record({
    [Network.Mainnet]: new NetworkDetails(),
    [Network.Testnet]: new NetworkDetails(),
}) { }

interface IAppState {
    password: string;
    network: Network;

    networkDetails: NetworkState;

    origin: string;
    mnemonic: string;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null,
}

class App extends React.Component<{}, IAppState> {
    private callGetBalancesTimeout: NodeJS.Timer | undefined;
    private callGetAccountTimeout: NodeJS.Timer | undefined;
    private callGetTransactionsTimeout: NodeJS.Timer | undefined;

    constructor(props: {}) {
        super(props);
        this.state = {
            network: Network.Mainnet,
            networkDetails: new NetworkState(),
            origin: "",
            mnemonic: "",
            password: "",
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
        };
        this.setNetwork = this.setNetwork.bind(this);
        this.mnemonicSaved = this.mnemonicSaved.bind(this);
        this.accountCreated = this.accountCreated.bind(this);
        this.resetSwapDetails = this.resetSwapDetails.bind(this);
        this.setWithdrawRequest = this.setWithdrawRequest.bind(this);
    }

    public componentWillUnmount() {
        // Clear timeouts
        if (this.callGetBalancesTimeout) { clearTimeout(this.callGetBalancesTimeout); }
        if (this.callGetAccountTimeout) { clearTimeout(this.callGetAccountTimeout); }
        if (this.callGetTransactionsTimeout) { clearTimeout(this.callGetTransactionsTimeout); }
    }

    public async componentDidMount() {
        // Attach event to swap


        on("swap", (swap: SwapResponseValue) => {
            try {
                const network = swap.network ? swap.network : this.state.network;
                const origin = swap.origin ? swap.origin : this.state.origin;
                this.setState({ swapDetails: swap.body, network, origin });
            } catch (error) {
                console.error(error);
            }
        }, true);

        on("get-password", () => {
            return this.state.password;
        });

        // on("get-balances", () => {
        //     const { networkDetails, network } = this.state;
        //     return networkDetails.get(network).balances || {};
        // });


        on("get-network", () => {
            return this.state.network;
        });

        // Check if user has an account set-up
        const callGetAccount = async () => {
            const { network, networkDetails } = this.state;
            const balances = networkDetails.get(network).balances;
            try {
                let accountExists: boolean;
                try {
                    const response = await fetchInfo({ network: this.state.network, password: this.state.password });
                    accountExists = true;

                    if (!balances || balances.size === 0) {

                        let balances: IBalances = OrderedMap();

                        const supportedTokens = response.supportedTokens;
                        for (const token of supportedTokens) {
                            balances = balances.set(token.name, {
                                address: "",
                                balance: new BigNumber(0),
                            });
                        }

                        this.setState({});
                    }

                } catch (error) {
                    accountExists = false;
                }
                if (accountExists !== this.state.accountExists) {
                    this.setState({ accountExists, });
                }
            } catch (e) {
                console.error(e.response && e.response.data.error || e);
            }
            this.callGetAccountTimeout = setTimeout(callGetAccount, 2 * 1000);
        };
        callGetAccount().catch(console.error);

        // Check balances and swaps on an interval
        const callGetBalances = async () => {
            const { accountExists, network, networkDetails, password } = this.state;

            if (accountExists && this.state.password !== "") {
                try {
                    const balances = await getBalances({ network: network, password: password });

                    const currentBalances = networkDetails.get(network).balances;
                    if (!balances.equals(currentBalances)) {
                        this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("balances", balances)) });
                    }

                } catch (e) {
                    console.error(e);
                    const { network, networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("balancesError", `Unable to retrieve balances. ${e}`)) });
                }
            }
            this.callGetBalancesTimeout = setTimeout(callGetBalances, 10 * 1000);
        };
        callGetBalances().catch(console.error);

        const callGetTransactions = async () => {
            if (this.state.accountExists && this.state.password !== "") {
                try {
                    const swaps = await getSwaps({ network: this.state.network, password: this.state.password });

                    const { network, networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("swaps", swaps)) });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
                try {
                    const transfers = await getTransfers({ network: this.state.network, password: this.state.password });
                    const { network, networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("transfers", transfers)) });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
            }
            this.callGetTransactionsTimeout = setTimeout(callGetTransactions, 5 * 1000);
        };
        callGetTransactions().catch(console.error);
    }

    public render(): JSX.Element {
        const { mnemonic, accountExists, swapDetails, password, withdrawRequest, networkDetails, network } = this.state;
        const { balances, balancesError, swaps, transfers } = networkDetails.get(network);

        if (mnemonic !== "") {
            return <div className="app">
                <Header network={this.state.network} hideNetwork={true} setNetwork={this.setNetwork} />
                <AcceptMnemonic mnemonic={mnemonic} resolve={this.mnemonicSaved} />
            </div>;
        }

        if (!accountExists) {
            return <div className="app">
                <Header network={this.state.network} hideNetwork={true} setNetwork={this.setNetwork} />
                <CreateAccount resolve={this.accountCreated} />
            </div>;
        }

        if (accountExists && password === "") {
            return <div className="app">
                <Header network={this.state.network} hideNetwork={true} setNetwork={this.setNetwork} />
                <UnlockScreen resolve={this.setUnlocked} />
            </div>;
        }

        if (swapDetails) {
            return <div className="app">
                <Header network={this.state.network} hideNetwork={true} setNetwork={this.setNetwork} />
                <ApproveSwap
                    origin={this.state.origin}
                    network={this.state.network}
                    swapDetails={swapDetails}
                    resetSwapDetails={this.resetSwapDetails}
                />
            </div>;
        }

        if (withdrawRequest) {
            return <div className="app">
                <Header network={this.state.network} hideNetwork={true} setNetwork={this.setNetwork} />
                <ApproveWithdraw
                    network={this.state.network}
                    balances={balances}
                    withdrawRequest={withdrawRequest}
                    setWithdrawRequest={this.setWithdrawRequest}
                />
            </div>;
        }

        if (accountExists && password !== "") {
            return <div className="app">
                <Header network={this.state.network} setNetwork={this.setNetwork} />
                <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
                <Swaps swaps={swaps} transfers={transfers} />
            </div>;
        }

        return <div className="app">An error occurred.</div>;
    }

    private setUnlocked = (password: string): void => {
        this.setState({ password });
    }

    private setNetwork(network: Network): void {
        this.setState({ network });
    }

    private mnemonicSaved(): void {
        this.setState({ mnemonic: "" });
    }

    private accountCreated(mnemonic: string, password: string): void {
        this.setState({ accountExists: true, mnemonic, password });
        sendToMain(
            "notify",
            {
                notification: `Account ${mnemonic === "" ? "imported successfully!" : "creation successful!"}`
            },
        );
    }

    private resetSwapDetails(): void {
        this.setState({
            swapDetails: null,
            origin: "",
        });
    }

    private setWithdrawRequest(withdrawRequest: IPartialWithdrawRequest | null): void {
        this.setState({ withdrawRequest });
    }
}

export default App;
