import * as React from "react";

import { bootload, getInfo } from "../lib/swapperd";
import { Banner } from "./Banner";
import { Loading } from "./Loading";

interface IUnlockScreenProps {
    resolve: (password: string) => void;
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
        const success = (window as any).ipcRenderer.sendSync("verify-password", password);
        let error = "";
        console.log(success)
        if (!success) {
            error = "Incorrect password";
            this.props.resolve("");
            this.setState({error});
            return;
        }
        this.setState({ submitting: true });

        try {
            const bootloaded = await getInfo(password);
            if (!bootloaded) {
                
                    const bootloadSuccessful = await bootload(password);
                if (!bootloadSuccessful) {
                    error = "Bootload failed";
                }
            
            }
        } catch (err) {
            console.error(err);
        }
        
        this.setState({
            submitting: false,
            error,
        });
        this.props.resolve(password);
    }
}
