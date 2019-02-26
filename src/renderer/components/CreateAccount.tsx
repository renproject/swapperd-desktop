import * as React from "react";

import { Circle } from "rc-progress";

import { Banner } from "@/components/Banner";
import { Loading } from "@/components/Loading";
import { ipc } from "@/ipc";
import { swapperdReady } from "@/lib/swapperd";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { Message } from "common/types";

interface Props extends ConnectedProps {
    resolve(mnemonic: string, password: string): void;
}

interface State {
    mnemonic: string | null;
    username: string;
    password: string;
    password2: string;
    useMnemonic: boolean;
    loading: boolean;
    error: null | string;
}

export class CreateAccountClass extends React.Component<Props, State> {
    private readonly appContainer: AppContainer;

    constructor(props: Props) {
        super(props);
        this.state = {
            mnemonic: null,
            username: "",
            password: "",
            password2: "",
            useMnemonic: false,
            loading: false,
            error: null,
        };
        this.handleTextArea = this.handleTextArea.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        [this.appContainer] = this.props.containers;
    }

    // tslint:disable-next-line:cyclomatic-complexity
    public render(): JSX.Element {
        const { useMnemonic, loading, username, password, password2, mnemonic } = this.state;
        let error = this.state.error;

        // Disable password length enforcing for account restoration
        const passwordValid = useMnemonic || password.length >= 8;
        const passwordsMatch = password && password2 && password === password2;

        if (!error) {
            if (password && !passwordValid) {
                error = "Your password needs to be at least 8 characters long";
            } else if (password2 && !passwordsMatch) {
                error = "Your passwords do not match";
            }
        }

        const validForm = username && passwordsMatch && passwordValid;
        const disabled: boolean = error !== null || !validForm || (useMnemonic && !mnemonic);

        const progress = this.appContainer.state.app.installProgress;

        return <div className="create-account">
            <Banner title={useMnemonic ? "Import account" : "Create account"} />
            <div className="account">
                {!loading ?
                    <form onSubmit={this.handleSubmit}>
                        {useMnemonic &&
                            <textarea name="mnemonic" placeholder="Please enter your 12 word mnemonic here" onChange={this.handleTextArea} />
                        }
                        <input type="text" name="username" placeholder="Username" onChange={this.handleInput} />
                        <input type="password" name="password" placeholder={`Password${useMnemonic ? " (this must be identical to the one you used originally)" : ""}`} onChange={this.handleInput} />
                        <input type="password" name="password2" placeholder="Confirm password" onChange={this.handleInput} />
                        {error ? <p className="error">{error}</p> : null}
                        <button disabled={disabled}>{useMnemonic ? "Import" : "Create"} account</button>
                        {!useMnemonic ?
                            <a role="button" onClick={this.restoreWithMnemonic}>Import using a mnemonic instead</a>
                            :
                            <a role="button" onClick={this.restoreWithoutMnemonic}>Create new account instead</a>
                        }
                    </form>
                    :
                    <>
                        <Loading />
                        <Circle percent={progress || 0} strokeWidth="4" className="progress" />
                        <span>
                            Setting up your account. This could take a few minutes...
                        </span>
                    </>
                }
            </div>
        </div>;
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
        await this.createAccount();
    }

    private readonly createAccount = async (): Promise<void> => {
        setTimeout(async () => {
            const { useMnemonic, mnemonic, password } = this.state;
            // const { username } = this.state;
            let newMnemonic: string;
            try {
                newMnemonic = await ipc.sendSyncWithTimeout(
                    Message.CreateAccount,
                    0, // timeout
                    { password, mnemonic }
                );
            } catch (error) {
                console.error(`Got error instead!!!: ${error}`);
                this.setState({ error });
                return;
            }
            await swapperdReady(password);
            this.setState({ loading: false });
            // If the user provided a mnemonic, there is no point passing the new one to the parent
            this.props.resolve(useMnemonic ? "" : newMnemonic, password);
        });
    }

    private readonly restoreWithMnemonic = (): void => {
        this.setState({ useMnemonic: true });
    }

    private readonly restoreWithoutMnemonic = (): void => {
        this.setState({ useMnemonic: false });
    }
}

export const CreateAccount = connect<Props>([AppContainer])(CreateAccountClass);
