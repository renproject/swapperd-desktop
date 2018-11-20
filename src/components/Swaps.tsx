import * as React from 'react';

import { ISwapsResponse } from '../lib/swapperd';
import { Banner } from './Banner';
import { SwapItem } from './SwapItem';

interface ISwapsProps {
    swaps: null | ISwapsResponse;
}

export class Swaps extends React.Component<ISwapsProps> {
    constructor(props: ISwapsProps) {
        super(props);
    }

    public render() {
        const { swaps } = this.props;
        return (
            <>
                <Banner title="History" />
                <div className="swaps">
                    {swaps && swaps.swaps !== null ?
                        swaps.swaps.map(swap => {
                            return <SwapItem key={swap.id} swapItem={swap} />;
                        })
                        :
                        <p>You have no transactions.</p>
                    }
                </div>
            </>
        );
    }
}
