import BigNumber from "bignumber.js";
import * as React from "react";

import { getLogo } from "src/lib/logos";
import { IBalances, IPartialWithdrawRequest, IWithdrawRequest, submitWithdraw } from "../lib/swapperd";
import { Banner } from "./Banner";
import { Loading } from "./Loading";

interface IApproveWithdrawProps {
    network: string;
    balances: null | IBalances;
    withdrawRequest: IPartialWithdrawRequest;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest | null) => void;
}

interface IApproveWithdrawState {
    gettingPassword: boolean;
    password: string;
    to: string;
    amount: string;
    loading: boolean;
    error: null | string;
}

export class ApproveWithdraw extends React.Component<IApproveWithdrawProps, IApproveWithdrawState> {
    constructor(props: IApproveWithdrawProps) {
        super(props);
        this.state = {
            gettingPassword: false,
            amount: "",
            to: "",
            password: "",
            loading: false,
            error: null,
        };

        this.handleInput = this.handleInput.bind(this);
        this.onWithdraw = this.onWithdraw.bind(this);
        this.onAccept = this.onAccept.bind(this);
        this.onReject = this.onReject.bind(this);
    }

    public render(): JSX.Element {
        const { withdrawRequest } = this.props;
        const { gettingPassword, password, loading, amount, to, error } = this.state;
        return (
            <>
                <Banner title="Transfer" disabled={loading} reject={this.onReject} />
                <div className="withdraw">
                    {!loading ?
                        <>
                            <div className="withdraw--balance">
                                <img src={getLogo(withdrawRequest.token)} />
                                <p>Available: {this.getAvailable().toString()} {withdrawRequest.token}</p>
                            </div>
                            <div className="withdraw--inputs">
                                <input type="number" placeholder="Amount" value={amount} name="amount" onChange={this.handleInput} />
                                <input type="text" placeholder="To" value={to} name="to" onChange={this.handleInput} />
                                {gettingPassword ?
                                    <>
                                        <input type="password" placeholder="Password" value={password} name="password" onChange={this.handleInput} />
                                        <button onClick={this.onAccept}><span>Accept</span></button>
                                    </>
                                    :
                                    <button onClick={this.onWithdraw}><span>Transfer</span></button>
                                }
                            </div>
                            {error ? <p className="error">{error}</p> : null}
                        </>
                        :
                        <Loading />
                    }
                </div>
            </>
        );
    }

    private handleInput(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private getAvailable(): BigNumber {
        const { balances, withdrawRequest } = this.props;
        if (balances === null) {
            return new BigNumber(0);
        }
        const available = balances.get(withdrawRequest.token);
        if (!available) {
            return new BigNumber(0);
        }
        return available.balance;
    }

    private onWithdraw(): void {
        const { amount, to } = this.state;
        const available = this.getAvailable();
        const amountBN = new BigNumber(amount);
        if (to === "") {
            this.setState({ error: "Please enter an address." });
            return;
        }
        if (amountBN.gt(0) && amountBN.lte(available)) {
            this.setState({ gettingPassword: true });
        } else {
            this.setState({ error: "Please enter a valid amount." });
            return;
        }
    }

    private async onAccept(): Promise<void> {
        const { withdrawRequest, network } = this.props;
        const { password, to, amount } = this.state;
        this.setState({ error: null, loading: true });

        const request: IWithdrawRequest = {
            token: withdrawRequest.token,
            to,
            amount,
        };

        try {
            await submitWithdraw(request, password, { network });
            this.props.setWithdrawRequest(null);
        } catch (e) {
            console.error(e);
            this.setState({ error: `There was an error submitting your request. ${e}` });
        }

        (window as any).ipcRenderer.sendSync("notify", `${amount} ${withdrawRequest.token} transfer successful.`);
        this.setState({ loading: false });
    }

    private onReject(): void {
        this.props.setWithdrawRequest(null);
    }
}
