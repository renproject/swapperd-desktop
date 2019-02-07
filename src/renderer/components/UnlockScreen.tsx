import * as React from "react";

import { Banner } from "@/components/Banner";
import { Loading } from "@/components/Loading";
import { ipc } from "@/ipc";
import { bootload, getInfo } from "@/lib/swapperd";
import { Message } from "common/types";

interface IUnlockScreenProps {
    resolve(password: string): void;
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
        this.setState((state) => ({ ...state, error: null, [element.name]: element.value }));
    }

    private async handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        const { password } = this.state;

        let success: boolean;
        try {
            success = await ipc.sendSyncWithTimeout(
                Message.VerifyPassword,
                10, // timeout
                { password },
            );
        } catch (err) {
            this.props.resolve("");
            this.setState({ error: err.message });
            return;
        }

        let error = "";
        if (!success) {
            error = "Incorrect password";
            this.setState({ error });
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
