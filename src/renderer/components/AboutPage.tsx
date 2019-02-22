import * as React from "react";

import { ipc } from "@/ipc";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { Message } from "common/types";
import { Banner } from "./Banner";
import { Loading } from "./Loading";
import { Options } from "./Options";

interface IAboutPageProps extends ConnectedProps {
    updateAvailable: boolean;
    latestSwapperdVersion: string | null;
    swapperdBinaryVersion: string | null;
    swapperdDesktopVersion: string;
    updateCompleteCallback?(): void;
    onClose?(): void;
}

interface IAboutPageState {
    updateComplete: boolean;
    error: string | null;
    restarting: boolean;
}

class AboutPageClass extends React.Component<IAboutPageProps, IAboutPageState> {
    private appContainer: AppContainer;

    constructor(props: IAboutPageProps) {
        super(props);
        this.state = {
            updateComplete: false,
            error: null,
            restarting: false,
        };
        [this.appContainer] = this.props.containers;
    }

    public render() {
        const { updateAvailable, latestSwapperdVersion, swapperdBinaryVersion, swapperdDesktopVersion } = this.props;
        const { error, updateComplete, restarting } = this.state;
        const { updatingSwapperd, updateReady } = this.appContainer.state.app;
        const { password } = this.appContainer.state.login;
        const locked = password === "" || password === null;

        const binaryNeedsUpdate = !updateComplete && updateAvailable && latestSwapperdVersion !== null && swapperdBinaryVersion !== null;
        const desktopNeedsUpdate = updateReady !== null;
        const showUpdate = binaryNeedsUpdate || desktopNeedsUpdate;
        const noticeMessage = (binaryNeedsUpdate) ? "An update is available! Click the button below to update." : "An update has been installed. Please restart the app for the changes to take effect.";
        return (
            <>
                {this.props.onClose && <Banner title={locked ? "" : showUpdate ? "Notice" : "Options"} reject={this.props.onClose} />}
                {locked ? "" : showUpdate ? <>
                    <div className="notice notice--alert">{noticeMessage}</div>
                    <div className="about--page">
                        {error && <p className="error">{error}</p>}
                        {showUpdate && binaryNeedsUpdate && <div className="update--button">
                            {updatingSwapperd ? <div className="updating"><p>Updating...</p><Loading /></div> :
                                <>
                                    <button className="update" onClick={this.onUpdateHandler}>Update</button>
                                </>
                            }
                        </div>}
                        {showUpdate && desktopNeedsUpdate && <div className="update--button">
                            {updatingSwapperd ? <div className="updating"><p>Updating...</p><Loading /></div> :
                                <>
                                    <button disabled={restarting} className="update" onClick={this.onRestartHandler}>Restart</button>
                                </>
                            }
                        </div>}
                    </div>
                </>
                    : <Options />
                }
                <div className="about--footer">
                    <div className="version-banner">Binary version: <span>{swapperdBinaryVersion || "Unknown"}</span></div>
                    <div className="version-banner">UI version: <span>{swapperdDesktopVersion}</span></div>
                </div>
            </>
        );
    }

    private onUpdateHandler = async (): Promise<void> => {
        const { updateCompleteCallback } = this.props;
        this.setState({ error: null });
        await this.appContainer.setUpdatingSwapperd(true);
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperd,
                0, // timeout
                { swapperd: true, restart: false }
            );
            await this.appContainer.setUpdatingSwapperd(false);
            this.setState({ updateComplete: true });
            if (updateCompleteCallback) {
                updateCompleteCallback();
            }
        } catch (error) {
            console.error(`Got error instead!!!: ${error}`);
            await this.appContainer.setUpdatingSwapperd(false);
            this.setState({ error });
            return;
        }
    }

    private onRestartHandler = async (): Promise<void> => {
        this.setState({ error: null, restarting: true });
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperd,
                0, // timeout
                { swapperd: false, restart: true }
            );
            this.setState({ restarting: false });
        } catch (error) {
            this.setState({ restarting: false, error });
            return;
        }
    }
}

export const AboutPage = connect<IAboutPageProps>([AppContainer])(AboutPageClass);
