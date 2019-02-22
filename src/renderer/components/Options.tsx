// tslint:disable:react-this-binding-issue
// tslint:disable:jsx-no-lambda
import * as React from "react";

import { connect, ConnectedProps } from "@/store/connect";
import { OptionsContainer } from "@/store/containers/optionsContainer";

interface IOptionsProps extends ConnectedProps {
}

interface IOptionsState {
}

class OptionsClass extends React.Component<IOptionsProps, IOptionsState> {
    private optionsContainer: OptionsContainer;

    constructor(props: IOptionsProps) {
        super(props);
        [this.optionsContainer] = this.props.containers;
    }

    public render() {
        return (
            <div className="options--page">
                <h2>Balances</h2>
                <div className="balances--options">
                    <label>
                        <input type="checkbox" checked={this.optionsContainer.state.hideZeroBalances} onChange={this.handleCheckBox} />
                        Hide zero balances (BTC and ETH are always shown)
                    </label>
                </div>
                <h2>Transaction Fees</h2>
                <div className="input-group">
                    <button className={`secondary ${1 === this.optionsContainer.state.defaultTransactionSpeed ? "active" : ""}`} onClick={() => { this.setTransactionSpeed(1); }}>Slow</button>
                    <button className={`secondary ${2 === this.optionsContainer.state.defaultTransactionSpeed ? "active" : ""}`} onClick={() => { this.setTransactionSpeed(2); }}>Medium</button>
                    <button className={`secondary ${3 === this.optionsContainer.state.defaultTransactionSpeed ? "active" : ""}`} onClick={() => { this.setTransactionSpeed(3); }}>Fast</button>
                </div>
            </div>
        );
    }

    private setTransactionSpeed = (speed: number): void => {
        this.optionsContainer.setDefaultTransactionSpeed(speed);
    }

    private handleCheckBox = (): void => {
        this.optionsContainer.setHideZeroBalances(!this.optionsContainer.state.hideZeroBalances);
    }
}

export const Options = connect<IOptionsProps>([OptionsContainer])(OptionsClass);

// tslint:enable:react-this-binding-issue
// tslint:enable:jsx-no-lambda
