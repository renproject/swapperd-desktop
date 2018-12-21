import * as moment from "moment";
import * as React from "react";

import BigNumber from "bignumber.js";

import { naturalTime } from "../lib/naturalTime";
import { ISwapItem } from "../lib/swapperd";

interface ISwapItemProps {
    swapItem: ISwapItem;
}

interface ISwapItemState {
    expanded: boolean;
}

export class SwapItem extends React.Component<ISwapItemProps, ISwapItemState> {
    constructor(props: ISwapItemProps) {
        super(props);
        this.state = {
            expanded: false,
        };
    }

    public render(): JSX.Element {
        const { swapItem } = this.props;
        const timestamp = moment.unix(swapItem.timestamp).format("MMM DD, YYYY [at] HH:mm");
        let status;
        switch (swapItem.status) {
            case 0:
            case 1:
            case 2:
                status = "Pending";
                break;
            case 3:
                status = "Failed";
                break;
            case 4:
                status = "Confirmed";
                break;
            case 5:
            case 7:
                status = "Expired";
                break;
            case 6:
                status = "Canceled";
                break;
            default:
                status = "Unknown";
                break;
        }
        return (
            <div className="swaps--item">
                <div className="swaps--details" onClick={this.handleClick}>
                    <div>
                        <p>{timestamp}</p>
                        <span className={`swaps--status ${status ? status.toLowerCase() : ""}`}>{status}</span>
                    </div>
                    <div>
                        {status === "Pending" ?
                            <>
                                <p className="large">+{swapItem.receiveAmount} {swapItem.receiveToken}</p>
                                <p>-{swapItem.sendAmount} {swapItem.sendToken}</p>
                            </>
                            :
                            status === "Expired" ?
                                Object.keys(swapItem.sendCost).map((key) => {
                                    if (key === swapItem.sendToken) {
                                        const sendAmount = new BigNumber(swapItem.sendAmount).plus(new BigNumber(swapItem.sendCost[key]));
                                        if (sendAmount.isZero()) {
                                            return;
                                        }
                                        return <p key={key}>-{sendAmount.toFixed()} {key}</p>;
                                    }
                                    return <p key={key}>-{swapItem.sendCost[key]} {key}</p>;
                                })
                                :
                                status === "Confirmed" ?
                                    <>
                                        {Object.keys(swapItem.receiveCost).map((key) => {
                                            if (key === swapItem.receiveToken) {
                                                const receiveAmount = new BigNumber(swapItem.receiveAmount).minus(new BigNumber(swapItem.receiveCost[key]));
                                                if (receiveAmount.isZero()) {
                                                    return;
                                                }
                                                return <p className="large" key={key}>+{receiveAmount.toFixed()} {key}</p>;
                                            }
                                            return;
                                        })}
                                        {Object.keys(swapItem.sendCost).map((key) => {
                                            if (key === swapItem.sendToken) {
                                                const sendAmount = new BigNumber(swapItem.sendAmount).plus(new BigNumber(swapItem.sendCost[key]));
                                                if (sendAmount.isZero()) {
                                                    return;
                                                }
                                                return <p key={key}>-{sendAmount.toFixed()} {key}</p>;
                                            }
                                            return <p key={key}>-{swapItem.sendCost[key]} {key}</p>;
                                        })}
                                        {Object.keys(swapItem.receiveCost).map((key) => {
                                            if (key !== swapItem.receiveToken) {
                                                return <p key={key}>-{swapItem.receiveCost[key]} {key}</p>;
                                            }
                                            return;
                                        })}
                                    </>
                                    :
                                    null
                        }
                    </div>
                </div>
                {this.state.expanded &&
                    <div className="swaps--extra">
                        <h3>Details</h3>
                        <p>Swap ID: {swapItem.id}</p>
                        {status === "Pending" && swapItem.timeLock !== undefined && swapItem.timeLock !== 0 &&
                            <p>Expires in {naturalTime(swapItem.timeLock, { showingSeconds: true, message: "", suffix: "", countDown: true })}</p>
                        }
                        {status === "Expired" && swapItem.timeLock !== undefined && swapItem.timeLock !== 0 &&
                            <p>Expired {naturalTime(swapItem.timeLock, { showingSeconds: true, message: "", suffix: "ago", countDown: false })}</p>
                        }
                    </div>
                }
                {/* status === "Pending" && <div className="swaps--expiry" style={{ width: `${this.percentageUntilExpired()}%` }} /> */}
            </div>
        );
    }

    private handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        this.setState({ expanded: !this.state.expanded });
    }

    /* private percentageUntilExpired = (): number => {
        const { swapItem } = this.props;
        if (swapItem.timeLock === undefined) {
            return 0;
        }
        const now = Date.now() / 1000;
        const past = now - swapItem.timestamp;
        const future = swapItem.timeLock - now;
        const percent = Math.floor(past / (past + future) * 100);
        const remaining = 100 - percent;
        return remaining;
    } */
}
