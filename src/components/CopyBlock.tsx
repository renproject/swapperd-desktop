import * as React from "react";

import { CopyToClipboard } from "react-copy-to-clipboard";

interface ICopyBlockProps {
    value: string;
}

interface ICopyBlockState {
    copied: boolean;
}

export class CopyBlock extends React.Component<ICopyBlockProps, ICopyBlockState> {
    constructor(props: ICopyBlockProps) {
        super(props);
        this.state = {
            copied: false
        };
        this.handleCopy = this.handleCopy.bind(this);
    }

    public render(): JSX.Element {
        return (
            <div className="copy-block">
                <input type="text" value={this.props.value} onClick={this.handleSelect} readOnly={true} />
                <CopyToClipboard text={this.props.value} onCopy={this.handleCopy}>
                    <button>
                        <span>{!this.state.copied ? "Copy" : "Copied"}</span>
                    </button>
                </CopyToClipboard>
            </div>
        );
    }

    private handleSelect(e: React.MouseEvent<HTMLInputElement>): void {
        e.currentTarget.select();
    }

    private handleCopy(): void {
        this.setState({ copied: true });
        setTimeout(() => {
            this.setState({ copied: false });
        }, 1000);
    }
}