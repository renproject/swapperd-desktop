import { ApplicationData } from "@/store/storeTypes";
import { Network } from "common/types";

export const initialState: ApplicationData = {
    app: {
        updateReady: null,
        updatingSwapperd: false,
    },
    login: {
        password: null,
    },
    trader: {
        network: Network.Mainnet,
    }
};
