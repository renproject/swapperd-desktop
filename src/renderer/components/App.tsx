import * as React from "react";

import logger from "electron-log";

import { remote } from "electron";

import { AboutPage, VersionBlock } from "@/components/AboutPage";
import { AcceptMnemonic } from "@/components/AcceptMnemonic";
import { ApproveSwap } from "@/components/ApproveSwap";
import { ApproveWithdraw } from "@/components/ApproveWithdraw";
import { Balances } from "@/components/Balances";
import { CreateAccount } from "@/components/CreateAccount";
import { Header } from "@/components/Header";
import { Swaps } from "@/components/Swaps";
import { UnlockScreen } from "@/components/UnlockScreen";
import { ipc } from "@/ipc";
import { fetchInfo, IPartialSwapRequest, IPartialWithdrawRequest, IWithdrawRequest } from "@/lib/swapperd";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { OptionsContainer } from "@/store/containers/optionsContainer";
import { Message, Network } from "common/types";

import { version as APP_VERSION } from "../../../package.json";

class AppClass extends React.Component<IAppProps, IAppState> {
    private callGetBalancesTimeout: NodeJS.Timer | undefined;
    private callGetAccountTimeout: NodeJS.Timer | undefined;
    private callGetTransactionsTimeout: NodeJS.Timer | undefined;

    private readonly appContainer: AppContainer;
    private readonly optionsContainer: OptionsContainer;

    constructor(props: IAppProps) {
        super(props);
        this.state = {
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
        [this.appContainer, this.optionsContainer] = this.props.containers;
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
                const network = swap.network ? swap.network : this.optionsContainer.state.network;
                const origin = swap.origin ? swap.origin : this.state.origin;
                await this.optionsContainer.setNetwork(network);
                this.setState({ swapDetails: swap.body, origin });
            } catch (error) {
                logger.error(error);
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
            return this.optionsContainer.state.network;
        });

        ipc.on(Message.UpdateReady, async (version: string) => {
            await this.appContainer.setUpdateReady(version);
            return;
        });

        ipc.on(Message.InstallProgress, async (percent: number | null) => {
            await this.appContainer.setInstallProgress(percent);
            return;
        });

        ipc.on(Message.LatestSwapperdVersion, async (version: string) => {
            this.setState({ latestSwapperdVersion: version });
        });

        this.callGetAccount().catch(logger.error);
        this.callGetBalances().catch(logger.error);

        const callGetTransactions = async () => {
            const { network } = this.optionsContainer.state;
            const { password } = this.appContainer.state.login;
            const { accountExists } = this.state;

            if (accountExists && password !== null) {
                try {
                    await this.appContainer.updateSwaps(network);
                } catch (e) {
                    logger.error(e.response && e.response.data.error || e);
                }
                try {
                    await this.appContainer.updateTransfers(network);
                } catch (e) {
                    logger.error(e.response && e.response.data.error || e);
                }
            }

            if (this.callGetTransactionsTimeout) { clearTimeout(this.callGetTransactionsTimeout); }
            this.callGetTransactionsTimeout = setTimeout(callGetTransactions, 5 * 1000);
        };
        callGetTransactions().catch(logger.error);
    }

    // tslint:disable:jsx-no-lambda
    // tslint:disable:react-this-binding-issue
    public readonly render = (): JSX.Element => {
        const { login: { password } } = this.appContainer.state;
        const { network } = this.optionsContainer.state;

        const { balancesError, latestSwapperdVersion, origin, showAbout, swapperdVersion, mnemonic, accountExists, swapDetails, withdrawRequest } = this.state;
        const { balances, swaps, transfers } = this.appContainer.state.trader;
        const traderBalances = balances.get(network) || null;
        const traderSwaps = swaps.get(network) || null;
        const traderTransfers = transfers.get(network) || null;

        const updateAvailable = remote.process.platform !== "win32" && latestSwapperdVersion !== null && latestSwapperdVersion !== swapperdVersion;

        // tslint:disable-next-line:no-any
        const headerProps: any = {
            network,
            setNetwork: this.setNetwork,
            settingsOnClick: this.logoClick,
            updateAvailable,
            settingsOpen: showAbout,
        };

        if (mnemonic !== "") {
            return <div className="app">
                <Header {...headerProps} hideSettings={true} hideNetwork={true} />
                <AcceptMnemonic mnemonic={mnemonic} resolve={this.mnemonicSaved} />
            </div>;
        }

        if (!accountExists) {
            return <div className="app">
                <Header {...headerProps} hideSettings={true} hideNetwork={true} />
                <CreateAccount resolve={this.accountCreated} />
                <div className="app--footer">
                    <VersionBlock
                        swapperdBinaryVersion={swapperdVersion}
                        swapperdDesktopVersion={APP_VERSION}
                    />
                </div>
            </div>;
        }

        if (password === null) {
            return <div className="app">
                <Header {...headerProps} hideSettings={true} hideNetwork={true} />
                <UnlockScreen resolve={this.setUnlocked} />
            </div>;
        }

        if (swapDetails !== null) {
            return <div className="app">
                <Header {...headerProps} hideSettings={true} hideNetwork={true} />
                <ApproveSwap
                    origin={origin}
                    network={network}
                    swapDetails={swapDetails as IPartialSwapRequest}
                    resetSwapDetails={this.resetSwapDetails}
                />
            </div>;
        }

        if (password && showAbout && swapDetails === null) {
            return <div className="app">
                <Header {...headerProps} hideNetwork={true} />
                <AboutPage
                    updateCompleteCallback={this.callGetAccount}
                    updateAvailable={updateAvailable}
                    latestSwapperdVersion={latestSwapperdVersion}
                    swapperdBinaryVersion={swapperdVersion}
                    swapperdDesktopVersion={APP_VERSION}
                />
            </div>;
        }

        if (withdrawRequest !== null) {
            return <div className="app">
                <Header {...headerProps} hideNetwork={false} disableNetwork={true} />
                <ApproveWithdraw
                    network={network}
                    balances={traderBalances}
                    withdrawRequest={withdrawRequest as IWithdrawRequest}
                    setWithdrawRequest={this.setWithdrawRequest}
                />
            </div>;
        }

        return <div className="app">
            <Header {...headerProps} />
            <Balances balances={traderBalances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
            <Swaps swaps={traderSwaps} transfers={traderTransfers} />
        </div>;
    }
    // tslint:enable:jsx-no-lambda
    // tslint:enable:react-this-binding-issue

    private readonly setUnlocked = async (password: string): Promise<void> => {
        this.setState({ showAbout: false });
        await this.appContainer.setPassword(password);
        // Fetch the balances for the first time
        await this.appContainer.updateBalances(Network.Mainnet);
        await this.appContainer.updateBalances(Network.Testnet);
    }

    private readonly setNetwork = async (network: Network): Promise<void> => {
        await this.optionsContainer.setNetwork(
            network,
        );
        // Fetch new balances immediately
        await this.callGetBalances().catch(logger.error);
        await this.callGetAccount().catch(logger.error);
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
                title: `Account ${mnemonic === "" ? "Imported" : "Created"}`,
                notification: `Your SwapperD account has been ${mnemonic === "" ? "imported" : "created"} successfully`
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
        const { network } = this.optionsContainer.state;
        const { accountExists } = this.state;
        let timeout = 10 * 1000;
        if (accountExists && password !== null) {
            try {
                await this.appContainer.updateBalances(network);
                if (this.state.balancesError) {
                    this.setState({ balancesError: null });
                }
            } catch (e) {
                logger.error(e);
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

        const { login: { password } } = this.appContainer.state;
        const { network } = this.optionsContainer.state;
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
            logger.error(e.response && e.response.data.error || e);
        }

        this.callGetAccountTimeout = setTimeout(this.callGetAccount, 10 * 1000);
    }
}

interface IAppProps extends ConnectedProps {
}

interface IAppState {
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

export const App = connect<IAppProps>([AppContainer, OptionsContainer])(AppClass);
