import * as React from "react";

interface IAboutPageProps {
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
        const { swapperdBinaryVersion, swapperdDesktopVersion } = this.props;
        return (
            <div className="about--page">
                <p>Swapperd version: {swapperdBinaryVersion}</p>
                <p>Swapperd Native version: {swapperdDesktopVersion}</p>
            </div>
        );
    }
}
