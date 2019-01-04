import * as React from "react";

import { bootload } from "../lib/swapperd";
import { Banner } from "./Banner";
import { Loading } from "./Loading";

interface IUnlockScreenProps {
    resolve: (unlocked: boolean) => void;
}

interface IUnlockScreenState {
    submitting: boolean;
    password: string;
    loading: boolean;
    error: null | string;
}

export class UnlockScreen extends React.Component<IUnlockScreenProps, IUnlockScreenState> {
    constructor(props: IUnlockScreenProps) {
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
                <Banner title="Wallet is locked" />
                <div className="account">
                    {!loading ?
                        <form onSubmit={this.handleSubmit}>
                            <input type="password" name="password" placeholder="Password" onChange={this.handleInput} />
                            <input type="submit" style={{ display: "none", visibility: "hidden" }} />
                            <button type="submit" disabled={submitting}>Unlock</button>
                            {error ? <p className="error">{error}</p> : null}
                        </form>
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

    private async handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const { password } = this.state;
        this.setState({ submitting: true });
        const unlocked = await bootload(password);
        let error = "";
        if (!unlocked) {
            error = "Invalid password";
        }
        this.setState({
            submitting: false,
            error,
        });
        this.props.resolve(unlocked);
    }
}
