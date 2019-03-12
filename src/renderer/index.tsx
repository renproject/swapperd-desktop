import * as React from "react";
import * as ReactDOM from "react-dom";

import logger from "electron-log";

import { Provider } from "unstated";

import { App } from "@/components/App";
import { _catch_ } from "@/components/ErrorBoundary";

import { CONSOLE_RENDERER_FORMAT, FILE_FORMAT } from "../common/logger";

// import "@babel/polyfill";

import "./styles/index.scss";

logger.transports.console.format = CONSOLE_RENDERER_FORMAT;
logger.transports.file.format = FILE_FORMAT;

if (process.env.NODE_ENV === "development") {
    // tslint:disable-next-line: no-require-imports
    require("devtron").install();
} else {
    logger.transports.console.level = "info";
    logger.transports.file.level = "info";
}

ReactDOM.render(
    _catch_(
        <Provider>
            <App />
        </Provider>
    ),
    document.getElementById("app") as HTMLElement
);
