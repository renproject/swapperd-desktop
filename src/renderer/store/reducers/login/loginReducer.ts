import { ActionType, getType } from "typesafe-actions";

import * as loginActions from "../../actions/login/loginActions";

import { LoginData } from "../../storeTypes";

type AlertAction = ActionType<typeof loginActions>;

export const loginReducer = (state: LoginData = new LoginData(), action: AlertAction) => {
    switch (action.type) {
        case getType(loginActions.setPassword):
            console.log("Updating password in store to ", action.payload);
            return new LoginData({ password: "password2" });
        case getType(loginActions.clearPassword):
            return state.set("password", null);

        default:
            return state;
    }
};
