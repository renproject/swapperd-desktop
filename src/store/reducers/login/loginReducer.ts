import { ActionType, getType } from "typesafe-actions";

import * as loginActions from "../../actions/login/loginActions";

import { LoginData } from "../../storeTypes";

type AlertAction = ActionType<typeof loginActions>;

export const loginReducer = (state: LoginData = new LoginData(), action: AlertAction) => {
    switch (action.type) {
        case getType(loginActions.setPassword):
            return state.set("password", action.payload);
        case getType(loginActions.clearPassword):
            return state.set("password", null);

        default:
            return state;
    }
};
