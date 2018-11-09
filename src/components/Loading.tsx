import * as React from "react";

import '../styles/Loading.css';

interface ILoadingProps {
    alt?: boolean;
}

// tslint:disable-next-line:no-empty-interface
interface ILoadingState {
}

/**
 * Loading is a visual component that renders a spinning animation
 */
class Loading extends React.Component<ILoadingProps, ILoadingState> {
    public render(): JSX.Element {
        const { alt } = this.props;
        return (
            <div className={`loading lds-dual-ring ${alt ? "alt" : ""}`} />
        );
    }
}

export default Loading;
