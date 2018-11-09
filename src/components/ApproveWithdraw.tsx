import * as React from 'react';

import { getLogo } from 'src/lib/logos';
import { IBalancesResponse, IPartialWithdrawRequest, ISwapRequest, IWithdrawRequest, submitWithdraw } from '../lib/swapperd';

interface IApproveWithdrawProps {
    withdrawRequest: IPartialWithdrawRequest;
    balances: null | IBalancesResponse;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest | null) => void;
}

interface IApproveWithdrawState {
    gettingPassword: boolean;
    error: null | string;
    loading: boolean;
    response: null | ISwapRequest;
    username: string;
    password: string;
    to: string;
    amount: string;
    available: string;
}


export class ApproveWithdraw extends React.Component<IApproveWithdrawProps, IApproveWithdrawState> {
    constructor(props: IApproveWithdrawProps) {
        super(props);

        this.state = {
            gettingPassword: false,
            error: null,
            loading: false,
            response: null,
            username: "",
            password: "",
            to: "",
            amount: "",
            available: "-",
        };

        this.componentWillReceiveProps(props);
    }

    public componentWillReceiveProps(props: IApproveWithdrawProps) {
        if (props.balances) {
            for (const balanceItem of props.balances.balances) {
                if (balanceItem.token === this.props.withdrawRequest.token) {
                    this.setState({ available: balanceItem.amount });
                    break;
                }
            }
        }
    }

    public render() {
        const { withdrawRequest } = this.props;
        const { available, gettingPassword, username, password, loading, error, amount, to } = this.state;
        return (

            <div className="approve-withdraw">

                <img src={getLogo(withdrawRequest.token)} />
                <p>Withdraw {withdrawRequest.token}</p>
                <p>Available: {available} {withdrawRequest.token}</p>

                <div className="button-list">

                    <input className={`retro--grey ${gettingPassword ? "disabled" : ""}`} placeholder="Amount" value={amount} name="amount" onChange={this.handleInput} disabled={loading} />
                    <input className={`retro--grey ${gettingPassword ? "disabled" : ""}`} placeholder="To" value={to} name="to" onChange={this.handleInput} disabled={loading} />

                    {gettingPassword ?
                        <>
                            <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Username" value={username} name="username" onChange={this.handleInput} disabled={loading} />
                            <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} type="password" />
                            <div className={`button retro--blue ${loading ? "disabled" : ""}`} onClick={this.onAccept2}>Accept</div>
                        </> :
                        <div className={`button retro--blue ${loading ? "disabled" : ""}`} onClick={this.onAccept1}>Withdraw</div>
                    }
                    <div className={`button retro--grey ${loading ? "disabled" : ""}`} onClick={this.onReject}>Cancel</div>

                </div>
                {error ? <p className="retro--red">{error}</p> : null}
            </div>
        );
    }

    private handleInput = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private onAccept1 = async () => {
        this.setState({ gettingPassword: true });
    }

    private onReject = async () => {
        this.props.setWithdrawRequest(null);
    }

    private onAccept2 = async () => {
        const { withdrawRequest } = this.props;
        const { password, username, to, amount } = this.state;
        this.setState({ error: null, loading: true });

        const request: IWithdrawRequest = {
            token: withdrawRequest.token,
            to,
            amount,
        };

        try {
            await submitWithdraw(request, username, password);
            this.props.setWithdrawRequest(null);
        } catch (err) {
            this.setState({ error: err.message || err });
        }

        this.setState({ loading: false, gettingPassword: false });
    }
}
