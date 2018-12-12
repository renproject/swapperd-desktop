import * as React from "react";

import { bootload } from "src/lib/swapperd";
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
                        <>
                            <input type="password" name="password" placeholder="Password" onChange={this.handleInput} />
                            <button disabled={submitting} onClick={this.handleSubmit}><span>Unlock</span></button>
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
