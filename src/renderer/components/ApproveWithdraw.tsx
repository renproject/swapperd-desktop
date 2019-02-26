import * as React from "react";

import BigNumber from "bignumber.js";
import KeyBinding from "react-keybinding-component";

import { Banner } from "@/components/Banner";
import { Loading } from "@/components/Loading";
import { getLogo } from "@/lib/logos";
import { IBalances, IPartialWithdrawRequest, IWithdrawRequest, submitWithdraw } from "@/lib/swapperd";
import { connect, ConnectedProps } from "@/store/connect";
import { OptionsContainer } from "@/store/containers/optionsContainer";

interface IApproveWithdrawProps extends ConnectedProps {
    network: string;
    balances: null | IBalances;
    withdrawRequest: IPartialWithdrawRequest;
    setWithdrawRequest(withdrawRequest: IPartialWithdrawRequest | null): void;
}

interface IApproveWithdrawState {
    gettingPassword: boolean;
    password: string;
    to: string;
    amount: string;
    loading: boolean;
    error: null | string;
    sendAllChecked: boolean;
}

class ApproveWithdrawClass extends React.Component<IApproveWithdrawProps, IApproveWithdrawState> {
    private readonly optionsContainer: OptionsContainer;

    constructor(props: IApproveWithdrawProps) {
        super(props);
        this.state = {
            gettingPassword: false,
            amount: "",
            to: "",
            password: "",
            loading: false,
            error: null,
            sendAllChecked: false,
        };

        this.handleInput = this.handleInput.bind(this);
        this.onWithdraw = this.onWithdraw.bind(this);
        this.onAccept = this.onAccept.bind(this);
        this.onReject = this.onReject.bind(this);

        [this.optionsContainer] = this.props.containers;
    }

    public render(): JSX.Element {
        const { withdrawRequest } = this.props;
        const { sendAllChecked, gettingPassword, password, loading, amount, to, error } = this.state;
        const available = this.getAvailable().toFixed();
        return (
            <>
                <KeyBinding onKey={this.onEscape} />
                <Banner title="Transfer" disabled={loading} reject={this.onReject} />
                <div className="withdraw">
                    {!loading ?
                        <>
                            <div className="withdraw--balance">
                                <img alt="" role="presentation" src={getLogo(withdrawRequest.token)} />
                                <p>Available: {available} {withdrawRequest.token}</p>
                            </div>
                            <div className="withdraw--inputs">
                                <input type="text" disabled={gettingPassword} placeholder="To" value={to} name="to" onChange={this.handleInput} />
                                <input type="number" disabled={gettingPassword} placeholder="Amount" value={amount} name="amount" onChange={this.handleInput} />
                                <div className="fill--amount">
                                    <label>
                                        <input type="checkbox" disabled={gettingPassword} checked={sendAllChecked} onChange={this.handleCheckBox} /> Transfer all available funds
                                    </label>
                                </div>
                                {gettingPassword ?
                                    <form className="withdraw--confirm" onSubmit={this.onAccept}>
                                        <input type="password" placeholder="Password" value={password} name="password" onChange={this.handleInput} />
                                        <input type="submit" style={{ display: "none", visibility: "hidden" }} />
                                        <div className="input-group">
                                            <button className="cancel" onClick={this.cancelWithdraw}>Cancel</button>
                                            <button disabled={!password} type="submit">Transfer</button>
                                        </div>
                                    </form>
                                    :
                                    <>
                                        <button disabled={!to || !amount} onClick={this.onWithdraw}>Confirm</button>
                                    </>
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

    private readonly onEscape = (event: KeyboardEvent): void => {
        if (event.keyCode === 27) {
            this.onReject();
        }
    }

    private readonly cancelWithdraw = () => {
        this.setState({ gettingPassword: false, password: "" });
    }

    private handleInput(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const element = (event.target as HTMLInputElement);
        const available = this.getAvailable().toFixed();
        const sendAll = element.name === "amount" && element.value === available;
        this.setState((state) => ({ ...state, [element.name]: element.value, sendAllChecked: sendAll }));
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
            this.setState({ error: null, gettingPassword: true });
        } else {
            this.setState({ error: "Please enter a valid amount." });
            return;
        }
    }

    private readonly handleCheckBox = (): void => {
        if (!this.state.sendAllChecked) {
            const available = this.getAvailable().toFixed();
            this.setState({ amount: available });
        }
        this.setState({ sendAllChecked: !this.state.sendAllChecked });
    }

    private async onAccept(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        const { withdrawRequest, network } = this.props;
        const { password, to, amount } = this.state;
        this.setState({ error: null, loading: true });

        const available = this.getAvailable().toFixed();
        const sendAll = amount === available;
        const request: IWithdrawRequest = {
            token: withdrawRequest.token,
            to,
            amount,
            sendAll,
            speed: this.optionsContainer.state.defaultTransactionSpeed,
        };

        try {
            await submitWithdraw(request, { password, network });
            this.setState({ loading: false });
            this.props.setWithdrawRequest(null);
        } catch (e) {
            console.error(e);
            this.setState({ loading: false, error: e.response && e.response.data.error || e });
        }
    }

    private onReject(): void {
        this.props.setWithdrawRequest(null);
    }
}

export const ApproveWithdraw = connect<IApproveWithdrawProps>([OptionsContainer])(ApproveWithdrawClass);
