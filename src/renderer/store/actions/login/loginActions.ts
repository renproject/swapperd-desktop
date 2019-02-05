import { createStandardAction } from "typesafe-actions";

export const setPassword = createStandardAction("SET_PASSWORD")<string>();
export const clearPassword = createStandardAction("CLEAR_PASSWORD")();
