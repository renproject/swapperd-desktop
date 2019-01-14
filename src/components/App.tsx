import * as React from "react";

import { fetchAccountStatus, getBalances, getSwaps, getTransfers, IBalances, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse, ITransfersResponse, MAINNET_REF } from "../lib/swapperd";
import { AcceptMnemonic } from "./AcceptMnemonic";
import { ApproveSwap } from "./ApproveSwap";
import { ApproveWithdraw } from "./ApproveWithdraw";
import { Balances } from "./Balances";
import { CreateAccount } from "./CreateAccount";
import { Header } from "./Header";
import { Swaps } from "./Swaps";
import { UnlockScreen } from "./UnlockScreen";

interface IAppState {
    password: string;
    network: string;
    origin: string;
    mnemonic: string;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
    balances: IBalances | null;
    balancesError: string | null;
    swaps: ISwapsResponse | null;
    transfers: ITransfersResponse | null;
}

class App extends React.Component<{}, IAppState> {
    private callGetBalancesTimeout: NodeJS.Timer | undefined;
    private callGetAccountTimeout: NodeJS.Timer | undefined;
    private callGetTransactionsTimeout: NodeJS.Timer | undefined;

    constructor(props: {}) {
        super(props);
        this.state = {
            network: MAINNET_REF,
            origin: "",
            mnemonic: "",
            password: "",
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
            swaps: null,
            transfers: null,
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
        (window as any).ipcRenderer.on("swap", (event: any, ...args: any) => {
            try {
                const network = args[1] ? args[1] : this.state.network;
                const origin = args[2] ? args[2] : this.state.origin;
                this.setState({ swapDetails: args[0], network, origin });
            } catch (e) {
                console.log(e);
            }
        });

        // Check if user has an account set-up
        const callGetAccount = async () => {
            try {
                const status = await fetchAccountStatus({ network: this.state.network, password: this.state.password });
                const accountExists = status !== "none";                
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
            if (this.state.accountExists && this.state.password !== "") {
                try {
                    const balances = await getBalances({ network: this.state.network, password: this.state.password });
                    if (!balances.equals(this.state.balances)) {
                        this.setState({ balances });
                    }
                } catch (e) {
                    console.error(e);
                    this.setState({ balancesError: `Unable to retrieve balances. ${e}` });
                }
            }
            this.callGetBalancesTimeout = setTimeout(callGetBalances, 2 * 1000);
        };
        callGetBalances().catch(console.error);

        const callGetTransactions = async () => {
            if (this.state.accountExists && this.state.password !== "") {
                try {
                    const swaps = await getSwaps({ network: this.state.network, password: this.state.password });
                    this.setState({ swaps });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
                try {
                    const transfers = await getTransfers({ network: this.state.network, password: this.state.password });
                    this.setState({ transfers });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
            }
            this.callGetTransactionsTimeout = setTimeout(callGetTransactions, 5 * 1000);
        };
        callGetTransactions().catch(console.error);
    }

    public render(): JSX.Element {
        const { mnemonic, accountExists, swapDetails, withdrawRequest, balances, balancesError, swaps, transfers } = this.state;

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

        if (accountExists && this.state.password === "") {
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

        if (accountExists && this.state.password !== "") {
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

    private setNetwork(network: string): void {
        this.setState({ network, balances: null, balancesError: "", swaps: null, transfers: null });
    }

    private mnemonicSaved(): void {
        this.setState({ mnemonic: "" });
    }

    private accountCreated(mnemonic: string, password: string): void {
        this.setState({ accountExists: true, mnemonic, password });
        (window as any).ipcRenderer.sendSync("notify", `Account ${mnemonic === "" ? "imported successfully!" : "creation successful!"}`);
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
