import * as moment from "moment";
import * as React from "react";

import BigNumber from "bignumber.js";
import { ISwapItem } from "src/lib/swapperd";

interface ISwapItemProps {
    swapItem: ISwapItem;
}

export class SwapItem extends React.Component<ISwapItemProps, {}> {
    constructor(props: ISwapItemProps) {
        super(props);
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
            <div className="swaps--item">
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
            </div>
        );
    }
}
