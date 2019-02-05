import * as React from "react";

import BigNumber from "bignumber.js";

import { OrderedMap } from "immutable";
import { connect, ConnectedReturnType } from "react-redux"; // Custom typings
import { bindActionCreators, Dispatch } from "redux";

import { SwapResponseValue } from "../../common/ipc";
import { ipc } from "../ipc";
import { Record } from "../lib/record";
import { fetchInfo, getBalances, getSwaps, getTransfers, IBalances, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse, ITransfersResponse, Network } from "../lib/swapperd";
import { setPassword } from "../store/actions/login/loginActions";
import { ApplicationData } from "../store/storeTypes";
import { AcceptMnemonic } from "./AcceptMnemonic";
import { ApproveSwap } from "./ApproveSwap";
import { ApproveWithdraw } from "./ApproveWithdraw";
import { Balances } from "./Balances";
import { CreateAccount } from "./CreateAccount";
import { Header } from "./Header";
import { Swaps } from "./Swaps";
import { UnlockScreen } from "./UnlockScreen";

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

class AppClass extends React.Component<Props, IAppState> {
    private callGetBalancesTimeout: NodeJS.Timer | undefined;
    private callGetAccountTimeout: NodeJS.Timer | undefined;
    private callGetTransactionsTimeout: NodeJS.Timer | undefined;

    constructor(props: Props) {
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

        ipc.on("swap", (swap: SwapResponseValue) => {
            try {
                const network = swap.network ? swap.network : this.state.network;
                const origin = swap.origin ? swap.origin : this.state.origin;
                this.setState({ swapDetails: swap.body, network, origin });
            } catch (error) {
                console.error(error);
            }
        }, { dontReply: true });

        ipc.on("get-password", () => {
            const { store: { password } } = this.props;
            if (password === null) {
                throw new Error("Swapperd locked");
            }
            return password;
        });

        // on("get-balances", () => {
        //     const { networkDetails, network } = this.state;
        //     return networkDetails.get(network).balances || {};
        // });

        ipc.on("get-network", () => {
            return this.state.network;
        });

        ipc.on("get-version", () => {
            return version;
        });

        this.callGetAccount().catch(console.error);

        // Check balances and swaps on an interval
        const callGetBalances = async () => {
            const { store: { password } } = this.props;

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
            const { store: { password } } = this.props;
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
        const { store: { password } } = this.props;

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
        this.props.actions.setPassword(password);
    }

    private readonly setNetwork = (network: Network): void => {
        this.setState({ network }, async () => this.callGetAccount().catch(console.error));
    }

    private readonly mnemonicSaved = (): void => {
        this.setState({ mnemonic: "" });
    }

    private readonly accountCreated = (mnemonic: string, password: string): void => {
        this.setState({ accountExists: true, mnemonic });
        this.props.actions.setPassword(password);
        ipc.sendToMain(
            "notify",
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
        const { store: { password } } = this.props;
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

const mapStateToProps = (state: ApplicationData) => ({
    store: {
        password: state.login.password,
    },
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        setPassword,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
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

export const App = connect(mapStateToProps, mapDispatchToProps)(AppClass);
