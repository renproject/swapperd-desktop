import * as React from "react";

import { bootload, swapperdReady } from "../lib/swapperd";
import { Banner } from "./Banner";
import { Loading } from "./Loading";
import { sendSyncWithTimeout } from '../ipc';

interface ICreateAccountProps {
    resolve: (mnemonic: string, password: string) => void;
}

interface ICreateAccountState {
    mnemonic: string;
    // username: string;
    password: string;
    useMnemonic: boolean;
    loading: boolean;
    error: null | string;
}

export class CreateAccount extends React.Component<ICreateAccountProps, ICreateAccountState> {
    constructor(props: ICreateAccountProps) {
        super(props);
        this.state = {
            mnemonic: "",
            // username: "",
            password: "",
            useMnemonic: false,
            loading: false,
            error: null,
        };
        this.handleTextArea = this.handleTextArea.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    public render(): JSX.Element {
        const { useMnemonic, loading, error } = this.state;
        return (
            <>
                <Banner title={useMnemonic ? "Import account" : "Create account"} />
                <div className="account">
                    {!loading ?
                        <>
                            {useMnemonic &&
                                <textarea name="mnemonic" placeholder="Please enter your 12 word mnemonic here" onChange={this.handleTextArea} />
                            }
                            <input type="text" name="username" placeholder="Username" onChange={this.handleInput} />
                            <input type="password" name="password" placeholder={`Password${useMnemonic ? " (this must be identical to the one you used originally)" : ""}`} onChange={this.handleInput} />
                            <button onClick={this.handleSubmit}>{useMnemonic ? "Import" : "Create"} account</button>
                            {!useMnemonic ?
                                <a onClick={this.restoreUsingMnemonic.bind(this, true)}>Import using a mnemonic instead</a>
                                :
                                <a onClick={this.restoreUsingMnemonic.bind(this, false)}>Create new account instead</a>
                            }
                            {error ? <p className="error">{error}</p> : null}
                        </>
                        :
                        <Loading />
                    }
                </div>
            </>
        );
    }

    private handleTextArea(event: React.FormEvent<HTMLTextAreaElement>): void {
        const element = (event.target as HTMLTextAreaElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private handleInput(event: React.FormEvent<HTMLInputElement>): void {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private async handleSubmit(): Promise<void> {
        // Ensure username does not contain any whitespace
        // if (/\s/.test(this.state.username)) {
        //     this.setState({ error: "Please enter a valid username." });
        // }
        this.setState({ loading: true });
        this.createAccount();
    }

    private createAccount = async (): Promise<void> => {
        setTimeout(async () => {
            const { mnemonic, password } = this.state;
            // const { username } = this.state;
            const newMnemonic: string = await sendSyncWithTimeout("create-account", 10, { /* username, */ password, mnemonic });
            await swapperdReady(password);
            await bootload(password);
            // If the user provided a mnemonic, there is no point passing the new one to the parent
            this.props.resolve(mnemonic === "" ? newMnemonic : "", password);
            this.setState({ loading: false });
        });
    }

    private restoreUsingMnemonic(value: boolean): void {
        this.setState({ useMnemonic: value });
    }
}
