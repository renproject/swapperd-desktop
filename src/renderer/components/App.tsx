import * as React from "react";

import { AcceptMnemonic } from "@/components/AcceptMnemonic";
import { ApproveSwap } from "@/components/ApproveSwap";
import { ApproveWithdraw } from "@/components/ApproveWithdraw";
import { Balances } from "@/components/Balances";
import { CreateAccount } from "@/components/CreateAccount";
import { Header } from "@/components/Header";
import { Swaps } from "@/components/Swaps";
import { UnlockScreen } from "@/components/UnlockScreen";
import { ipc } from "@/ipc";
import { Record } from "@/lib/record";
import { fetchInfo, getBalances, getSwaps, getTransfers, IBalances, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse, ITransfersResponse } from "@/lib/swapperd";
import { AppContainer, connect, ConnectedProps } from "@/store/containers/appContainer";
import { Message, Network } from "common/types";

// import { version } from "../../../package.json";

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

class AppClass extends React.Component<IAppProps, IAppState> {
    private callGetBalancesTimeout: NodeJS.Timer | undefined;
    private callGetAccountTimeout: NodeJS.Timer | undefined;
    private callGetTransactionsTimeout: NodeJS.Timer | undefined;

    constructor(props: IAppProps) {
        super(props);
        this.state = {
            networkDetails: new NetworkState(),
            origin: "",
            mnemonic: "",
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
        };
    }

    public readonly componentWillUnmount = () => {
        // Clear timeouts
        if (this.callGetBalancesTimeout) { clearTimeout(this.callGetBalancesTimeout); }
        if (this.callGetAccountTimeout) { clearTimeout(this.callGetAccountTimeout); }
        if (this.callGetTransactionsTimeout) { clearTimeout(this.callGetTransactionsTimeout); }
    }

    public readonly componentDidMount = async () => {
        // Attach event to swap

        ipc.delayedOn(Message.Swap, async (swap) => {
            try {
                const network = swap.network ? swap.network : this.props.container.state.trader.network;
                const origin = swap.origin ? swap.origin : this.state.origin;
                await this.props.container.setNetwork(network);
                this.setState({ swapDetails: swap.body, origin });
            } catch (error) {
                console.error(error);
            }
        });

        ipc.on(Message.GetPassword, () => {
            const { password } = this.props.container.state.login;
            if (password === null) {
                throw new Error("Swapperd locked");
            }
            return password;
        });

        ipc.on(Message.GetNetwork, () => {
            return this.props.container.state.trader.network;
        });

        ipc.on(Message.UpdateReady, async (version: string) => {
            await this.props.container.setUpdateReady(version);
            return;
        });

        this.callGetAccount().catch(console.error);

        // Check balances and swaps on an interval
        const callGetBalances = async () => {
            const { login: { password }, trader: { network } } = this.props.container.state;

            const { accountExists } = this.state;

            if (accountExists && password !== null) {
                try {
                    const balances = await getBalances({ network: network, password });

                    const { networkDetails } = this.state;

                    const currentBalances = networkDetails.get(network).balances;
                    if (!balances.equals(currentBalances)) {
                        this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("balances", balances)) });
                    }

                } catch (e) {
                    console.error(e);
                    const { networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("balancesError", `Unable to retrieve balances. ${e}`)) });
                }
            }

            if (this.callGetBalancesTimeout) { clearTimeout(this.callGetBalancesTimeout); }
            this.callGetBalancesTimeout = setTimeout(callGetBalances, 10 * 1000);
        };
        callGetBalances().catch(console.error);

        const callGetTransactions = async () => {
            const { password } = this.props.container.state.login;
            const { accountExists } = this.state;

            if (accountExists && password !== null) {
                try {
                    const { network } = this.props.container.state.trader;
                    const swaps = await getSwaps({ network, password: password });

                    const { networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("swaps", swaps)) });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
                try {
                    const { network } = this.props.container.state.trader;
                    const transfers = await getTransfers({ network: network, password: password });

                    const { networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("transfers", transfers)) });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
            }

            if (this.callGetTransactionsTimeout) { clearTimeout(this.callGetTransactionsTimeout); }
            this.callGetTransactionsTimeout = setTimeout(callGetTransactions, 5 * 1000);
        };
        callGetTransactions().catch(console.error);
    }

    public readonly render = (): JSX.Element => {
        const { login: { password }, trader: { network } } = this.props.container.state;

        const { mnemonic, accountExists, swapDetails, withdrawRequest, networkDetails } = this.state;
        const { balances, balancesError, swaps, transfers } = networkDetails.get(network);

        if (mnemonic !== "") {
            return <div className="app">
                <Header network={network} hideNetwork={true} setNetwork={this.setNetwork} />
                <AcceptMnemonic mnemonic={mnemonic} resolve={this.mnemonicSaved} />
            </div>;
        }

        if (!accountExists) {
            return <div className="app">
                <Header network={network} hideNetwork={true} setNetwork={this.setNetwork} />
                <CreateAccount resolve={this.accountCreated} />
            </div>;
        }

        if (accountExists && password === null) {
            return <div className="app">
                <Header network={network} hideNetwork={true} setNetwork={this.setNetwork} />
                <UnlockScreen resolve={this.setUnlocked} />
            </div>;
        }

        if (swapDetails) {
            return <div className="app">
                <Header network={network} hideNetwork={true} setNetwork={this.setNetwork} />
                <ApproveSwap
                    origin={origin}
                    network={network}
                    swapDetails={swapDetails}
                    resetSwapDetails={this.resetSwapDetails}
                />
            </div>;
        }

        if (withdrawRequest) {
            return <div className="app">
                <Header network={network} hideNetwork={true} setNetwork={this.setNetwork} />
                <ApproveWithdraw
                    network={network}
                    balances={balances}
                    withdrawRequest={withdrawRequest}
                    setWithdrawRequest={this.setWithdrawRequest}
                />
            </div>;
        }

        if (accountExists && password !== null) {
            return <div className="app">
                <Header network={network} setNetwork={this.setNetwork} />
                <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
                <Swaps swaps={swaps} transfers={transfers} />
            </div>;
        }

        return <div className="app">An error occurred.</div>;
    }

    private readonly setUnlocked = async (password: string): Promise<void> => {
        await this.props.container.setPassword(password);
    }

    private readonly setNetwork = async (network: Network): Promise<void> => {
        await this.props.container.setNetwork(
            network,
        );

        await this.callGetAccount().catch(console.error);
    }

    private readonly mnemonicSaved = (): void => {
        this.setState({ mnemonic: "" });
    }

    private readonly accountCreated = async (mnemonic: string, password: string): Promise<void> => {
        this.setState({ accountExists: true, mnemonic });
        await this.props.container.setPassword(password);
        ipc.sendMessage(
            Message.Notify,
            {
                notification: `Account ${mnemonic === "" ? "imported successfully!" : "creation successful!"}`
            },
        );
    }

    private readonly resetSwapDetails = (): void => {
        this.setState({
            swapDetails: null,
            origin: "",
        });
    }

    private readonly setWithdrawRequest = (withdrawRequest: IPartialWithdrawRequest | null): void => {
        this.setState({ withdrawRequest });
    }

    // Check if user has an account set-up
    private readonly callGetAccount = async () => {
        const { login: { password }, trader: { network } } = this.props.container.state;
        try {
            await fetchInfo({ network: network, password: password || "" });

            const { networkDetails } = this.state;
            const balances: IBalances | null = networkDetails.get(network).balances;
            this.setState({
                networkDetails: networkDetails.set(network, networkDetails.get(network).set("balances", balances)),
            });

            if (!this.state.accountExists) { this.setState({ accountExists: true }); }
        } catch (e) {
            console.error(e.response && e.response.data.error || e);
        }

        if (this.callGetAccountTimeout) { clearTimeout(this.callGetAccountTimeout); }
        this.callGetAccountTimeout = setTimeout(this.callGetAccount, 10 * 1000);
    }
}

interface IAppProps extends ConnectedProps {
}

interface IAppState {
    networkDetails: NetworkState;

    origin: string;
    mnemonic: string;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
}

export const App = connect<IAppProps>(AppContainer)(AppClass);
