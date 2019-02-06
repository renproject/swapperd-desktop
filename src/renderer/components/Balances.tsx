import * as React from "react";

import { BalanceItem } from "@/components/BalanceItem";
import { IBalances, IPartialWithdrawRequest } from "@/lib/swapperd";

interface IBalancesProps {
    balances: null | IBalances;
    balancesError: string | null;
    setWithdrawRequest(withdrawRequest: IPartialWithdrawRequest): void;
}

export class Balances extends React.Component<IBalancesProps> {
    constructor(props: IBalancesProps) {
        super(props);
    }

    public render(): JSX.Element {
        const { balances, balancesError } = this.props;

        return (
            <div className="balances">
                {balances ?
                    balances.sort().map((details, token) => {
                        return <BalanceItem
                            key={token}
                            token={token}
                            amount={details.balance}
                            address={details.address}
                            setWithdrawRequest={this.props.setWithdrawRequest}
                        />;
                    }).valueSeq().toArray()
                    : (
                        balancesError && <p className="error">{balancesError}</p>
                    )
                }
            </div>
        );
    }
}
