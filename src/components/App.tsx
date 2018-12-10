import * as React from "react";

import { checkAccountExists, getBalances, getSwaps, IBalances, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse, MAINNET_REF } from "../lib/swapperd";
import { AcceptMnemonic } from "./AcceptMnemonic";
import { ApproveSwap } from "./ApproveSwap";
import { ApproveWithdraw } from "./ApproveWithdraw";
import { Balances } from "./Balances";
import { CreateAccount } from "./CreateAccount";
import { Header } from "./Header";
import { Swaps } from "./Swaps";

interface IAppState {
    network: string;
    mnemonic: string;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
    balances: IBalances | null;
    balancesError: string | null;
    swaps: ISwapsResponse | null;
}

class App extends React.Component<{}, IAppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            network: MAINNET_REF,
            mnemonic: "",
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
            swaps: null,
        };
        this.setNetwork = this.setNetwork.bind(this);
        this.mnemonicSaved = this.mnemonicSaved.bind(this);
        this.accountCreated = this.accountCreated.bind(this);
        this.resetSwapDetails = this.resetSwapDetails.bind(this);
        this.setWithdrawRequest = this.setWithdrawRequest.bind(this);
    }

    public async componentDidMount() {
        // Check if user has an account set-up
        const accountExists = checkAccountExists({ network: this.state.network });
        this.setState({ accountExists });

        (window as any).ipcRenderer.on("swap", (event: any, ...args: any) => {
            try {
                console.log(args[0]);
                this.setState({ swapDetails: args[0] });
            } catch (e) {
                console.log(e);
            }
        });

        // Check balances and swaps on an interval
        setInterval(async () => {
            if (this.state.accountExists) {
                try {
                    const balances = await getBalances({ network: this.state.network });
                    this.setState({ balances });
                } catch (e) {
                    console.error(e);
                    this.setState({ balancesError: `Unable to retrieve balances. Error: ${e}` });
                }
            }
        }, 2000);

        setInterval(async () => {
            if (this.state.accountExists) {
                try {
                    const swaps = await getSwaps({ network: this.state.network });
                    this.setState({ swaps });
                } catch (e) {
                    console.error(e);
                }
            }
        }, 5000);
    }

    public render(): JSX.Element {
        const { mnemonic, accountExists, swapDetails, withdrawRequest, balances, balancesError, swaps } = this.state;

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

        if (swapDetails) {
            return <div className="app">
                <Header network={this.state.network} setNetwork={this.setNetwork} />
                <ApproveSwap
                    network={this.state.network}
                    swapDetails={swapDetails}
                    resetSwapDetails={this.resetSwapDetails}
                />
            </div>;
        }

        if (withdrawRequest) {
            return <div className="app">
                <Header network={this.state.network} setNetwork={this.setNetwork} />
                <ApproveWithdraw
                    network={this.state.network}
                    balances={balances}
                    withdrawRequest={withdrawRequest}
                    setWithdrawRequest={this.setWithdrawRequest}
                />
            </div>;
        }

        return <div className="app">
            <Header network={this.state.network} setNetwork={this.setNetwork} />
            <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
            <Swaps swaps={swaps} />
        </div>;
    }

    private setNetwork(network: string): void {
        this.setState({ network });
    }

    private mnemonicSaved(): void {
        this.setState({ mnemonic: "" });
    }

    private accountCreated(mnemonic: string): void {
        this.setState({ accountExists: true, mnemonic });
        (window as any).ipcRenderer.sendSync("notify", `Account ${mnemonic === "" ? "restored successfully!" : "creation successful!"}`);
    }

    private resetSwapDetails(): void {
        this.setState({ swapDetails: null });
    }

    private setWithdrawRequest(withdrawRequest: IPartialWithdrawRequest | null): void {
        this.setState({ withdrawRequest });
    }
}

export default App;
