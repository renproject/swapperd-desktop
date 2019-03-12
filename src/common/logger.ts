import { version as APP_VERSION } from "../../package.json";

export const FILE_FORMAT = `[{y}-{m}-{d} {h}:{i}:{s}.{ms}] ${APP_VERSION} [{level}] {text}`;
export const CONSOLE_MAIN_FORMAT = `%c{h}:{i}:{s}.{ms}%c ${APP_VERSION} › {text}`;
export const CONSOLE_RENDERER_FORMAT = `{h}:{i}:{s}.{ms} ${APP_VERSION} › {text}`;
