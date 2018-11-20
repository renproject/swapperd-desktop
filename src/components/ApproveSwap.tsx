import * as React from "react";

import axios from "axios";
import BigNumber from "bignumber.js";

import { getLogo } from "src/lib/logos";
import { IPartialSwapRequest, ISwapRequest } from "../lib/swapperd";

interface IApproveSwapProps {
    swapDetails: IPartialSwapRequest;
    socket: WebSocket | null;
    reset: () => void;
}

interface IApproveSwapState {
    gettingPassword: boolean;
    password: string;
    loading: boolean;
    error: null | string;
}


export class ApproveSwap extends React.Component<IApproveSwapProps, IApproveSwapState> {
    constructor(props: IApproveSwapProps) {
        super(props);
        this.state = {
            gettingPassword: false,
            password: "",
            loading: false,
            error: null,
        };
    }

    public render() {
        const { swapDetails } = this.props;
        const { gettingPassword, password, loading, error } = this.state;
        return (
            <div className="swap">
                <div>
                    <div className="swap--item">
                        <img src={getLogo(swapDetails.sendToken)} />
                        <div>
                            <h1>Send</h1>
                            <div>{new BigNumber(swapDetails.sendAmount).dividedBy(100000000).toString()} {swapDetails.sendToken}</div>
                        </div>
                    </div>
                    <div className="swap--item">
                        <img src={getLogo(swapDetails.receiveToken)} />
                        <div>
                            <h1>Receive</h1>
                            <div>{new BigNumber(swapDetails.receiveAmount).dividedBy(100000000).toString()} {swapDetails.receiveToken}</div>
                        </div>
                    </div>
                </div>
                <div className="swap--inputs">
                    <input type="password" name="password" placeholder="Password" value={password} onChange={this.handleInput} disabled={loading} />
                    <button onClick={this.onAccept} disabled={loading}><span>Accept</span></button>
                    {gettingPassword ?
                        <>
                            <input type="password" placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} />
                            <button onClick={this.onAccept} disabled={loading}><span>Accept</span></button>
                        </>
                        :
                        <>
                            <button onClick={this.onSwap} disabled={loading}><span>Swap</span></button>
                            <button onClick={this.onReject} disabled={loading}><span>Reject</span></button>
                        </>
                    }
                </div>
                {error ? <p className="error">{error}</p> : null}
            </div>
        );
    }

    private handleInput = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private onSwap = async () => {
        this.setState({ gettingPassword: true });
    }

    private onReject = async () => {
        this.props.reset();
    }

    private onAccept = async () => {
        const { password } = this.state;
        this.setState({ error: null, loading: true });

        try {
            const { swapDetails, socket } = this.props;
            const postResponse = await axios({
                method: 'POST',
                url: "http://localhost:7927/swaps",
                auth: {
                    username: "",
                    password,
                },
                data: swapDetails,
            });

            const response: ISwapRequest = postResponse.data;


            if (swapDetails.shouldInitiateFirst) {
                const balances = (await axios({
                    method: 'GET',
                    url: "http://localhost:7927/balances",
                    auth: {
                        username: "",
                        password,
                    },
                })).data.balances;

                const balanceMap = {};
                for (const balanceItem of balances) {
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
        } catch (err) {
            this.setState({ error: err.message || err });
        }
        this.setState({ loading: false, gettingPassword: false });
    }
}
