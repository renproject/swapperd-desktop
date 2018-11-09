import * as React from 'react';

import { getLogo } from 'src/lib/logos';
import { IBalanceItem, IPartialWithdrawRequest } from 'src/lib/swapperd';

interface IBalanceItemProps {
    balanceItem: IBalanceItem;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest) => void;
}



export class BalanceItem extends React.Component<IBalanceItemProps, {}> {
    constructor(props: IBalanceItemProps) {
        super(props);
        this.state = {
        };
    }

    public render() {
        const { balanceItem } = this.props;
        return (
            <div className="balanceItem">
                <div className="balanceItem--left">
                    <img src={getLogo(balanceItem.token)} />
                </div>
                <div className="balanceItem--right">
                    <p>{balanceItem.amount} {balanceItem.token} <span onClick={this.handleWithdraw} className="withdrawButton">(withdraw)</span></p>
                    <p className="balanceAddress">{balanceItem.address}</p>
                </div>
            </div>
        );
    }

    private handleWithdraw = () => {
        this.props.setWithdrawRequest({ token: this.props.balanceItem.token });
    }
}
