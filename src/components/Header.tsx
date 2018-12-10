import * as React from "react";

import { MAINNET_REF, TESTNET_REF } from "../lib/swapperd";

import logo from "../styles/images/logo.png";

interface IHeaderProps {
    network: string;
    hideNetwork?: boolean;
    setNetwork: (network: string) => void;
}

export class Header extends React.Component<IHeaderProps, {}> {
    constructor(props: IHeaderProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    public render(): JSX.Element {
        const { hideNetwork } = this.props;
        return (
            <div className="header">
                <img src={logo} alt="Swapperd" />
                {!hideNetwork &&
                    <select value={this.props.network} onChange={this.handleChange}>
                        <option value={MAINNET_REF}>Main Network</option>
                        <option value={TESTNET_REF}>Test Network</option>
                    </select>
                }
            </div>
        );
    }

    private handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const network = event.target.value;
        this.props.setNetwork(network);
    }
}
