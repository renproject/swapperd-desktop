import * as React from "react";
import * as ReactDOM from "react-dom";

import { Provider } from "unstated";

import { App } from "./components/App";
import { _catch_ } from "./components/ErrorBoundary";

// import "@babel/polyfill";

import "./styles/index.scss";

if (process.env.NODE_ENV === "development") {
    // tslint:disable-next-line: no-require-imports
    require("devtron").install();
}

ReactDOM.render(
    _catch_(
        <Provider>
            <App />
        </Provider>
    ),
    document.getElementById("app") as HTMLElement
);
