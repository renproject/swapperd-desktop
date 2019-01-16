import * as React from "react";

import BigNumber from "bignumber.js";

import { getLogo } from "../lib/logos";
import { getBalances, IPartialSwapRequest, NETWORKS, submitSwap, decimals } from "../lib/swapperd";
import { Banner } from "./Banner";
import { sendToMain } from '../ipc';

interface IApproveSwapProps {
    network: string;
    origin: string;
    swapDetails: IPartialSwapRequest;
    resetSwapDetails: () => void;
}

interface IApproveSwapState {
    password: string;
    loading: boolean;
    error: null | string;
}

function digits(token: string): BigNumber {
    return new BigNumber(10).pow(decimals[token]);
}

export class ApproveSwap extends React.Component<IApproveSwapProps, IApproveSwapState> {
    constructor(props: IApproveSwapProps) {
        super(props);
        this.state = {
            password: "",
            loading: false,
            error: null,
        };
        this.handleInput = this.handleInput.bind(this);
        this.onAccept = this.onAccept.bind(this);
        this.onReject = this.onReject.bind(this);
    }

    public render(): JSX.Element {
        const { swapDetails, origin, network } = this.props;
        const { password, loading, error } = this.state;
        const readableSendAmount = new BigNumber(swapDetails.sendAmount).dividedBy(digits(swapDetails.sendToken));
        const readableReceiveAmount = new BigNumber(swapDetails.receiveAmount).dividedBy(digits(swapDetails.receiveToken));
        const feeBips = new BigNumber(swapDetails.brokerFee ? swapDetails.brokerFee : 0);
        const feePercent = feeBips.div(10000);
        const fees = readableSendAmount.times(feePercent);
        return (
            <>
                <Banner title="Approve swap" disabled={loading} reject={this.onReject} />
                <div className="swap">
                    <p>{origin} is proposing the following swap on {NETWORKS[network]}:</p>
                    <div className="swap--details">
                        <div>
                            <img src={getLogo(swapDetails.sendToken)} />
                            <p>{readableSendAmount.toFixed()} {swapDetails.sendToken}</p>
                        </div>
                        <div>
                            <img src={getLogo(swapDetails.receiveToken)} />
                            <p>{readableReceiveAmount.toFixed()} {swapDetails.receiveToken}</p>
                        </div>
                    </div>
                    {fees.gt(0) && <p className="swap--fee">{`Additional fee of ${fees.toFixed()} ${swapDetails.sendToken} (${feePercent.times(100).toFixed()}%)`}</p>}
                    <div className="swap--inputs">
                        <form onSubmit={this.onAccept}>
                            <input type="password" placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} />
                            <input type="submit" style={{ display: "none", visibility: "hidden" }} />
                            <button type="submit" disabled={loading}>Swap</button>
                        </form>
                    </div>
                    {error ? <p className="error">{error}</p> : null}
                </div>
            </>
        );
    }

    private handleInput(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private async onAccept(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        const { swapDetails, network } = this.props;
        const { password } = this.state;
        this.setState({ error: null, loading: true });

        try {
            const mainResponse = await submitSwap(swapDetails, { password, network });
            const response = mainResponse.data.swap;
            if (swapDetails.shouldInitiateFirst) {
                const balances = (await getBalances({ password, network }));

                // Swap details
                [response.receiveToken, response.sendToken] = [response.sendToken, response.receiveToken];
                [response.receiveAmount, response.sendAmount] = [response.sendAmount, response.receiveAmount];
                delete response.id;

                response.receiveFrom = balances[response.receiveToken];
                response.sendTo = balances[response.sendToken];
                response.shouldInitiateFirst = false;
            }
            sendToMain("swap-response", { status: mainResponse.status, response });
            this.props.resetSwapDetails();
        } catch (e) {
            console.error(e);
            this.setState({ error: e.response && e.response.data.error || e });
        }

        this.setState({ loading: false });
    }

    private onReject(): void {
        sendToMain("swap-response", { status: 403 });
        this.props.resetSwapDetails();
    }
}
