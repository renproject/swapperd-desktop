import * as React from "react";

import BigNumber from "bignumber.js";

import { getLogo } from "src/lib/logos";
import { getBalances, IPartialSwapRequest, submitSwap } from "../lib/swapperd";
import { Banner } from './Banner';

interface IApproveSwapProps {
    swapDetails: IPartialSwapRequest;
    socket: WebSocket | null;
    reset: () => void;
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
    }

    public render() {
        const { swapDetails } = this.props;
        const { password, loading, error } = this.state;
        return (
            <>
                <Banner title="Approve swap" reject={this.onReject} />
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
        const { swapDetails, socket } = this.props;
        const { password } = this.state;
        this.setState({ error: null, loading: true });

        try {
            const response = await submitSwap(swapDetails, password);

            if (swapDetails.shouldInitiateFirst) {
                const balances = await getBalances();
                const balanceMap = {};
                for (const balanceItem of balances.balances) {
                    balanceMap[balanceItem.token] = balanceItem.address;
                }

                // Swap details
                [response.receiveToken, response.sendToken] = [response.sendToken, response.receiveToken];
                [response.receiveAmount, response.sendAmount] = [response.sendAmount, response.receiveAmount];
                delete response.id;

                response.receiveFrom = balanceMap[response.receiveToken];
                response.sendTo = balanceMap[response.sendToken];
                response.shouldInitiateFirst = false;

                if (socket) {
                    socket.send(JSON.stringify(response));
                }
            }
            this.props.reset();
        } catch (e) {
            console.error(e);
            this.setState({ error: "There was an error submitting your request. Please try again later." });
        }

        this.setState({ loading: false });
    }

    private onReject(): void {
        this.props.reset();
    }
}
