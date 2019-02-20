import * as React from "react";

interface IAboutPageProps {
    latestSwapperdVersion: string;
    swapperdBinaryVersion: string;
    swapperdDesktopVersion: string;
}

interface IAboutPageState {
}

export class AboutPage extends React.Component<IAboutPageProps, IAboutPageState> {
    constructor(props: IAboutPageProps) {
        super(props);
    }

    public render() {
        const { latestSwapperdVersion, swapperdBinaryVersion, swapperdDesktopVersion } = this.props;
        const updateAvailable = latestSwapperdVersion && latestSwapperdVersion !== swapperdBinaryVersion;
        return (
            <div className="about--page">
                {updateAvailable && <p>An update to SwapperD is available! Latest version: {latestSwapperdVersion}</p>}
                <p>Swapperd version: {swapperdBinaryVersion}</p>
                <p>Swapperd Native version: {swapperdDesktopVersion}</p>
            </div>
        );
    }
}
