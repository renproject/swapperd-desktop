import * as React from "react";

import { Banner } from "@/components/Banner";

interface IAcceptMnemonicProps {
    mnemonic: string;
    resolve(): void;
}

interface IAcceptMnemonicState {
    accepted: boolean;
}

export class AcceptMnemonic extends React.Component<IAcceptMnemonicProps, IAcceptMnemonicState> {
    constructor(props: IAcceptMnemonicProps) {
        super(props);
        this.onAccept = this.onAccept.bind(this);
        this.state = {
            accepted: false
        };
    }

    public render() {
        const { accepted } = this.state;
        const { mnemonic } = this.props;
        return (
            <>
                <Banner title="Account created" />
                <div className="mnemonic">
                    <p>Please back-up the following 12 words securely. You can restore your account using these words and the account details you used to sign-up.</p>
                    <textarea disabled={true} value={mnemonic} />
                    <div className="confirmation">
                        <label>
                            <input name="isGoing" type="checkbox" checked={this.state.accepted} onChange={this.handleInputChange} />
                            I have backed up my 12 words and understand that I am solely responsible for any loss of funds due to their failed safekeeping.
                        </label>
                    </div>
                    <button onClick={this.onAccept} disabled={!accepted}>Continue</button>
                </div>
            </>
        );
    }

    private handleInputChange = (): void => {
        this.setState({ accepted: !this.state.accepted });
    }

    private onAccept(): void {
        this.props.resolve();
    }
}
