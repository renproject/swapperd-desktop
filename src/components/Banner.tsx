import * as React from 'react';

interface IBannerProps {
    title: string;
}

export class Banner extends React.Component<IBannerProps, {}> {
    constructor(props: IBannerProps) {
        super(props);
        this.state = {
        };
    }

    public render() {
        const { title } = this.props;
        return (
            <div className="banner">
                <h1>{title}</h1>
            </div>
        );
    }
}
