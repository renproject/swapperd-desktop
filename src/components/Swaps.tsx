import * as React from 'react';

import { ISwapsResponse } from '../lib/swapperd';
import { Banner } from './Banner';
import { Loading } from './Loading';
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
                    {swaps !== null ?
                        swaps.swaps !== null ?
                            swaps.swaps.sort((a, b) => {
                                // Sort by timestamp in descending order
                                if (a.timestamp < b.timestamp) {
                                    return 1;
                                } else {
                                    return -1;
                                }
                            }).map((swap, index) => {
                                return <SwapItem key={index} swapItem={swap} />;
                            })
                            :
                            <p>You have no transactions.</p>
                        :
                        <Loading />
                    }
                </div>
            </>
        );
    }
}
