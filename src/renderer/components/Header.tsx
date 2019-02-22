import * as React from "react";

import alertImage from "@/styles/images/alert.png";
import logo from "@/styles/images/logo.png";

import { ipc } from "@/ipc";
import { NETWORKS } from "@/lib/swapperd";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { Message, Network } from "common/types";

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
        // tslint:disable-next-line:no-any
        const logoProps: any = {};
        if (logoOnClick) {
            logoProps.role = "button";
            logoProps.onClick = logoOnClick;
        }
        return (
            <div className="header">
                <div className="clickable">
                    <img className="logo" src={logo} alt="Swapperd" {...logoProps} />
                    {updateAvailable && <img alt="alert" className="header--alert" src={alertImage} />}
                </div>
                {!hideNetwork &&
                    <select disabled={disableNetwork} value={this.props.network} onChange={this.handleChange}>
                        {Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key]}</option>)}
                    </select>
                }
                {this.appContainer.state.login.password && !hideNetwork ?
                    this.appContainer.state.app.updateReady ?
                        <div role="button" onClick={this.update}>Update available</div> :
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

    private readonly update = () => {
        ipc.sendMessage(Message.Relaunch, null);
    }
}

export const Header = connect<Props>([AppContainer])(HeaderClass);
