import * as React from 'react';

import '../styles/App.css';

import ApproveSwap from './ApproveSwap';

import { getBalances, IBalancesResponse, IPartialSwapRequest, IPartialWithdrawRequest } from '../lib/swapperd';
import { ApproveWithdraw } from './ApproveWithdraw';
import { Balances } from './Balances';
import { Banner } from './Banner';
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
    }

    public async componentDidMount() {
        const xhr = new XMLHttpRequest();
        try {
            xhr.open("GET", "http://localhost:7777/whoami", false);
            xhr.send("");
            this.setState({ accountExists: true });
        } catch (e) {
            console.log(e);
        }

        try {
            const balances = await getBalances();
            this.setState({ balances });
        } catch (err) {
            this.setState({ balancesError: err.message });
        }

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
                <Banner title="Create account" />
                <CreateAccount resolve={this.accountCreated} />
            </div>
        }

        if (swapDetails) {
            return <div className="app">
                <Banner title="Approve swap" />
                <ApproveSwap socket={socket} swapDetails={swapDetails} reset={this.resetSwapDetails} />
            </div>
        }

        if (withdrawRequest) {
            return <div className="app">
                <Banner title="Withdraw" />
                <ApproveWithdraw
                    setWithdrawRequest={this.setWithdrawRequest}
                    withdrawRequest={withdrawRequest}
                    balances={balances}
                />
            </div>
        }

        return <div className="app">
            <Banner title="Balances" />
            <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
        </div>;
    }

    public setWithdrawRequest = (withdrawRequest: IPartialWithdrawRequest | null) => {
        this.setState({ withdrawRequest });
    }

    private accountCreated(): void {
        this.setState({ accountExists: true });

        setTimeout(async () => {
            try {
                const balances = await getBalances();
                this.setState({ balances });
            } catch (err) {
                this.setState({ balancesError: err.message });
            }
        }, 2000);
    }

    private resetSwapDetails(): void {
        this.setState({ swapDetails: null });
    }
}

export default App;
