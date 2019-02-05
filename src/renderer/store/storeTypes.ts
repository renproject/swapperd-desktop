import { Record } from "../lib/record";

export interface ApplicationData {
    login: LoginData;
}

export class LoginData extends Record({
    password: null as string | null,
}) { }

