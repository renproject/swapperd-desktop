import * as React from "react";

interface ILoadingProps {
    alt?: boolean;
}

export class Loading extends React.Component<ILoadingProps> {
    public render(): JSX.Element {
        const { alt } = this.props;
        return (
            <div className={`loading lds-dual-ring ${alt ? "alt" : ""}`} />
        );
    }
}
