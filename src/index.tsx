import * as React from "react";
import * as ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { App } from "./components/App";
import { _catch_ } from './components/ErrorBoundary';
import { configureStore } from "./store/configureStore";

import "./styles/index.scss";

export const { store } = configureStore();

ReactDOM.render(
    _catch_(
        <Provider store={store}>
            <App />
        </Provider>
    ),
    document.getElementById("root") as HTMLElement
);
