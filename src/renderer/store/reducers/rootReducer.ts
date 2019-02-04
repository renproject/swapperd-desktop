import { combineReducers } from "redux";

import { loginReducer } from "./login/loginReducer";

import { ApplicationData } from "../storeTypes";

export const rootReducer = combineReducers<ApplicationData>({
    login: loginReducer,
});
