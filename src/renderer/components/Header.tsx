import * as React from "react";

import logo from "@/styles/images/logo.png";

import { ipc } from "@/ipc";
import { NETWORKS } from "@/lib/swapperd";
import { AppContainer, connect, ConnectedProps } from "@/store/containers/appContainer";
import { Message, Network } from "common/types";

interface Props extends ConnectedProps {
    network: Network;
    hideNetwork?: boolean;
    disableNetwork?: boolean;
    logoOnClick?(): void;
    setNetwork(network: Network): void;
}

interface State {
}

class HeaderClass extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
    }

    public render(): JSX.Element {
        const { logoOnClick, hideNetwork, container, disableNetwork } = this.props;
        // tslint:disable-next-line:no-any
        const logoProps: any = {};
        if (logoOnClick) {
            logoProps.role = "button";
            logoProps.onClick = logoOnClick;
        }
        return (
            <div className="header">
                <img className="clickable" src={logo} alt="Swapperd" {...logoProps} />
                {!hideNetwork &&
                    <select disabled={disableNetwork} value={this.props.network} onChange={this.handleChange}>
                        {Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key]}</option>)}
                    </select>
                }
                {container.state.login.password && !hideNetwork ?
                    container.state.app.updateReady ?
                        <div role="button" onClick={this.update}>Update available</div> :
                        <div role="button" className="header--lock" onClick={container.clearPassword}>
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

export const Header = connect<Props>(AppContainer)(HeaderClass);
