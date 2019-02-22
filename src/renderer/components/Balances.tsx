import * as React from "react";

import { BalanceItem } from "@/components/BalanceItem";
import { Loading } from "@/components/Loading";
import { IBalances, IPartialWithdrawRequest } from "@/lib/swapperd";
import { connect, ConnectedProps } from "@/store/connect";
import { OptionsContainer } from "@/store/containers/optionsContainer";

interface IBalancesProps extends ConnectedProps {
    balances: null | IBalances;
    balancesError: string | null;
    setWithdrawRequest(withdrawRequest: IPartialWithdrawRequest): void;
}

export class BalancesClass extends React.Component<IBalancesProps> {
    private optionsContainer: OptionsContainer;

    constructor(props: IBalancesProps) {
        super(props);
        [this.optionsContainer] = this.props.containers;
    }

    public render(): JSX.Element {
        const { balances, balancesError } = this.props;

        return (
            <div className="balances">
                {balances === null ?
                    <Loading />
                    : <>
                        {balancesError && <div className="balances--error">{balancesError}</div>}
                        {
                            balances.sort().map((details, token) => {
                                if (this.optionsContainer.state.hideZeroBalances && details.balance.isZero()) {
                                    return;
                                }
                                return <BalanceItem
                                    key={token}
                                    token={token}
                                    amount={details.balance}
                                    address={details.address}
                                    setWithdrawRequest={this.props.setWithdrawRequest}
                                />;
                            }).valueSeq().toArray()
                        }
                    </>
                }
            </div>
        );
    }
}

export const Balances = connect<IBalancesProps>([OptionsContainer])(BalancesClass);
