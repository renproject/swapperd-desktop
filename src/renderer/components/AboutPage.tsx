import * as React from "react";

import { ipc } from "@/ipc";

import { Message } from "common/types";
import { Loading } from "./Loading";

interface IAboutPageProps {
    updateAvailable: boolean;
    latestSwapperdVersion: string;
    swapperdBinaryVersion: string;
    swapperdDesktopVersion: string;
    updateCompleteCallback?(): void;
}

interface IAboutPageState {
    updateComplete: boolean;
    updating: boolean;
    error: string | null;
}

export class AboutPage extends React.Component<IAboutPageProps, IAboutPageState> {
    constructor(props: IAboutPageProps) {
        super(props);
        this.state = {
            updateComplete: false,
            updating: false,
            error: null,
        };
    }

    public render() {
        const { updateAvailable, latestSwapperdVersion, swapperdBinaryVersion, swapperdDesktopVersion } = this.props;
        const { error, updating, updateComplete } = this.state;

        const showUpdate = !updateComplete && updateAvailable && latestSwapperdVersion !== "";
        return (
            <div className="about--page">
                <h2>Swapperd Version</h2>
                <pre>{swapperdBinaryVersion}</pre>
                {showUpdate && <>
                    {error && <p className="error">{error}</p>}
                    {updating ? <div className="updating"><p>Updating... </p><Loading /></div> :
                    <>
                        <p>A new Swapperd version is available!</p>
                        <button className="update" onClick={this.onClickHandler}>Update</button>
                    </>
                    }
                </>}
                <h2>Swapperd Desktop Version</h2>
                <pre>{swapperdDesktopVersion}</pre>
            </div>
        );
    }

    private onClickHandler = async (): Promise<void> => {
        const { updateCompleteCallback } = this.props;
        this.setState({error: null, updating: true});
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperd,
                0, // timeout
                null
            );
            this.setState({updating: false, updateComplete: true});
            if (updateCompleteCallback) {
                updateCompleteCallback();
            }
        } catch (error) {
            console.error(`Got error instead!!!: ${error}`);
            this.setState({ error, updating: false });
            return;
        }
    }
}
