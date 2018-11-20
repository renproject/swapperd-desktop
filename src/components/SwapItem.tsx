import * as React from 'react';

import { ISwapItem } from 'src/lib/swapperd';

interface ISwapItemProps {
    swapItem: ISwapItem;
}

export class SwapItem extends React.Component<ISwapItemProps, {}> {
    constructor(props: ISwapItemProps) {
        super(props);
    }

    public render() {
        const { swapItem } = this.props;
        return (
            <div className="swaps--item">
                <div>
                    <p>{swapItem.id}</p>
                    <p>{swapItem.sendToken}</p>
                    <p>{swapItem.receiveToken}</p>
                </div>
            </div>
        );
    }
}
