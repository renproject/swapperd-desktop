import * as React from "react";

import BigNumber from "bignumber.js";

import { getLogo } from "src/lib/logos";
import { getBalances, IPartialSwapRequest, NETWORKS, submitSwap } from "../lib/swapperd";
import { Banner } from "./Banner";

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
    switch (token) {
        case "BTC":
        case "WBTC":
            return new BigNumber(10).pow(8);
        default:
            return new BigNumber(10).pow(18);
    }
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
        return (
            <>
                <Banner title="Approve swap" disabled={loading} reject={this.onReject} />
                <div className="swap">
                    <p>The website &lt;<a href={origin} rel="noopener noreferrer" target="_blank">{origin}</a>&gt; is proposing the following swap on {NETWORKS[network]}:</p>
                    <div className="swap--details">
                        <div>
                            <img src={getLogo(swapDetails.sendToken)} />
                            <p>{new BigNumber(swapDetails.sendAmount).dividedBy(digits(swapDetails.sendToken)).toString()} {swapDetails.sendToken}</p>
                        </div>
                        <div>
                            <img src={getLogo(swapDetails.receiveToken)} />
                            <p>{new BigNumber(swapDetails.receiveAmount).dividedBy(digits(swapDetails.receiveToken)).toString()} {swapDetails.receiveToken}</p>
                        </div>
                    </div>
                    <div className="swap--inputs">
                        <input type="password" placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} />
                        <button onClick={this.onAccept} disabled={loading}><span>Swap</span></button>
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

    private async onAccept(): Promise<void> {
        const { swapDetails, network } = this.props;
        const { password } = this.state;
        this.setState({ error: null, loading: true });

        try {
            const mainResponse = await submitSwap(swapDetails, password, { network });
            const response = mainResponse.data;
            if (swapDetails.shouldInitiateFirst) {
                const balances = (await getBalances({ network }));

                // Swap details
                [response.receiveToken, response.sendToken] = [response.sendToken, response.receiveToken];
                [response.receiveAmount, response.sendAmount] = [response.sendAmount, response.receiveAmount];
                delete response.id;

                response.receiveFrom = balances[response.receiveToken];
                response.sendTo = balances[response.sendToken];
                response.shouldInitiateFirst = false;
            }
            (window as any).ipcRenderer.send("swap-response", mainResponse.status, response);
            this.props.resetSwapDetails();
        } catch (e) {
            console.error(e);
            this.setState({ error: `There was an error submitting your request. Error: ${e}` });
        }

        this.setState({ loading: false });
    }

    private onReject(): void {
        (window as any).ipcRenderer.send("swap-response", 403);
        this.props.resetSwapDetails();
    }
}
