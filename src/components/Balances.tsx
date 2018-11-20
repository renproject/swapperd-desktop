import * as React from 'react';

import { IBalancesResponse, IPartialWithdrawRequest } from '../lib/swapperd';
import { BalanceItem } from './BalanceItem';
import Loading from './Loading';

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
                    <ul>
                        {balances.balances.sort((a, b) => {
                            // Sort by amount, if amounts are equal, sort by name
                            const fstAmount = parseInt(a.amount, 10);
                            const sndAmount = parseInt(b.amount, 10);
                            if (fstAmount !== sndAmount) {
                                return fstAmount - sndAmount;
                            } else if (a.token < b.token) {
                                return -1;
                            } else {
                                return 1;
                            }
                        }).map(balance => {
                            return <BalanceItem key={balance.token} balanceItem={balance} setWithdrawRequest={this.props.setWithdrawRequest} />;
                        })}
                    </ul>
                    : (
                        balancesError ? <p className="red">{balancesError}</p> : <Loading />
                    )
                }
            </div>
        );
    }
}
