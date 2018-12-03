import * as React from "react";

import { getLogo } from "src/lib/logos";
import { IBalancesResponse, IPartialWithdrawRequest, IWithdrawRequest, submitWithdraw } from "../lib/swapperd";
import { Banner } from "./Banner";
import { Loading } from "./Loading";

interface IApproveWithdrawProps {
    balances: null | IBalancesResponse;
    withdrawRequest: IPartialWithdrawRequest;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest | null) => void;
}

interface IApproveWithdrawState {
    gettingPassword: boolean;
    password: string;
    to: string;
    amount: string;
    available: string;
    loading: boolean;
    error: null | string;
}

export class ApproveWithdraw extends React.Component<IApproveWithdrawProps, IApproveWithdrawState> {
    constructor(props: IApproveWithdrawProps) {
        super(props);
        this.state = {
            gettingPassword: false,
            available: "-",
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

    public componentDidMount(): void {
        this.componentWillReceiveProps(this.props);
    }

    public componentWillReceiveProps(props: IApproveWithdrawProps): void {
        if (props.balances) {
            for (const balanceItem of props.balances.balances) {
                if (balanceItem.token === this.props.withdrawRequest.token) {
                    this.setState({ available: balanceItem.amount });
                    break;
                }
            }
        }
    }

    public render(): JSX.Element {
        const { withdrawRequest } = this.props;
        const { gettingPassword, available, password, loading, amount, to, error } = this.state;
        return (
            <>
                <Banner title="Transfer" disabled={loading} reject={this.onReject} />
                <div className="withdraw">
                    {!loading ?
                        <>
                            <div className="withdraw--balance">
                                <img src={getLogo(withdrawRequest.token)} />
                                <p>Available: {available} {withdrawRequest.token}</p>
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

    private onWithdraw(): void {
        const { available, to, amount } = this.state;
        if (to === "") {
            this.setState({ error: "Please enter an address." });
            return;
        }
        if (parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(available)) {
            this.setState({ gettingPassword: true });
        } else {
            this.setState({ error: "Please enter a valid amount." });
            return;
        }
    }

    private async onAccept(): Promise<void> {
        const { withdrawRequest } = this.props;
        const { password, to, amount } = this.state;
        this.setState({ error: null, loading: true });

        const request: IWithdrawRequest = {
            token: withdrawRequest.token,
            to,
            amount,
        };

        try {
            await submitWithdraw(request, password);
            this.props.setWithdrawRequest(null);
        } catch (e) {
            console.error(e);
            this.setState({ error: `There was an error submitting your request. Error: ${e}` });
        }

        (window as any).ipcRenderer.sendSync("notify", `${amount} ${withdrawRequest.token} transfer successful.`);
        this.setState({ loading: false });
    }

    private onReject(): void {
        this.props.setWithdrawRequest(null);
    }
}
