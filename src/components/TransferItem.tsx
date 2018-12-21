import * as moment from "moment";
import * as React from "react";

import { ITransferItem } from "../lib/swapperd";

interface ITransferItemProps {
    transferItem: ITransferItem;
}

interface ITransferItemState {
    expanded: boolean;
}

export class TransferItem extends React.Component<ITransferItemProps, ITransferItemState> {
    constructor(props: ITransferItemProps) {
        super(props);
        this.state = {
            expanded: false,
        };
    }

    public render(): JSX.Element {
        const { transferItem } = this.props;
        const timestamp = moment.unix(transferItem.timestamp).format("MMM DD, YYYY [at] HH:mm");
        const status = transferItem.confirmations < 1 ? "Pending" : "Confirmed";
        const feeToken = transferItem.token.blockchain === "bitcoin" ? "BTC" : "ETH";
        return (
            <div className="swaps--item">
                <div className="swaps--details" onClick={this.handleClick}>
                    <div>
                        <p>{timestamp}</p>
                        <span className={`swaps--status ${status ? status.toLowerCase() : ""}`}>{status}</span>
                    </div>
                    <div>
                        <p className="large">+{transferItem.value} {transferItem.token.name}</p>
                        <p>-{transferItem.fee} {feeToken}</p>
                    </div>
                </div>
                {this.state.expanded &&
                    <div className="swaps--extra">
                        <h3>Details</h3>
                        <p>From: {transferItem.from}</p>
                        <p>To: {transferItem.to}</p>
                        <p>Confirmations: {transferItem.confirmations}</p>
                    </div>
                }
            </div>
        );
    }

    private handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        this.setState({ expanded: !this.state.expanded });
    }
}
