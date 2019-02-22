import * as React from "react";

import { remote } from "electron";

import { AboutPage } from "@/components/AboutPage";
import { AcceptMnemonic } from "@/components/AcceptMnemonic";
import { ApproveSwap } from "@/components/ApproveSwap";
import { ApproveWithdraw } from "@/components/ApproveWithdraw";
import { Balances } from "@/components/Balances";
import { CreateAccount } from "@/components/CreateAccount";
import { Header } from "@/components/Header";
import { Swaps } from "@/components/Swaps";
import { UnlockScreen } from "@/components/UnlockScreen";
import { ipc } from "@/ipc";
import { Record } from "@/lib/record";
import { fetchInfo, getSwaps, getTransfers, IPartialSwapRequest, IPartialWithdrawRequest, ISwapsResponse, ITransfersResponse } from "@/lib/swapperd";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { Message, Network } from "common/types";

import { version as APP_VERSION } from "../../../package.json";

export class NetworkDetails extends Record({
    swaps: null as ISwapsResponse | null,
    transfers: null as ITransfersResponse | null,
}) { }

export class NetworkState extends Record({
    [Network.Mainnet]: new NetworkDetails(),
    [Network.Testnet]: new NetworkDetails(),
}) { }

class AppClass extends React.Component<IAppProps, IAppState> {
    private callGetBalancesTimeout: NodeJS.Timer | undefined;
    private callGetAccountTimeout: NodeJS.Timer | undefined;
    private callGetTransactionsTimeout: NodeJS.Timer | undefined;

    private appContainer: AppContainer;

    constructor(props: IAppProps) {
        super(props);
        this.state = {
            networkDetails: new NetworkState(),
            origin: "",
            mnemonic: "",
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
            swapperdVersion: null,
            latestSwapperdVersion: null,
            showAbout: false,
            balancesError: null,
        };

        [this.appContainer] = this.props.containers;
    }

    public readonly componentWillUnmount = () => {
        // Clear timeouts
        if (this.callGetBalancesTimeout) { clearTimeout(this.callGetBalancesTimeout); }
        if (this.callGetAccountTimeout) { clearTimeout(this.callGetAccountTimeout); }
        if (this.callGetTransactionsTimeout) { clearTimeout(this.callGetTransactionsTimeout); }
    }

    public readonly componentDidMount = async () => {
        // Attach event to swap

        ipc.delayedOn(Message.Swap, async (swap) => {
            try {
                const network = swap.network ? swap.network : this.appContainer.state.trader.network;
                const origin = swap.origin ? swap.origin : this.state.origin;
                await this.appContainer.setNetwork(network);
                this.setState({ swapDetails: swap.body, origin });
            } catch (error) {
                console.error(error);
            }
        });

        ipc.on(Message.GetPassword, () => {
            const { password } = this.appContainer.state.login;
            if (password === null) {
                throw new Error("Swapperd locked");
            }
            return password;
        });

        ipc.on(Message.GetNetwork, () => {
            return this.appContainer.state.trader.network;
        });

        ipc.on(Message.UpdateReady, async (version: string) => {
            await this.appContainer.setUpdateReady(version);
            return;
        });

        ipc.on(Message.LatestSwapperdVersion, async (version: string) => {
            this.setState({ latestSwapperdVersion: version });
        });

        this.callGetAccount().catch(console.error);
        this.callGetBalances().catch(console.error);

        const callGetTransactions = async () => {
            const { password } = this.appContainer.state.login;
            const { accountExists } = this.state;

            if (accountExists && password !== null) {
                try {
                    const { network } = this.appContainer.state.trader;
                    const swaps = await getSwaps({ network, password: password });

                    const { networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("swaps", swaps)) });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
                try {
                    const { network } = this.appContainer.state.trader;
                    const transfers = await getTransfers({ network: network, password: password });

                    const { networkDetails } = this.state;
                    this.setState({ networkDetails: networkDetails.set(network, networkDetails.get(network).set("transfers", transfers)) });
                } catch (e) {
                    console.error(e.response && e.response.data.error || e);
                }
            }

            if (this.callGetTransactionsTimeout) { clearTimeout(this.callGetTransactionsTimeout); }
            this.callGetTransactionsTimeout = setTimeout(callGetTransactions, 5 * 1000);
        };
        callGetTransactions().catch(console.error);
    }

    // tslint:disable:jsx-no-lambda
    // tslint:disable:react-this-binding-issue
    public readonly render = (): JSX.Element => {
        const { login: { password }, trader: { network } } = this.appContainer.state;

        const { balancesError, latestSwapperdVersion, origin, showAbout, swapperdVersion, mnemonic, accountExists, swapDetails, withdrawRequest, networkDetails } = this.state;
        const { swaps, transfers } = networkDetails.get(network);
        const balances = this.appContainer.state.trader.balances.get(network) || null;

        const updateAvailable = remote.process.platform !== "win32" && latestSwapperdVersion !== null && latestSwapperdVersion !== swapperdVersion;

        // tslint:disable-next-line:no-any
        const headerProps: any = {
            network,
            setNetwork: this.setNetwork,
            logoOnClick: this.logoClick,
            updateAvailable,
        };

        if (showAbout) {
            return <div className="app">
                <Header hideNetwork={true} {...headerProps} />
                <AboutPage
                    updateCompleteCallback={this.callGetAccount}
                    updateAvailable={updateAvailable}
                    latestSwapperdVersion={latestSwapperdVersion}
                    swapperdBinaryVersion={swapperdVersion}
                    swapperdDesktopVersion={APP_VERSION}
                    onClose={() => { this.setState({ showAbout: false }); }}
                />
            </div>;
        }

        if (mnemonic !== "") {
            return <div className="app">
                <Header hideNetwork={true} {...headerProps} />
                <AcceptMnemonic mnemonic={mnemonic} resolve={this.mnemonicSaved} />
            </div>;
        }

        if (!accountExists) {
            return <div className="app">
                <Header hideNetwork={true} {...headerProps} />
                <CreateAccount resolve={this.accountCreated} />
            </div>;
        }

        if (password === null) {
            return <div className="app">
                <Header hideNetwork={true} {...headerProps} />
                <UnlockScreen resolve={this.setUnlocked} />
            </div>;
        }

        if (swapDetails) {
            return <div className="app">
                <Header hideNetwork={true} {...headerProps} />
                <ApproveSwap
                    origin={origin}
                    network={network}
                    swapDetails={swapDetails}
                    resetSwapDetails={this.resetSwapDetails}
                />
            </div>;
        }

        if (withdrawRequest) {
            return <div className="app">
                <Header hideNetwork={false} disableNetwork={true} {...headerProps} />
                <ApproveWithdraw
                    network={network}
                    balances={balances}
                    withdrawRequest={withdrawRequest}
                    setWithdrawRequest={this.setWithdrawRequest}
                />
            </div>;
        }

        return <div className="app">
            <Header {...headerProps} />
            <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
            <Swaps swaps={swaps} transfers={transfers} />
        </div>;
    }
    // tslint:enable:jsx-no-lambda
    // tslint:enable:react-this-binding-issue

    private readonly setUnlocked = async (password: string): Promise<void> => {
        await this.appContainer.setPassword(password);
        // Fetch the balances for the first time
        await this.appContainer.updateBalances(Network.Mainnet);
        await this.appContainer.updateBalances(Network.Testnet);
    }

    private readonly setNetwork = async (network: Network): Promise<void> => {
        await this.appContainer.setNetwork(
            network,
        );
        // Fetch new balances immediately
        await this.callGetBalances().catch(console.error);
        await this.callGetAccount().catch(console.error);
    }

    private readonly mnemonicSaved = (): void => {
        this.setState({ mnemonic: "" });
    }

    private readonly accountCreated = async (mnemonic: string, password: string): Promise<void> => {
        this.setState({ accountExists: true, mnemonic });
        await this.setUnlocked(password);
        ipc.sendMessage(
            Message.Notify,
            {
                notification: `Account ${mnemonic === "" ? "imported successfully!" : "creation successful!"}`
            },
        );
    }

    private readonly resetSwapDetails = (): void => {
        this.setState({
            swapDetails: null,
            origin: "",
        });
    }

    private readonly setWithdrawRequest = (withdrawRequest: IPartialWithdrawRequest | null): void => {
        this.setState({ withdrawRequest });
    }

    private readonly callGetBalances = async () => {
        if (this.callGetBalancesTimeout) { clearTimeout(this.callGetBalancesTimeout); }
        const { login: { password } } = this.appContainer.state;
        const { accountExists } = this.state;
        let timeout = 10 * 1000;
        if (accountExists && password !== null) {
            try {
                await this.appContainer.updateBalances();
                if (this.state.balancesError) {
                    this.setState({ balancesError: null });
                }
            } catch (e) {
                console.error(e);
                timeout = 1 * 1000;
                this.setState({ balancesError: `Your balances may be out of date! The most recent attempt to update balances failed.` });
            }
        }
        this.callGetBalancesTimeout = setTimeout(this.callGetBalances, timeout);
    }

    private readonly logoClick = () => {
        this.setState({ showAbout: !this.state.showAbout });
    }

    // Check if user has an account set-up
    private readonly callGetAccount = async () => {
        if (this.callGetAccountTimeout) { clearTimeout(this.callGetAccountTimeout); }

        const { login: { password }, trader: { network } } = this.appContainer.state;
        try {
            const accountIsSetup = await ipc.sendSyncWithTimeout(
                Message.CheckSetup,
                0, // timeout
                null
            );
            if (!accountIsSetup) {
                // If there is no account then make sure the state reflects that
                if (this.state.accountExists) {
                    this.setState({ accountExists: false });
                }
            } else {
                // We can try to login since we know an account exists
                const infoResponse = await fetchInfo({ network: network, password: password || "" });
                this.setState({
                    swapperdVersion: infoResponse.version,
                });

                if (!this.state.accountExists) {
                    this.setState({ accountExists: true });
                }
            }
        } catch (e) {
            console.error(e.response && e.response.data.error || e);
        }

        this.callGetAccountTimeout = setTimeout(this.callGetAccount, 10 * 1000);
    }
}

interface IAppProps extends ConnectedProps {
}

interface IAppState {
    networkDetails: NetworkState;

    origin: string;
    mnemonic: string;
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
    swapperdVersion: string | null;
    showAbout: boolean;
    latestSwapperdVersion: string | null;
    balancesError: string | null;
}

export const App = connect<IAppProps>([AppContainer])(AppClass);
