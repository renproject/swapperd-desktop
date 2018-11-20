import * as React from "react";

import { ipcRenderer } from "electron";
import { Banner } from "./Banner";
import { Loading } from "./Loading";

interface ICreateAccountProps {
    resolve: () => void;
}

// tslint:disable-next-line:no-empty-interface
interface ICreateAccountState {
    username: string;
    password: string;
    loading: boolean;
}

export class CreateAccount extends React.Component<ICreateAccountProps, ICreateAccountState> {
    constructor(props: ICreateAccountProps) {
        super(props);
        this.state = {
            username: "",
            password: "",
            loading: false
        };
        this.handleInput = this.handleInput.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    public render() {
        const { loading } = this.state;
        return (
            <>
                <Banner title="Create account" />
                <div className="account">
                    {!loading ?
                        <form onSubmit={this.onSubmit}>
                            <input className="retro--grey" type="text" name="username" placeholder="Username" onChange={this.handleInput} />
                            <input className="retro--grey" type="password" name="password" placeholder="Password" onChange={this.handleInput} />
                            <input className="retro--blue" type="submit" value="Create account" />
                        </form>
                        :
                        <Loading />
                    }
                </div>
            </>
        );
    }

    private handleInput = (event: React.FormEvent<HTMLInputElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private async onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        this.setState({ loading: true });
        event.preventDefault();
        const { username, password } = this.state;

        const code = ipcRenderer.sendSync("create-account", username, password);
        if (code === 0) {
            this.props.resolve();
        }
    }
}
