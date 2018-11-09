import * as React from 'react';

import { IBalancesResponse, IPartialWithdrawRequest } from '../lib/swapperd';
import { BalanceItem } from './BalanceItem';
import Loading from './Loading';

// tslint:disable-next-line:no-empty-interface
interface IBalancesState {
    // username: string;
    // password: string;
    // gettingPassword: true;
    // loading: boolean;
    // error: null | string;
}

interface IBalancesProps {
    balances: null | IBalancesResponse;
    balancesError: string | null;
    setWithdrawRequest: (withdrawRequest: IPartialWithdrawRequest) => void;
}

export class Balances extends React.Component<IBalancesProps, IBalancesState> {
    constructor(props: IBalancesProps) {
        super(props);
        this.state = {
            // password: "",
            // username: "",
            // gettingPassword: true,
            // loading: false,
            // error: null,
        };
    }

    public render() {
        const { balances, balancesError } = this.props;
        return (

            <div className="balances">
                {balances ?
                    <>
                        <ul>
                            {balances.balances.map(balance => {
                                return <BalanceItem key={balance.token} balanceItem={balance} setWithdrawRequest={this.props.setWithdrawRequest} />;
                            })}
                        </ul>
                    </> :
                    <>
                        <Loading />
                        {/* <form className="button-list" onSubmit={this.onAccept}>
                            <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Username" value={username} name="username" onChange={this.handleInput} disabled={loading} />
                            <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} type="password" />
                            <input type="submit" className={`button retro--blue ${loading ? "disabled" : ""}`} value="Get balances" />
                            {error ? <p className="red">{error}</p> : null}
                        </form> */}
                    </>
                }
                {balancesError ? <p className="red">{balancesError}</p> : null}
            </div>
        );
    }

    // private handleInput = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    //     const element = (event.target as HTMLInputElement);
    //     this.setState((state) => ({ ...state, [element.name]: element.value }));
    // }

    // private onAccept = async (event: React.FormEvent<HTMLFormElement>) => {
    //     event.preventDefault();
    //     const { password, username } = this.state;
    //     this.setState({ error: null, loading: true });

    //     try {
    //         const balances = await getBalances(username, password);

    //         this.setState({ balances });
    //     } catch (err) {
    //         this.setState({ error: err.message || err });
    //     }

    //     this.setState({ loading: false });
    // }
}
