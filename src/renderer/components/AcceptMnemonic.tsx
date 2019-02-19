import * as React from "react";

import { Banner } from "@/components/Banner";
import { MnemonicCheck } from "./MnemonicCheck";

interface IAcceptMnemonicProps {
    mnemonic: string;
    resolve(): void;
}

interface IAcceptMnemonicState {
    backedUp: boolean;
    accepted: boolean;
    ready: boolean;
}

export class AcceptMnemonic extends React.Component<IAcceptMnemonicProps, IAcceptMnemonicState> {
    constructor(props: IAcceptMnemonicProps) {
        super(props);
        this.state = {
            backedUp: false,
            accepted: false,
            ready: false,
        };
    }

    public render() {
        const { ready, accepted, backedUp } = this.state;
        const { mnemonic } = this.props;
        return (
            <>
                { ready ?
                <MnemonicCheck mnemonic={mnemonic} wordsToCheck={5} onBack={this.onBack} onFinish={this.props.resolve} />
                :
                <>
                <Banner title="Account created" />
                <div className="mnemonic">
                    <p>Please back-up the following 12 words securely. To restore your account, you will need <b>BOTH</b> your password and the following 12 words.</p>
                    <textarea disabled={true} value={mnemonic} />
                    <div className="confirmation">
                        <label>
                            <input type="checkbox" name="backedUp" checked={this.state.backedUp} onChange={this.handleInputChange} />
                            I have backed up <b>BOTH</b> my password and my 12 words.
                        </label>
                    </div>
                    <div className="confirmation">
                        <label>
                            <input type="checkbox" name="accepted" checked={this.state.accepted} onChange={this.handleInputChange} />
                            I understand that I am solely responsible for any loss of funds due to their failed safekeeping.
                        </label>
                    </div>
                    <button onClick={this.onAccept} disabled={!accepted || !backedUp}>Continue</button>
                </div>
                </>
            }
            </>
        );
    }

    private handleInputChange = (event: React.FormEvent<HTMLInputElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: !this.state[element.name] }));
    }

    private onBack = (): void => {
        this.setState({ready: false, accepted: false, backedUp: false});
    }

    private onAccept = (): void => {
        this.setState({ready: true});
    }
}
