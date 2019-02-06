import { Container } from "unstated";

import { initialState } from "../initialState";
import { ApplicationData } from "../storeTypes";

export class AppContainer extends Container<ApplicationData> {
    public state = initialState;

    public setPassword = async (password: string) => {
        return this.setState({
            login: {
                password,
            }
        });
    }

    public clearPassword = async () => {
        return this.setState({
            login: {
                password: null,
            }
        });
    }
}
