import * as C from "./console";
import * as Ex from "./exceptions";
import * as Types from "./types-utils";

export function execAsyncLocking(syncObject, func, noWaitFirst) {
    if (C.check(syncObject, "Sync object is empty in for timeout")) return;
    let t;

    function onTimer() {
        func();
        clearTimeout(t);
        syncObject.timer = undefined;
        syncObject.inProgress = false;
    }

    const timeout = noWaitFirst && !syncObject.inProgress ? 0 : 30;
    if (syncObject.timer)
        clearTimeout(syncObject.timer);

    syncObject.inProgress = true;
    t = window.setTimeout(onTimer, timeout);
    syncObject.timer = t;
}

export function async2(handler, scope, ...params) {
    window.setTimeout(() => {
        return handler.call(scope, ...params);
    }, 0);
}

export let async;
export let asyncWithFinally;

if (window.requestAnimationFrame) {
    async = (handler, scope, ...params) => {
        Ex.raiseErrorIf(!Types.isMethod(handler), "async method must be specified");
        window.requestAnimationFrame(() => {
            return handler.call(scope, ...params);
        });
    };

    asyncWithFinally = (handler, finallyHandler, scope, ...params) => {
        Ex.raiseErrorIf(!Types.isMethod(handler), "async method must be specified");
        window.requestAnimationFrame(() => {
            try {
                return handler.call(scope, ...params);
            } finally {
                if (finallyHandler)
                    finallyHandler();
            }
        });
    };
} else {
    async = async2;

    asyncWithFinally = (handler, finallyHandler, scope, ...params) => {
        Ex.raiseErrorIf(!Types.isMethod(handler), "async method must be specified");
        window.setTimeout(() => {
            try {
                return handler.call(scope, ...params);
            } finally {
                if (finallyHandler)
                    finallyHandler();
            }
        }, 0);
    };
}

export function asyncWithFinally2(handler, finallyHandler, scope, ...params) {
    Ex.raiseErrorIf(!Types.isMethod(handler), "async method must be specified");
    window.setTimeout(() => {
        try {
            return handler.call(scope, ...params);
        } finally {
            if (finallyHandler)
                finallyHandler();
        }
    }, 50);
}
