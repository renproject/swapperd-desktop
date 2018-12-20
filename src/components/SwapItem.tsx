import * as moment from "moment";
import * as React from "react";

import BigNumber from "bignumber.js";
import { ISwapItem } from "src/lib/swapperd";

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
            case 5:
                status = "Failed";
                break;
            case 4:
                status = "Confirmed";
                break;
            case 6:
                status = "Canceled";
                break;
            default:
                status = "Unknown";
                break;
        }
        return (
            <div className="swaps--item" onClick={this.handleClick}>
                <div className="swaps--block">
                    <div className="swaps--details">
                        <div>
                            <p>{timestamp}</p>
                            <span className={`swaps--status ${status ? status.toLowerCase() : ""}`}>{status}</span>
                        </div>
                        <div>
                            {status === "Pending" ?
                                <>
                                    <p>+{swapItem.receiveAmount} {swapItem.receiveToken}</p>
                                    <p>-{swapItem.sendAmount} {swapItem.sendToken}</p>
                                </>
                                :
                                <>
                                    {Object.keys(swapItem.receiveCost).map((key) => {
                                        if (key === swapItem.receiveToken) {
                                            const receiveAmount = new BigNumber(swapItem.receiveAmount).minus(new BigNumber(swapItem.receiveCost[key])).toFixed();
                                            return <p key={key}>+{receiveAmount} {key}</p>;
                                        }
                                        return;
                                    })}
                                    {Object.keys(swapItem.sendCost).map((key) => {
                                        if (key === swapItem.sendToken) {
                                            const sendAmount = new BigNumber(swapItem.sendAmount).plus(new BigNumber(swapItem.sendCost[key])).toFixed();
                                            return <p key={key}>-{sendAmount} {key}</p>;
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
                            }
                        </div>
                    </div>
                    {this.state.expanded && <div className="swaps--extra">
                        <p>Swap ID: {swapItem.id}</p>
                        {status === "Pending" && swapItem.timeLock !== undefined && <div>Expires on {moment.unix(swapItem.timeLock).format("MMM DD, YYYY [at] HH:mm")}</div>}
                    </div>}
                </div>
                {status === "Pending" && <div className="time-indicator" style={{ width: `${this.percentageUntilExpired()}%` }} />}
            </div>
        );
    }

    private handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        this.setState({ expanded: !this.state.expanded });
    }

    private percentageUntilExpired = (): number => {
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
    }
}
