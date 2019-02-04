import * as React from "react";

import { Banner } from "./Banner";

interface IAcceptMnemonicProps {
    mnemonic: string;
    resolve: () => void;
}

export class AcceptMnemonic extends React.Component<IAcceptMnemonicProps, {}> {
    constructor(props: IAcceptMnemonicProps) {
        super(props);
        this.onAccept = this.onAccept.bind(this);
    }

    public render() {
        const { mnemonic } = this.props;
        return (
            <>
                <Banner title="Account created" />
                <div className="mnemonic">
                    <p>Please back-up the following 12 words securely. You can restore your account using these words and the account details you used to sign-up.</p>
                    <textarea disabled={true}>{mnemonic}</textarea>
                    <button onClick={this.onAccept}>Continue</button>
                </div>
            </>
        );
    }

    private onAccept(): void {
        this.props.resolve();
    }
}
