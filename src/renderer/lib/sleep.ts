// tslint:disable-next-line: no-string-based-set-timeout
export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
