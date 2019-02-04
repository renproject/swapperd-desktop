import * as React from "react";

import { connect, ConnectedReturnType } from "react-redux"; // Custom typings
import { Dispatch, bindActionCreators } from 'redux';

import { NETWORKS, Network } from "../lib/swapperd";

import logo from "../styles/images/logo.png";
import { ApplicationData } from '../store/storeTypes';
import { clearPassword } from '../store/actions/login/loginActions';

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
                        {
                            Object.keys(NETWORKS).map(key => <option key={key} value={key}>{NETWORKS[key as Network]}</option>)
                        }
                    </select>
                }
                {password && !hideNetwork ? <div className="header--lock" onClick={this.props.actions.clearPassword} /> : <></>}
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
    setNetwork: (network: Network) => void;
}

interface State {
}

export const Header = connect(mapStateToProps, mapDispatchToProps)(HeaderClass);
