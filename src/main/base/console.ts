import * as AsyncExt from "./async-extension";
import * as Fmt from "./formatting";

let _enableConsole = true;

export function enableConsole(enable) {
    _enableConsole = enable;
}

export function enableDebug(enable) {
    enableConsole(!!enable);
}

export function handleException(exception) {
    if (!console)
        return;
    console.error(exception);
    // tslint:disable-next-line:no-console
    console.trace();
    // tslint:disable-next-line:no-debugger
    debugger;
}

export function info(msg, ...params) {
    if (!_enableConsole)
        return;
    if (console)
        // tslint:disable-next-line:no-console
        console.info(msg, ...params);
}
export function error(msg, ...params) {
    if (!_enableConsole)
        return;
    if (console)
        console.error(msg, ...params);
}
export function warn(msg, ...params) {
    if (console)
        console.warn(msg, ...params);
}
export function log(msg, ...params) {
    if (!_enableConsole)
        return;
    if (console)
        // tslint:disable-next-line:no-console
        console.log(msg, ...params);
}
export function trace(msg?, ...params) {
    if (!_enableConsole)
        return;
    if (console)
        // tslint:disable-next-line:no-console
        console.trace(msg, ...params);
}
export function debug(msg, ...params) {
    if (!_enableConsole)
        return;
    if (console)
        // tslint:disable-next-line:no-console
        console.debug(msg, ...params);
}
export function check(expression, message) {
    if (!_enableConsole)
        return false;
    if (expression)
        return false;

    this.trace();
    this.error("ASSERT", message);
    return true;
}
export function infoAsync(...params) {
    AsyncExt.async(this.info, ...params);
}
export function warnFmt(str, ...params) {
    this.warn(Fmt.format(str, ...params));
}
export function errorFmt(str, ...params) {
    this.error(Fmt.format(str, ...params));
}
export function infoFmt(str, ...params) {
    this.info(Fmt.format(str, ...params));
}
