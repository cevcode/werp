import * as Fmt from "./formatting";
import { R } from "./resources";

/**
 * @param message
 * @param [details]
 */
export function raiseError(message, details?) {
    throw new Error(message);
}

export function raiseErrorR(resName) {
    throw new Error(R(resName));
}

/**
 * @param condition
 * @param message
 * @param [details]
 */
export function raiseErrorIf(condition, message, details?) {
    if (!condition) return;
    raiseError(message, details);
}

export function raiseErrorFmt(fmt, ...params) {
    const str = Fmt.format(fmt, ...params);
    return raiseError(str);
}

export function raiseErrorFmtR(fmt, ...params) {
    const str = Fmt.formatR(fmt, ...params);
    return raiseError(str);
}

export function raiseErrorIfFmt(condition, fmt, ...params): void {
    if (!condition) return;
    const str = Fmt.format(fmt, ...params);
    raiseError(str);
}

export function throwException(message) {
    throw new Error(message);
}

export function throwExceptionR(resName) {
    throw new Error(R(resName));
}

export function throwExceptionFmt(fmt, ...params) {
    const msg = Fmt.format(fmt, ...params);
    throw new Error(msg);
}

export function throwExceptionFmtR(resName, ...params) {
    const msg = Fmt.formatR(resName, ...params);
    throw new Error(msg);
}
