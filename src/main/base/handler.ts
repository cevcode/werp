import * as C from "./console";
import * as Types from "./types-utils";

export interface ISyncObject {
    timer?: number;
    inProgress?: boolean;
}

type TimeOutFunc = () => void;

export function timeout(syncObject: ISyncObject, scope: any, timeOut: number, func: TimeOutFunc, waiting?: boolean) {
    if (C.check(syncObject, "Sync object is empty in for timeout")) return;

    if (waiting) {
        if (syncObject.timer)
            clearTimeout(syncObject.timer);
    } else {
        if (syncObject.inProgress) return;
    }

    syncObject.inProgress = true;
    if (Types.isNullOrUndefined(timeOut))
        timeOut = 200;
    const t = window.setTimeout(() => {
        func.call(scope);
        clearTimeout(t);
        syncObject.inProgress = false;
    }, timeOut);
    syncObject.timer = t;
}

export function startHandlers(start: boolean) {
    for (let i = 1; i < arguments.length; i++) {
        const handler = arguments[i];
        if (start)
            handler.start();
        else
            handler.stop();
    }
}
