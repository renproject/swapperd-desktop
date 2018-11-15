import * as React from 'react';

import { createAccount } from 'src/lib/swapperd';

interface ICreateAccountProps {
    resolve(): void;
}

// tslint:disable-next-line:no-empty-interface
interface ICreateAccountState {
    username: string;
    password: string;
    network: string;
}

export class CreateAccount extends React.Component<ICreateAccountProps, ICreateAccountState> {
    constructor(props: ICreateAccountProps) {
        super(props);
        this.state = {
            username: "",
            password: "",
            network: ""
        };
        this.handleInput = this.handleInput.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    public render() {
        return (
            <div className="account">
                <form onSubmit={this.onSubmit}>
                    <input className="retro--grey" type="text" name="username" placeholder="Username" onChange={this.handleInput} />
                    <input className="retro--grey" type="password" name="password" placeholder="Password" onChange={this.handleInput} />
                    <input className="retro--grey" type="text" name="network" placeholder="Network" onChange={this.handleInput} />
                    <input className="retro--blue" type="submit" value="Create account" />
                </form>
            </div>
        );
    }

    private handleInput = (event: React.FormEvent<HTMLInputElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private async onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const { username, password, network } = this.state;
        try {
            await createAccount(network, username, password);
            this.props.resolve();
        } catch (error) {
            console.log(error);
        }
    }
}
