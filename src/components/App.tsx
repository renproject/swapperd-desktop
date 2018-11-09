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

    constructor(props: {}) {
        super(props);
        this.state = {
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
        }
    }

    public async componentDidMount() {
        this.setState({ balancesError: null });
        try {
            const balances = await getBalances();
            this.setState({ balances });
        } catch (err) {
            this.setState({ balancesError: err.message });
        }
    }

    public render() {
        const { swapDetails, withdrawRequest, balances, balancesError } = this.state;

        if (swapDetails) {
            return <div className="app">
                <Banner title="Approve swap" />
                <ApproveSwap swapDetails={swapDetails} />
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
}

export default App;
