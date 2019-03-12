import moment from "moment";
import * as React from "react";

import { ITransferItem } from "common/swapperd";

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

        const costs: JSX.Element[] = [];

        costs.unshift(<p className={`large`}>-{transferItem.value} {transferItem.token.name}</p>);
        Object.keys(transferItem.txCost).map((costToken, index) => {
            costs.push(<p key={index}>-{transferItem.txCost[costToken]} {costToken}</p>);
        });

        return (
            <div className="swaps--item">
                {/*tslint:disable-next-line:react-a11y-event-has-role*/}
                <div className="swaps--details" onClick={this.handleClick}>
                    <div>
                        <p>{timestamp}</p>
                        <span className={`swaps--status ${status ? status.toLowerCase() : ""}`}>{status}</span>
                    </div>
                    <div>
                        {/* <p className="large">+{transferItem.value} {transferItem.token.name}</p> */}
                        {costs}
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

    private readonly handleClick = (_event: React.MouseEvent<HTMLDivElement>) => {
        this.setState({ expanded: !this.state.expanded });
    }
}
