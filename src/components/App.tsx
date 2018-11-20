import * as React from 'react';

import { getBalances, IBalancesResponse, IPartialSwapRequest, IPartialWithdrawRequest } from '../lib/swapperd';
import { ApproveSwap } from './ApproveSwap';
import { ApproveWithdraw } from './ApproveWithdraw';
import { Balances } from './Balances';
import { CreateAccount } from './CreateAccount';

interface IAppState {
    socket: WebSocket | null;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
    balances: IBalancesResponse | null;
    balancesError: string | null;
}

class App extends React.Component<{}, IAppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            socket: null,
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
        }
        this.accountCreated = this.accountCreated.bind(this);
        this.resetSwapDetails = this.resetSwapDetails.bind(this);
        this.setWithdrawRequest = this.setWithdrawRequest.bind(this);
    }

    public async componentDidMount() {
        // Check if user has an account set-up
        const xhr = new XMLHttpRequest();
        try {
            xhr.open("GET", "http://localhost:7777/whoami", false);
            xhr.send("");
            this.setState({ accountExists: true });
        } catch (e) {
            console.log(e);
        }

        // Check balances on an interval
        setInterval(async () => {
            try {
                const balances = await getBalances();
                this.setState({ balances });
            } catch (err) {
                this.setState({ balancesError: err.message });
            }
        }, 2000);

        // Set-up WebSockets for interacting with the client website
        const ws = new WebSocket('ws://localhost:8080');
        const socket = new WebSocket('ws://localhost:8081');
        this.setState({ socket });
        ws.onopen = () => {
            ws.send("connect");
        };
        ws.onmessage = (evt) => {
            try {
                const swapDetails = JSON.parse(evt.data);
                this.setState({ swapDetails });
            } catch (e) {
                console.log(e);
            }
        };
    }

    public render() {
        const { socket, accountExists, swapDetails, withdrawRequest, balances, balancesError } = this.state;

        if (!accountExists) {
            return <div className="app">
                <h1>Create account</h1>
                <CreateAccount resolve={this.accountCreated} />
            </div>
        }

        if (swapDetails) {
            return <div className="app">
                <h1>Approve swap</h1>
                <ApproveSwap socket={socket} swapDetails={swapDetails} reset={this.resetSwapDetails} />
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
        </div>;
    }

    private accountCreated(): void {
        this.setState({ accountExists: true });
    }

    private resetSwapDetails(): void {
        this.setState({ swapDetails: null });
    }

    private setWithdrawRequest(withdrawRequest: IPartialWithdrawRequest | null): void {
        this.setState({ withdrawRequest });
    }
}

export default App;
