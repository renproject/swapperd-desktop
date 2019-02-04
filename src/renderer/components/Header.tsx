import * as React from "react";

import { connect, ConnectedReturnType } from "react-redux"; // Custom typings
import { bindActionCreators, Dispatch } from "redux";

import logo from "../styles/images/logo.png";

import { Network, NETWORKS } from "../lib/swapperd";
import { clearPassword } from "../store/actions/login/loginActions";
import { ApplicationData } from "../store/storeTypes";

class HeaderClass extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    public render(): JSX.Element {
        const { hideNetwork, store: { password } } = this.props;
        return (
            <div className="header">
                <img src={logo} alt="Swapperd" />
                {!hideNetwork &&
                    <select value={this.props.network} onChange={this.handleChange}>
                        {Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key]}</option>)}
                    </select>
                }
                {password && !hideNetwork ? <div role="button" className="header--lock" onClick={this.props.actions.clearPassword} /> : <></>}
            </div>
        );
    }

    private handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const network = event.target.value;
        this.props.setNetwork(network as Network);
    }
}

const mapStateToProps = (state: ApplicationData) => ({
    store: {
        password: state.login.password,
    },
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        clearPassword,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
    network: Network;
    hideNetwork?: boolean;
    setNetwork(network: Network): void;
}

interface State {
}

export const Header = connect(mapStateToProps, mapDispatchToProps)(HeaderClass);
