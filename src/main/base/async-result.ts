import * as ObjExt from "./obj-extension";
import * as Types from "./types-utils";

export class AsyncResult {

}

export function createAsyncResult() {
    return new AsyncResult();
}

export function isAsyncResult(value) {
    return ObjExt.checkPrototype(value, AsyncResult.prototype);
}

export function execAsyncFunc(fn, callback, ...params) {
    if (!Types.isMethod(fn)) return undefined;

    return fn(callback, ...params);
}
