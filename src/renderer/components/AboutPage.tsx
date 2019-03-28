import * as React from "react";

import logger from "electron-log";

import { Circle } from "rc-progress";

import { ipc } from "@/ipc";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { Message } from "common/types";
import { Banner } from "./Banner";
import { Options } from "./Options";

interface IAboutPageProps extends ConnectedProps {
    updateAvailable: boolean;
    latestSwapperDVersion: string | null;
    swapperDBinaryVersion: string | null;
    swapperDDesktopVersion: string;
    updateCompleteCallback?(): void;
}

interface IAboutPageState {
    updateComplete: boolean;
    error: string | null;
    restarting: boolean;
}

export const VersionBlock = (props: { swapperDBinaryVersion: string | null; swapperDDesktopVersion: string }) => (
    <div>
        {props.swapperDBinaryVersion && <div className="version-banner">Binary version: <span>{props.swapperDBinaryVersion || "Unknown"}</span></div>}
        <div className="version-banner">UI version: <span>{props.swapperDDesktopVersion}</span></div>
    </div>
);

class AboutPageClass extends React.Component<IAboutPageProps, IAboutPageState> {
    private readonly appContainer: AppContainer;

    constructor(props: IAboutPageProps) {
        super(props);
        this.state = {
            updateComplete: false,
            error: null,
            restarting: false,
        };
        [this.appContainer] = this.props.containers;
    }

    // tslint:disable-next-line:cyclomatic-complexity
    public render() {
        const { updateAvailable, latestSwapperDVersion, swapperDBinaryVersion, swapperDDesktopVersion } = this.props;
        const { error, updateComplete, restarting } = this.state;
        const { updatingSwapperD, updateReady } = this.appContainer.state.app;
        const { password } = this.appContainer.state.login;
        const locked = password === "" || password === null;

        const binaryNeedsUpdate = !updateComplete && updateAvailable && latestSwapperDVersion !== null && swapperDBinaryVersion !== null;
        const desktopNeedsUpdate = updateReady !== null;
        const showUpdate = binaryNeedsUpdate || desktopNeedsUpdate;
        const noticeMessage = (binaryNeedsUpdate) ? "An update is available! Click the button below to update." : "An update has been installed. Please restart the app for the changes to take effect.";

        const progress = this.appContainer.state.app.installProgress;

        return <div className={`about--page ${showUpdate ? "update--available" : ""}`}>
            <Banner title="Settings" />
            <Options />
            <div className="about--footer">
                {!locked && showUpdate && <div className="notice notice--alert">{noticeMessage}</div>}
                {!locked && error && <p className="error">{error}</p>}
                <div className="about--footer--content">
                    <VersionBlock swapperDBinaryVersion={swapperDBinaryVersion} swapperDDesktopVersion={swapperDDesktopVersion} />
                    {!locked && showUpdate ?
                        <div className="update--button">
                            {updatingSwapperD ? <div className="updating">
                                <Circle percent={progress || 0} strokeWidth="4" className="progress" /></div> :
                                <>
                                    {binaryNeedsUpdate ?
                                        <button className="update" onClick={this.onUpdateHandler}>Update</button> :
                                        <button disabled={restarting} className="update" onClick={this.onRestartHandler}>Restart</button>
                                    }
                                </>
                            }
                        </div> : null}
                </div>
            </div>
        </div>;
    }

    private readonly onUpdateHandler = async (): Promise<void> => {
        const { updateCompleteCallback } = this.props;
        this.setState({ error: null });
        await this.appContainer.setUpdatingSwapperD(true);
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperD,
                0, // timeout
                { swapperD: true, restart: false }
            );
            await this.appContainer.setUpdatingSwapperD(false);
            this.setState({ updateComplete: true });
            if (updateCompleteCallback) {
                updateCompleteCallback();
            }
        } catch (error) {
            logger.error(`Got error instead!!!: ${error}`);
            await this.appContainer.setUpdatingSwapperD(false);
            this.setState({ error });
        }
        await this.appContainer.setInstallProgress(null);
    }

    private readonly onRestartHandler = async (): Promise<void> => {
        this.setState({ error: null, restarting: true });
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperD,
                0, // timeout
                { swapperD: false, restart: true }
            );
            this.setState({ restarting: false });
        } catch (error) {
            this.setState({ restarting: false, error });
        }
        await this.appContainer.setInstallProgress(null);
    }
}

export const AboutPage = connect<IAboutPageProps>([AppContainer])(AboutPageClass);
