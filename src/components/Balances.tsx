import * as React from 'react';

import { IBalancesResponse, IPartialWithdrawRequest } from '../lib/swapperd';
import { BalanceItem } from './BalanceItem';
import { Loading } from './Loading';

interface IBalancesProps {
    balances: null | IBalancesResponse;
    balancesError: string | null;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest) => void;
}

export class Balances extends React.Component<IBalancesProps> {
    constructor(props: IBalancesProps) {
        super(props);
    }

    public render() {
        const { balances, balancesError } = this.props;
        return (

            <div className="balances">
                {balances ?
                    balances.balances.sort((a, b) => {
                        // Sort by name
                        if (a.token < b.token) {
                            return -1;
                        } else {
                            return 1;
                        }
                    }).map((balance, index) => {
                        return <BalanceItem key={index} balanceItem={balance} setWithdrawRequest={this.props.setWithdrawRequest} />;
                    })
                    : (
                        balancesError ? <p className="error">{balancesError}</p> : <Loading />
                    )
                }
            </div>
        );
    }
}
