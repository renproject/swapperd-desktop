import * as React from "react";

import { Banner } from "./Banner";
import { Loading } from "./Loading";

interface ICreateAccountProps {
    resolve: () => void;
}

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
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    public render(): JSX.Element {
        const { loading } = this.state;
        return (
            <>
                <Banner title="Create account" />
                <div className="account">
                    {!loading ?
                        <>
                            <input type="text" name="username" placeholder="Username" onChange={this.handleInput} />
                            <input type="password" name="password" placeholder="Password" onChange={this.handleInput} />
                            <button onClick={this.handleSubmit}><span>Create account</span></button>
                        </>
                        :
                        <Loading />
                    }
                </div>
            </>
        );
    }

    private handleInput(event: React.FormEvent<HTMLInputElement>): void {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private handleSubmit(): void {
        this.setState({ loading: true });
        setTimeout(() => {
            const { username, password } = this.state;
            const code = (window as any).ipcRenderer.sendSync("create-account", username, password);
            if (code === 0) {
                this.props.resolve();
            }
        });
    }
}
