import * as React from "react";

import { ipc } from "@/ipc";
import { AppContainer } from "@/store/containers/appContainer";

import { connect, ConnectedProps } from "@/store/connect";
import { Message } from "common/types";
import { Banner } from "./Banner";
import { Loading } from "./Loading";

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
}

class AboutPageClass extends React.Component<IAboutPageProps, IAboutPageState> {
    private appContainer: AppContainer;

    constructor(props: IAboutPageProps) {
        super(props);
        this.state = {
            updateComplete: false,
            error: null,
        };
        [this.appContainer] = this.props.containers;
    }

    public render() {
        const { updateAvailable, latestSwapperdVersion, swapperdBinaryVersion, swapperdDesktopVersion } = this.props;
        const { error, updateComplete } = this.state;
        const { updatingSwapperd } = this.appContainer.state.app;

        const showUpdate = !updateComplete && updateAvailable && latestSwapperdVersion !== null && swapperdBinaryVersion !== null;
        return (
            <>
                {this.props.onClose && <Banner reject={this.props.onClose} />}
                <div className="about--page">
                    <h2>Swapperd Version</h2>
                    <pre>{swapperdBinaryVersion || <span className="red">Unable to connect</span>}</pre>
                    {showUpdate && <>
                        {error && <p className="error">{error}</p>}
                        {updatingSwapperd ? <div className="updating"><p>Updating... </p><Loading /></div> :
                            <>
                                <p>A new Swapperd version is available!</p>
                                <button className="update" onClick={this.onClickHandler}>Update</button>
                            </>
                        }
                    </>}
                    <h2>Swapperd Desktop Version</h2>
                    <pre>{swapperdDesktopVersion}</pre>
                </div>
            </>
        );
    }

    private onClickHandler = async (): Promise<void> => {
        const { updateCompleteCallback } = this.props;
        this.setState({ error: null });
        await this.appContainer.setUpdatingSwapperd(true);
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperd,
                0, // timeout
                null
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
}

export const AboutPage = connect<IAboutPageProps>([AppContainer])(AboutPageClass);
