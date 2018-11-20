import * as moment from "moment";
import * as React from 'react';

import { ISwapItem } from 'src/lib/swapperd';

interface ISwapItemProps {
    index: number;
    swapItem: ISwapItem;
}

export class SwapItem extends React.Component<ISwapItemProps, {}> {
    constructor(props: ISwapItemProps) {
        super(props);
    }

    public render(): JSX.Element {
        const { index, swapItem } = this.props;
        const timestamp = moment.unix(swapItem.timestamp).format("MMM DD, YYYY at HH:mm");
        let status;
        switch (swapItem.status) {
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
        }
        return (
            <div className="swaps--item">
                <p>#{index} - {timestamp}</p>
                <div>
                    <div>
                        <p className="swaps--status">{status}</p>
                        <p>{swapItem.sendToken} to {swapItem.receiveToken}</p>
                    </div>
                    <div>
                        <p>+{swapItem.receiveAmount}</p>
                        <p>-{swapItem.sendAmount}</p>
                    </div>
                </div>
            </div>
        );
    }
}
