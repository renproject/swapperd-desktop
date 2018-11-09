import * as React from 'react';

import '../styles/ApproveSwap.css';

import axios from 'axios';

import BigNumber from "bignumber.js";

import swap from '../styles/images/swap.svg';

import { getLogo } from 'src/lib/logos';
import { IPartialSwapRequest, ISwapRequest } from '../lib/swapperd';

interface IApproveSwapProps {
    swapDetails: IPartialSwapRequest;
}

interface IApproveSwapState {
    gettingPassword: boolean;
    error: null | string;
    loading: boolean;
    response: null | ISwapRequest;
    username: string;
    password: string;
}


class ApproveSwap extends React.Component<IApproveSwapProps, IApproveSwapState> {
    constructor(props: IApproveSwapProps) {
        super(props);
        this.state = {
            gettingPassword: false,
            error: null,
            loading: false,
            response: null,
            username: "",
            password: "",
        };
    }

    public render() {
        const { swapDetails } = this.props;
        const { gettingPassword, username, password, response, loading, error } = this.state;
        return (

            <div className="approve-swap">
                {response ?
                    <>
                        <h2>Send these details to the other trader:</h2>
                        <textarea value={JSON.stringify(response, null, 4)} />
                        <div className="button-list">
                            <div className="button retro--blue" onClick={this.onDone}>Done</div>
                        </div>
                    </> :
                    <>
                        <header className="swap-header">
                            <div className="swap-header--icons">
                                <img style={{ margin: "0 0.5rem" }} src={swap} />
                            </div>
                            <div className="swap-header--row-list">
                                <div className="swap-header--row">
                                    <img className="swap-header--row-img" src={getLogo(swapDetails.sendToken)} />
                                    <div className="swap-header--row-body">
                                        <div className="swap-header--row-title">Send</div><div>{new BigNumber(swapDetails.sendAmount).dividedBy(100000000).toString()} {swapDetails.sendToken}</div>
                                    </div>
                                </div>
                                <div className="swap-header--row">
                                    <img className="swap-header--row-img" src={getLogo(swapDetails.receiveToken)} />
                                    <div className="swap-header--row-body">
                                        <div className="swap-header--row-title">Receive</div><div>{new BigNumber(swapDetails.receiveAmount).dividedBy(100000000).toString()} {swapDetails.receiveToken}</div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {error ? <p className="retro--red">{error}</p> : null}

                        {gettingPassword ?
                            <div className="button-list">
                                <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Username" value={username} name="username" onChange={this.handleInput} disabled={loading} />
                                <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} type="password" />
                                <div className={`button retro--blue ${loading ? "disabled" : ""}`} onClick={this.onAccept2}>Accept</div>
                            </div> :
                            <div className="button-list">
                                <div className={`button retro--blue ${loading ? "disabled" : ""}`} onClick={this.onAccept1}>Accept</div>
                                <div className={`button retro--grey ${loading ? "disabled" : ""}`} onClick={this.onReject}>Reject</div>
                            </div>
                        }
                    </>
                }
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
        // chrome.runtime.sendMessage({ method: 'rejectedSwap' }, console.log);
    }

    private onAccept2 = async () => {
        const { password, username } = this.state;
        this.setState({ error: null, loading: true });

        try {
            const { swapDetails } = this.props;
            const postResponse = await axios({
                method: 'POST',
                url: "http://localhost:7777/swaps",
                auth: {
                    username,
                    password,
                },
                data: swapDetails,
            });

            const response: ISwapRequest = postResponse.data;

            if (swapDetails.shouldInitiateFirst) {

                const balances = (await axios({
                    method: 'GET',
                    url: "http://localhost:7777/balances",
                    auth: {
                        username,
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

                this.setState({ response });
            } else {
                this.onDone();
            }
        } catch (err) {
            this.setState({ error: err.message || err });
        }

        this.setState({ loading: false, gettingPassword: false });
    }

    private onDone = async () => {
        // const { response } = this.state;
        // chrome.runtime.sendMessage({ method: 'approvedSwap', response }, console.log);
    }
}

export default ApproveSwap;
