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
                        <input type="checkbox" checked={this.optionsContainer.state.hideZeroBalances} onChange={this.handleCheckBox} /> Hide zero balances
                    </label>
                </div>
            </div>
        );
    }

    private handleCheckBox = (): void => {
        this.optionsContainer.setHideZeroBalances(!this.optionsContainer.state.hideZeroBalances);
    }
}

export const Options = connect<IOptionsProps>([OptionsContainer])(OptionsClass);
