import * as C from "./console";
import * as Types from "./types-utils";

export function callMethodIfExists(method, scope, ...p) {
    if (!Types.isMethod(method)) return undefined;
    // var par = Array.prototype.slice.call(arguments, 2);
    return method.call(scope, ...p);
}

export function getFnResult(v, fn, ...params) {
    return fn ? fn(v, ...params) : v;
}

/**
 * @param {Object} scope
 * @param {Function} callback
 * @param p
 */
export function safeCallCallback(scope, callback, ...p: any[]) {
    if (!callback) return undefined;
    // var par = Array.prototype.slice.call(arguments, 2);
    try {
        // return callback.apply(scope, par);
        return callback.call(scope, ...p);
    } catch (e) {
        C.trace();
        C.error("Error in safe call", e, scope, callback, ...p);
    }
}

export let safeCall = safeCallCallback;

export function sCallReturnNull(scope, callback, ...p) {
    safeCallCallback(scope, callback, ...p);
}

export function callCallback(callback, ...p: any[]) {
    return !Types.isMethod(callback) ? undefined : callback(...p);
}

export function callOnRes(value, callback, async, fn?) {
    const v = fn ? fn(value) : value;
    return async && callback ? callback(v) : v;
}

export function callOnResWithWarn(value, callback, async, fn, warning) {
    return callOnRes(value, callback, async, fn);
}

export function safeCallApply(scope, callback, params) {
    if (!callback) return undefined;
    try {
        return callback.apply(scope, params);
    } catch (e) {
        C.trace();
        C.error("Error in safe call", e, scope, callback, params);
    }
}

/**
 * @param {Object} scope
 * @param {String} methodName
 * @param p
 * @returns {*|undefined}
 */
export function safeCallByName(scope, methodName, ...p: any[]) {
    if (Types.isNullOrUndefined(scope)) return undefined;
    const callback = scope[methodName];
    if (!Types.isMethod(callback)) return undefined;

    // var par = Array.prototype.slice.call(arguments, 2);
    try {
        // return callback.apply(scope, par);
        return callback.call(scope, ...p);
    } catch (e) {
        C.trace();
        C.error("Error in call by name", e, scope, callback, ...p);
    }
}

export function callByName(scope, methodName, ...p) {
    if (Types.isNullOrUndefined(scope)) return undefined;
    const callback = scope[methodName];
    if (!Types.isMethod(callback)) return undefined;

    return callback.call(scope, ...p);
}

export function countLoad(count, callback) {
    let cnt = count;

    return () => {
        cnt--;
        if (cnt > 0) return;
        if (Types.isMethod(callback))
            callback();
    };
}
