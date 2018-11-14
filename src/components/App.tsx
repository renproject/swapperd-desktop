import * as React from 'react';

import '../styles/App.css';

import ApproveSwap from './ApproveSwap';

import { getBalances, IBalancesResponse, IPartialSwapRequest, IPartialWithdrawRequest } from '../lib/swapperd';
import { ApproveWithdraw } from './ApproveWithdraw';
import { Balances } from './Balances';
import { Banner } from './Banner';

interface IAppState {
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
    balances: IBalancesResponse | null;
    balancesError: string | null;
}

class App extends React.Component<{}, IAppState> {
    private msg: string;

    constructor(props: {}) {
        super(props);
        this.state = {
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
        }
        this.reject = this.reject.bind(this);
    }

    public async componentDidMount() {
        this.setState({ balancesError: null });
        try {
            const balances = await getBalances();
            this.setState({ balances });
        } catch (err) {
            this.setState({ balancesError: err.message });
        }

        const ws = new WebSocket('ws://localhost:8080');
        ws.onopen = () => {
            ws.send("connect");
        };
        ws.onmessage = (evt) => {
            try {
                this.msg = evt.data;
                const swapDetails = JSON.parse(evt.data);
                this.setState({ swapDetails });
            } catch (e) {
                console.log(e);
            }
        };
    }

    public render() {
        const { swapDetails, withdrawRequest, balances, balancesError } = this.state;

        if (swapDetails) {
            return <div className="app">
                <p>{this.msg}</p>
                <Banner title="Approve swap" />
                <ApproveSwap swapDetails={swapDetails} reject={this.reject} />
            </div>
        }

        if (swapDetails) {
            return <div className="app">
                <p>{this.msg}</p>
                <Banner title="Approve swap" />
                <ApproveSwap swapDetails={swapDetails} reject={this.reject} />
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

    private reject(): void {
        this.setState({ swapDetails: null });
    }
}

export default App;
