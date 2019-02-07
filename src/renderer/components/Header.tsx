import * as React from "react";

import logo from "@/styles/images/logo.png";

import { NETWORKS } from "@/lib/swapperd";
import { AppContainer, connect, ConnectedProps } from "@/store/containers/appContainer";
import { Network } from "common/types";

class HeaderClass extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    public render(): JSX.Element {
        const { hideNetwork, container } = this.props;
        return (
            <div className="header">
                <img src={logo} alt="Swapperd" />
                {!hideNetwork &&
                    <select value={this.props.network} onChange={this.handleChange}>
                        {Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key]}</option>)}
                    </select>
                }
                {container.state.login.password && !hideNetwork ? <div role="button" className="header--lock" onClick={container.clearPassword} /> : <></>}
            </div>
        );
    }

    private handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const network = event.target.value;
        this.props.setNetwork(network as Network);
    }
}

interface Props extends ConnectedProps {
    network: Network;
    hideNetwork?: boolean;
    setNetwork(network: Network): void;
}

interface State {
}

export const Header = connect<Props>(AppContainer)(HeaderClass);
