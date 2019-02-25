import * as React from "react";

import alertImage from "@/styles/images/alert.png";
import logo from "@/styles/images/logo.png";

import { NETWORKS } from "@/lib/swapperd";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { Network } from "common/types";

interface Props extends ConnectedProps {
    network: Network;
    updateAvailable?: boolean;
    hideNetwork?: boolean;
    disableNetwork?: boolean;
    logoOnClick?(): void;
    setNetwork(network: Network): void;
}

interface State {
}

class HeaderClass extends React.Component<Props, State> {
    private appContainer: AppContainer;

    constructor(props: Props) {
        super(props);
        [this.appContainer] = this.props.containers;
    }

    public render(): JSX.Element {
        const { updateAvailable, logoOnClick, hideNetwork, disableNetwork } = this.props;
        const { password } = this.appContainer.state.login;
        // tslint:disable-next-line:no-any
        const logoProps: any = {};
        if (logoOnClick) {
            logoProps.role = "button";
            logoProps.onClick = logoOnClick;
        }
        return (
            <div className="header">
                <div className="clickable" {...logoProps}>
                    <img className="logo" src={logo} alt="Swapperd" />
                    {password && updateAvailable && <img alt="alert" className="header--alert" src={alertImage} />}
                </div>
                {!hideNetwork &&
                    <select disabled={disableNetwork} value={this.props.network} onChange={this.handleChange}>
                        {Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key]}</option>)}
                    </select>
                }
                {password && !hideNetwork ?
                    <div role="button" className="header--lock" onClick={this.appContainer.clearPassword}>
                        <div className="header--lock--logo" />
                    </div> :
                    <></>
                }
            </div>
        );
    }

    private handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const network = event.target.value;
        this.props.setNetwork(network as Network);
    }
}

export const Header = connect<Props>([AppContainer])(HeaderClass);
