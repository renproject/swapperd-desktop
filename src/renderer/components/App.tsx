import * as React from "react";

import BigNumber from "bignumber.js";

import { OrderedMap } from "immutable";
import { Subscribe } from "unstated";

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
import { fetchInfo, getBalances, getSwaps, getTransfers, IBalances, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse, ITransfersResponse, Network } from "@/lib/swapperd";
import { AppContainer } from "@/store/containers/appContainer";
import { GetNetworkRequest, GetNetworkResponse, GetPasswordRequest, GetPasswordResponse, GetVersionRequest, GetVersionResponse, Message, NotifyRequest, SwapRequest, SwapResponse, SwapResponseValue } from "common/ipc";

// import { version } from "../../../package.json";
const version = "";

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
            network: Network.Mainnet,
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

        ipc.on<SwapRequest, SwapResponse>(Message.Swap, (swap: SwapResponseValue) => {
            try {
                const network = swap.network ? swap.network : this.state.network;
                const origin = swap.origin ? swap.origin : this.state.origin;
                this.setState({ swapDetails: swap.body, network, origin });
            } catch (error) {
                console.error(error);
            }
        }, { dontReply: true });

        ipc.on<GetPasswordRequest, GetPasswordResponse>(Message.GetPassword, () => {
            const { password } = this.props.container.state.login;
            if (password === null) {
                throw new Error("Swapperd locked");
            }
            return password;
        });

        // on("get-balances", () => {
        //     const { networkDetails, network } = this.state;
        //     return networkDetails.get(network).balances || {};
        // });

        ipc.on<GetNetworkRequest, GetNetworkResponse>(Message.GetNetwork, () => {
            return this.state.network;
        });

        ipc.on<GetVersionRequest, GetVersionResponse>(Message.GetVersion, () => {
            return version;
        });

        this.callGetAccount().catch(console.error);

        // Check balances and swaps on an interval
        const callGetBalances = async () => {
            const { password } = this.props.container.state.login;

            const { accountExists, network } = this.state;

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
                    const { network } = this.state;
                    const swaps = await getSwaps({ network, password: password });

                    const { networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("swaps", swaps)) });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
                try {
                    const { network } = this.state;
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
        const { password } = this.props.container.state.login;

        const { mnemonic, accountExists, swapDetails, withdrawRequest, networkDetails, network } = this.state;
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

    private readonly setUnlocked = (password: string): void => {
        this.props.container.setPassword(password)
            .catch(console.error);
    }

    private readonly setNetwork = (network: Network): void => {
        this.setState({ network }, async () => this.callGetAccount().catch(console.error));
    }

    private readonly mnemonicSaved = (): void => {
        this.setState({ mnemonic: "" });
    }

    private readonly accountCreated = (mnemonic: string, password: string): void => {
        this.setState({ accountExists: true, mnemonic });
        this.props.container.setPassword(password)
            .catch(console.error);
        ipc.sendToMain<NotifyRequest>(
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
        const { password } = this.props.container.state.login;
        const { network } = this.state;
        try {
            const response = await fetchInfo({ network: network, password: password || "" });

            const { networkDetails } = this.state;
            let balances: IBalances | null = networkDetails.get(network).balances;

            if (!balances || balances.size === 0) {

                balances = OrderedMap();

                const supportedTokens = response.supportedTokens;
                for (const token of supportedTokens) {
                    balances = balances.set(token.name, {
                        address: "",
                        balance: new BigNumber(0),
                    });
                }

                this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("balances", balances)) });
            }

            if (!this.state.accountExists) { this.setState({ accountExists: true }); }
        } catch (e) {
            console.error(e.response && e.response.data.error || e);
        }

        if (this.callGetAccountTimeout) { clearTimeout(this.callGetAccountTimeout); }
        this.callGetAccountTimeout = setTimeout(this.callGetAccount, 10 * 1000);
    }
}

interface IAppProps {
    container: AppContainer;
}

interface IAppState {
    network: Network;

    networkDetails: NetworkState;

    origin: string;
    mnemonic: string;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
}

export const App = () => {
    return (
        <Subscribe to={[AppContainer]}>
            {(container: AppContainer) => (
                <AppClass container={container} />
            )}
        </Subscribe>
    );
};
