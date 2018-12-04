import * as React from "react";

import logo from "../styles/images/logo.png";

interface IHeaderProps {
    hideNetwork?: boolean;
    setNetwork: (network: string) => void;
}

interface IHeaderState {
    network: string;
}

export class Header extends React.Component<IHeaderProps, IHeaderState> {
    constructor(props: IHeaderProps) {
        super(props);
        this.state = {
            network: "mainnet"
        };
        this.handleChange = this.handleChange.bind(this);
    }

    public componentDidMount(): void {
        this.props.setNetwork(this.state.network);
    }

    public render(): JSX.Element {
        const { hideNetwork } = this.props;
        return (
            <div className="header">
                <img src={logo} alt="Swapperd" />
                {!hideNetwork &&
                    <select value={this.state.network} onChange={this.handleChange}>
                        <option value="mainnet" selected={true}>Main Network</option>
                        <option value="testnet">Test Network</option>
                    </select>
                }
            </div>
        );
    }

    private handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const network = event.target.value;
        this.setState({ network });
        this.props.setNetwork(network);
    }
}
