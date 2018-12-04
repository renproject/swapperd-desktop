import * as React from "react";

import { IBalancesResponse, IPartialWithdrawRequest } from "../lib/swapperd";
import { BalanceItem } from "./BalanceItem";
import { Loading } from "./Loading";

interface IBalancesProps {
    balances: null | IBalancesResponse;
    balancesError: string | null;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest) => void;
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
                    Array.from(balances.balances.keys()).sort().map((token, index) => {
                        return <BalanceItem
                            key={index}
                            token={token}
                            amount={balances.balances.get(token)}
                            setWithdrawRequest={this.props.setWithdrawRequest}
                        />;
                    })
                    : (
                        balancesError ? <p className="error">{balancesError}</p> : <Loading />
                    )
                }
            </div>
        );
    }
}
