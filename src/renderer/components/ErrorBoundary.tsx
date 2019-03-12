import * as React from "react";

import logger from "electron-log";

interface Props {
}

interface State {
    error: null | Error;
    errorInfo: null | React.ErrorInfo;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    public componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
        this.setState({
            error,
            errorInfo,
        });
        logger.error(error);
    }

    /**
     * The main render function.
     * @dev Should have minimal computation, loops and anonymous functions.
     */
    public render(): React.ReactNode {
        if (this.state.errorInfo) {
            // Error path
            return (
                <div>
                    {/* tslint:disable-next-line:react-a11y-anchors */}
                    <h2>Something went wrong. <a role="button" onClick={this.relaunch}>Click to reload</a></h2>
                    <details style={{ whiteSpace: "pre-wrap" }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }
        // Normally, just render children
        return this.props.children;
    }

    private readonly relaunch = () => {
        this.setState({ error: null, errorInfo: null });
    }
}

export const _catch_ = (
    children: React.ReactNode,
) => <ErrorBoundary >
        {children}
    </ErrorBoundary>;
