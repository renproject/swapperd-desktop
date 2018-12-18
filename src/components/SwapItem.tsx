import * as moment from "moment";
import * as React from "react";

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
                        <p>+{swapItem.receiveAmount} {swapItem.receiveToken}</p>
                        <p>-{swapItem.sendAmount} {swapItem.sendToken}</p>
                    </div>
                </div>
            </div>
        );
    }
}
