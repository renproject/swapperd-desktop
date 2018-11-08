import * as React from 'react';

import axios from 'axios';

import { ISwapRequest } from './App';

interface IListeningState {
    balances: null | any;
    username: string;
    password: string;
    gettingPassword: true;
    loading: boolean;
    error: null | string;
}


class Listening extends React.Component<{}, IListeningState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            password: "",
            username: "",
            balances: null,
            gettingPassword: true,
            loading: false,
            error: null,
        };
    }

    public render() {
        const { username, password, balances, loading } = this.state;
        return (

            <div className="approve-swap">
                {balances ?
                    <>
                        <h2>Balances</h2>
                        <textarea value={JSON.stringify(balances, null, 4)} />
                    </> :
                    <>
                        <div className="button-list">
                            <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Username" value={username} name="username" onChange={this.handleInput} disabled={loading} />
                            <input className={`retro--grey ${loading ? "disabled" : ""}`} placeholder="Password" value={password} name="password" onChange={this.handleInput} disabled={loading} type="password" />
                            <div className={`button retro--blue ${loading ? "disabled" : ""}`} onClick={this.onAccept2}>Get balances</div>
                        </div> :
                    </>
                }
            </div>
        );
    }

    private handleInput = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private onAccept2 = async () => {
        const { password, username } = this.state;
        this.setState({ error: null, loading: true });

        try {
            const postResponse = await axios({
                method: 'GET',
                url: "http://localhost:7777/balances",
                auth: {
                    username,
                    password,
                },
            });

            const balances: ISwapRequest = postResponse.data;

            this.setState({ balances });
        } catch (err) {
            this.setState({ error: err.message || err });
        }

        this.setState({ loading: false });
    }
}

export default Listening;
