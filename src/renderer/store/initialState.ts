import { ApplicationData } from "@/store/storeTypes";
import { Network } from "common/types";

export const initialState: ApplicationData = {
    login: {
        password: null,
    },
    trader: {
        network: Network.Mainnet,
    }
};
