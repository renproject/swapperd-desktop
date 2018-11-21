import * as React from "react";

import { getBalances, getSwaps, IBalancesResponse, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse } from "../lib/swapperd";
import { AcceptMnemonic } from "./AcceptMnemonic";
import { ApproveSwap } from "./ApproveSwap";
import { ApproveWithdraw } from "./ApproveWithdraw";
import { Balances } from "./Balances";
import { CreateAccount } from "./CreateAccount";
import { Header } from "./Header";
import { Swaps } from "./Swaps";

interface IAppState {
    mnemonic: string;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
    balances: IBalancesResponse | null;
    balancesError: string | null;
    swaps: ISwapsResponse | null;
}

class App extends React.Component<{}, IAppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            mnemonic: "",
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
            swaps: null,
        };
        this.mnemonicSaved = this.mnemonicSaved.bind(this);
        this.accountCreated = this.accountCreated.bind(this);
        this.resetSwapDetails = this.resetSwapDetails.bind(this);
        this.setWithdrawRequest = this.setWithdrawRequest.bind(this);
    }

    public async componentDidMount() {
        // Check if user has an account set-up
        const xhr = new XMLHttpRequest();
        try {
            xhr.open("GET", "http://localhost:7927/whoami", false);
            xhr.send("");
            this.setState({ accountExists: true });
        } catch (e) {
            console.error(e);
        }

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
                    const balances = await getBalances();
                    this.setState({ balances });
                } catch (e) {
                    console.error(e);
                    this.setState({ balancesError: "Unable to retrieve balances. Please try again later." });
                }
            }
        }, 2000);

        setInterval(async () => {
            if (this.state.accountExists) {
                try {
                    const swaps = await getSwaps();
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
                <Header />
                <AcceptMnemonic mnemonic={mnemonic} resolve={this.mnemonicSaved} />
            </div>;
        }

        if (!accountExists) {
            return <div className="app">
                <Header />
                <CreateAccount resolve={this.accountCreated} />
            </div>;
        }

        if (swapDetails) {
            return <div className="app">
                <Header />
                <ApproveSwap swapDetails={swapDetails} resetSwapDetails={this.resetSwapDetails} />
            </div>;
        }

        if (withdrawRequest) {
            return <div className="app">
                <Header />
                <ApproveWithdraw
                    balances={balances}
                    withdrawRequest={withdrawRequest}
                    setWithdrawRequest={this.setWithdrawRequest}
                />
            </div>;
        }

        return <div className="app">
            <Header />
            <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
            <Swaps swaps={swaps} />
        </div>;
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
