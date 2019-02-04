// import thunk from "redux-thunk";

import { applyMiddleware, createStore, Middleware } from "redux";
import logger from 'redux-logger'

import { rootReducer } from "./reducers/rootReducer";

const middlewares: Middleware[] = [
    // thunk,
    logger,
];

export const configureStore = () => {
    const store = createStore(
        rootReducer,
        applyMiddleware(...middlewares),
    );

    return { store };
};
