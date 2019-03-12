import * as React from "react";

import BigNumber from "bignumber.js";
import logger from "electron-log";

import { Banner } from "@/components/Banner";
import { ipc } from "@/ipc";
import { getLogo } from "@/lib/logos";
import { connect, ConnectedProps } from "@/store/connect";
import { OptionsContainer } from "@/store/containers/optionsContainer";
import { decimals, IPartialSwapRequest, NETWORKS, submitSwap, Token } from "common/swapperd";
import { Message } from "common/types";

interface IApproveSwapProps extends ConnectedProps {
    network: string;
    origin: string;
    swapDetails: IPartialSwapRequest;
    resetSwapDetails(): void;
}

interface IApproveSwapState {
    password: string;
    loading: boolean;
    error: null | string;
}

function digits(token: Token): BigNumber {
    return new BigNumber(10).pow(decimals.get(token) || 0);
}

class ApproveSwapClass extends React.Component<IApproveSwapProps, IApproveSwapState> {
    private readonly optionsContainer: OptionsContainer;

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

        [this.optionsContainer] = this.props.containers;
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
                    <div className="swap--origin">
                        <div>
                            <img className="swap--favicon" alt="" role="presentation" src={`${origin}/favicon.ico`} />
                            <a rel="noopener noreferrer" target="_blank" href={origin}>{origin}</a>
                        </div>
                        <p>is proposing the following swap on {NETWORKS[network]}:</p>
                    </div>
                    <div className="swap--details">
                        <div>
                            <img role="presentation" alt="" src={getLogo(swapDetails.sendToken)} />
                            <p>{readableSendAmount.toFixed()} {swapDetails.sendToken}</p>
                        </div>
                        <div>
                            <img role="presentation" alt="" src={getLogo(swapDetails.receiveToken)} />
                            <p>{readableReceiveAmount.toFixed()} {swapDetails.receiveToken}</p>
                        </div>
                    </div>
                    {fees.gt(0) && <p className="swap--fee">{`Additional fee of ${fees.toFixed()} ${swapDetails.sendToken} (${feePercent.times(100).toFixed()}%)`}</p>}
                    <div className="swap--inputs">
                        <form onSubmit={this.onAccept}>
                            <input type="password" placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} />
                            <input type="submit" style={{ display: "none", visibility: "hidden" }} />
                            <button type="submit" disabled={loading || !password}>Swap</button>
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
            const mainResponse = await submitSwap({ ...swapDetails, speed: this.optionsContainer.state.defaultTransactionSpeed }, { password, network });
            ipc.sendMessage(Message._SwapResponse, { status: mainResponse.status, response: mainResponse.data });
            this.setState({ loading: false });
            this.props.resetSwapDetails();
        } catch (e) {
            logger.error(e);
            this.setState({ loading: false, error: e.response && e.response.data.error || e });
        }
    }

    private onReject(): void {
        ipc.sendMessage(Message._SwapResponse, { status: 403 });
        this.props.resetSwapDetails();
    }
}

export const ApproveSwap = connect<IApproveSwapProps>([OptionsContainer])(ApproveSwapClass);
