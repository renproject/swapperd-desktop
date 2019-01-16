import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./components/App";

import "./styles/index.scss";
import { _catch_ } from './components/ErrorBoundary';

ReactDOM.render(
    _catch_(<App />),
    document.getElementById("root") as HTMLElement
);
