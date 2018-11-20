import * as React from "react";

import { getBalances, getSwaps, IBalancesResponse, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse } from "../lib/swapperd";
import { ApproveSwap } from "./ApproveSwap";
import { ApproveWithdraw } from "./ApproveWithdraw";
import { Balances } from "./Balances";
import { CreateAccount } from "./CreateAccount";
import { Swaps } from "./Swaps";

interface IAppState {
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
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
            swaps: null,
        }
        this.accountCreated = this.accountCreated.bind(this);
        this.setSwapDetails = this.setSwapDetails.bind(this);
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
        const { accountExists, swapDetails, withdrawRequest, balances, balancesError, swaps } = this.state;

        if (!accountExists) {
            return <div className="app">
                <CreateAccount resolve={this.accountCreated} />
            </div>
        }

        if (swapDetails) {
            return <div className="app">
                <ApproveSwap swapDetails={swapDetails} setSwapDetails={this.setSwapDetails} />
            </div>
        }

        if (withdrawRequest) {
            return <div className="app">
                <ApproveWithdraw
                    balances={balances}
                    withdrawRequest={withdrawRequest}
                    setWithdrawRequest={this.setWithdrawRequest}
                />
            </div>
        }

        return <div className="app">
            <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
            <Swaps swaps={swaps} />
        </div>;
    }

    private accountCreated(): void {
        this.setState({ accountExists: true });
        (window as any).ipcRenderer.sendSync("notify", "Account creation successful!");
    }

    private setSwapDetails(swapDetails: IPartialSwapRequest): void {
        (window as any).ipcRenderer.send('swap-response', swapDetails);
        this.setState({ swapDetails: null });
    }

    private setWithdrawRequest(withdrawRequest: IPartialWithdrawRequest | null): void {
        this.setState({ withdrawRequest });
    }
}

export default App;
