import * as React from "react";

import alertImage from "@/styles/images/alert.png";
import logo from "@/styles/images/logo.png";

import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { NETWORKS } from "common/swapperd";
import { Network } from "common/types";

interface Props extends ConnectedProps {
    network: Network;
    settingsOpen: boolean;
    updateAvailable?: boolean;
    hideNetwork?: boolean;
    hideSettings?: boolean;
    disableNetwork?: boolean;
    settingsOnClick(): void;
    logoOnClick?(): void;
    setNetwork(network: Network): void;
}

interface State {
}

class HeaderClass extends React.Component<Props, State> {
    private readonly appContainer: AppContainer;

    constructor(props: Props) {
        super(props);
        [this.appContainer] = this.props.containers;
    }

    public render(): JSX.Element {
        const { hideSettings, updateAvailable, logoOnClick, hideNetwork, disableNetwork, settingsOpen, settingsOnClick } = this.props;
        const { password } = this.appContainer.state.login;
        // tslint:disable-next-line:no-any
        const logoProps: any = {};
        if (logoOnClick) {
            logoProps.role = "button";
            logoProps.onClick = logoOnClick;
        }
        return (
            <div className="header">
                <div className={`${logoOnClick ? "clickable" : ""}`} {...logoProps}>
                    <img className="logo" src={logo} alt="Swapperd" />
                </div>
                {!hideNetwork &&
                    <select disabled={disableNetwork} value={this.props.network} onChange={this.handleChange}>
                        {Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key]}</option>)}
                    </select>
                }
                {!hideSettings && password ?
                    <div role="button" className={`header--settings ${settingsOpen ? "settings--open" : ""}`} onClick={settingsOnClick}>
                        <div className="header--settings--logo" />
                        {password && updateAvailable && !settingsOpen && <img alt="alert" className="header--alert" src={alertImage} />}
                    </div> :
                    <></>
                }
            </div>
        );
    }

    private readonly handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const network = event.target.value;
        this.props.setNetwork(network as Network);
    }
}

export const Header = connect<Props>([AppContainer])(HeaderClass);
