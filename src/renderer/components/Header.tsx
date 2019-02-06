import * as React from "react";

import { Subscribe } from "unstated";

import logo from "@/styles/images/logo.png";

import { Network, NETWORKS } from "@/lib/swapperd";
import { AppContainer } from "@/store/containers/appContainer";

class HeaderClass extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    public render(): JSX.Element {
        const { hideNetwork } = this.props;
        return (
            <Subscribe to={[AppContainer]}>
                {(container: AppContainer) => <div className="header">
                    <img src={logo} alt="Swapperd" />
                    {!hideNetwork &&
                        <select value={this.props.network} onChange={this.handleChange}>
                            {Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key]}</option>)}
                        </select>
                    }
                    {container.state.login.password && !hideNetwork ? <div role="button" className="header--lock" onClick={container.clearPassword} /> : <></>}
                </div>
                }
            </Subscribe>
        );
    }

    private handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const network = event.target.value;
        this.props.setNetwork(network as Network);
    }
}

interface Props {
    network: Network;
    hideNetwork?: boolean;
    setNetwork(network: Network): void;
}

interface State {
}

export const Header = HeaderClass;
