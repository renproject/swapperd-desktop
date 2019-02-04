import thunk from "redux-thunk";

import { applyMiddleware, createStore, Middleware } from "redux";

import { rootReducer } from "./reducers/rootReducer";

const middlewares: Middleware[] = [
    thunk,
];

export const configureStore = () => {
    const store = createStore(
        rootReducer,
        applyMiddleware(...middlewares),
    );

    return { store };
};
