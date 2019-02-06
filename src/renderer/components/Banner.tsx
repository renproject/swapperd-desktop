import * as React from "react";

interface IBannerProps {
    title: string;
    disabled?: boolean;
    reject?(): void;
}

export class Banner extends React.Component<IBannerProps> {
    constructor(props: IBannerProps) {
        super(props);
    }

    public render() {
        const { title, disabled, reject } = this.props;
        return (
            <div className="banner">
                <h1>{title}</h1>
                {reject !== undefined &&
                    <div className={`banner--cross ${disabled ? "disabled" : ""}`} onClick={disabled ? undefined : reject} />
                }
            </div>
        );
    }
}
