import * as React from "react";

import BigNumber from "bignumber.js";

import { getLogo } from "src/lib/logos";
import { getBalances, IPartialSwapRequest, submitSwap } from "../lib/swapperd";
import { Banner } from "./Banner";

interface IApproveSwapProps {
    swapDetails: IPartialSwapRequest;
    resetSwapDetails: () => void;
}

interface IApproveSwapState {
    password: string;
    loading: boolean;
    error: null | string;
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
        const { swapDetails } = this.props;
        const { password, loading, error } = this.state;
        return (
            <>
                <Banner title="Approve swap" disabled={loading} reject={this.onReject} />
                <div className="swap">
                    <div className="swap--details">
                        <div>
                            <img src={getLogo(swapDetails.sendToken)} />
                            <p>{new BigNumber(swapDetails.sendAmount).dividedBy(100000000).toString()} {swapDetails.sendToken}</p>
                        </div>
                        <div>
                            <img src={getLogo(swapDetails.receiveToken)} />
                            <p>{new BigNumber(swapDetails.receiveAmount).dividedBy(100000000).toString()} {swapDetails.receiveToken}</p>
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
        const { swapDetails } = this.props;
        const { password } = this.state;
        this.setState({ error: null, loading: true });

        try {
            const response = await submitSwap(swapDetails, password);
            if (swapDetails.shouldInitiateFirst) {
                const balances = (await getBalances()).balances;

                // Swap details
                [response.receiveToken, response.sendToken] = [response.sendToken, response.receiveToken];
                [response.receiveAmount, response.sendAmount] = [response.sendAmount, response.receiveAmount];
                delete response.id;

                response.receiveFrom = balances.get(response.receiveToken);
                response.sendTo = balances.get(response.sendToken);
                response.shouldInitiateFirst = false;
            }
            (window as any).ipcRenderer.send("swap-response", 201, response);
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
