import * as React from "react";

import { bootload } from "src/lib/swapperd";
import { Banner } from "./Banner";
import { Loading } from "./Loading";

interface ILoginProps {
    resolve: (locked: boolean) => void;
}

interface ILoginState {
    submitting: boolean;
    password: string;
    loading: boolean;
    error: null | string;
}

export class Login extends React.Component<ILoginProps, ILoginState> {
    constructor(props: ILoginProps) {
        super(props);
        this.state = {
            submitting: false,
            password: "",
            loading: false,
            error: null,
        };
        this.handleInput = this.handleInput.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    public render(): JSX.Element {
        const { loading, error, submitting } = this.state;
        return (
            <>
                <Banner title="Login" />
                <div className="account">
                    {!loading ?
                        <>
                            <input type="password" name="password" placeholder="Password" onChange={this.handleInput} />
                            <button disabled={submitting} onClick={this.handleSubmit}><span>Login</span></button>
                            {error ? <p className="error">{error}</p> : null}
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

    private async handleSubmit(): Promise<void> {
        const { password } = this.state;
        this.setState({ submitting: true });
        const res = await bootload(password);
        this.props.resolve(res);
        this.setState({ submitting: false });
    }
}
