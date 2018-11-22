import * as React from "react";

import { getLogo } from "src/lib/logos";
import { IBalanceItem, IPartialWithdrawRequest } from "src/lib/swapperd";

interface IBalanceItemProps {
    balanceItem: IBalanceItem;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest) => void;
}

export class BalanceItem extends React.Component<IBalanceItemProps, {}> {
    constructor(props: IBalanceItemProps) {
        super(props);
        this.handleWithdraw = this.handleWithdraw.bind(this);
    }

    public render() {
        const { balanceItem } = this.props;
        return (
            <div className="balances--item">
                <img src={getLogo(balanceItem.token)} />
                <div>
                    <p>{balanceItem.amount} {balanceItem.token} (<a onClick={this.handleWithdraw}>transfer</a>)</p>
                    <p>{balanceItem.address}</p>
                </div>
            </div>
        );
    }

    private handleWithdraw(): void {
        this.props.setWithdrawRequest({ token: this.props.balanceItem.token });
    }
}
