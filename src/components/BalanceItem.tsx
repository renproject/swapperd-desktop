import * as React from "react";

import BigNumber from "bignumber.js";

import { getLogo } from "src/lib/logos";
import { IPartialWithdrawRequest } from "src/lib/swapperd";

interface IBalanceItemProps {
    token: string;
    amount: BigNumber;
    address: string;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest) => void;
}

export class BalanceItem extends React.Component<IBalanceItemProps, {}> {
    constructor(props: IBalanceItemProps) {
        super(props);
        this.handleWithdraw = this.handleWithdraw.bind(this);
    }

    public render() {
        const { token, amount, address } = this.props;
        return (
            <div className="balances--item">
                <img src={getLogo(token)} />
                <div>
                    <p>{amount.toFixed()} {token} (<a onClick={this.handleWithdraw}>transfer</a>)</p>
                    <p>{address}</p>
                </div>
            </div>
        );
    }

    private handleWithdraw(): void {
        this.props.setWithdrawRequest({ token: this.props.token });
    }
}
