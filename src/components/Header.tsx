import * as React from "react";

import logo from "../styles/images/logo.png";

export class Header extends React.Component<{}> {
    constructor(props: {}) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <div className="header">
                <img src={logo} alt="Swapperd" />
            </div>
        );
    }
}
