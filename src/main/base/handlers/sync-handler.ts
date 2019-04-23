import * as ArrExt from "../arr-extension";
import * as C from "../console";
import * as Ex from "../exceptions";
import BaseHandler from "./base-handler";
import ScopedFunc from "./scoped-func";
import * as Types from "../types-utils";

export default class SyncHandler extends BaseHandler {
    private _name;
    private _catchErrors;
    private _singleHandlers;
    private _stopped;
    private _a;
    private _argsWhenStopped;
    private _needRun;

    constructor(scope, name, catchErrors?) {
        super(scope);

        this._name = name;
        this._catchErrors = catchErrors;
        this._singleHandlers = undefined;
    }

    public on(handler) {
        if (this._inTrigger)
            return C.trace("Try to subscribe during trigger call");

        if (!Types.isMethod(handler))
            C.error(handler, "handler is not function");
        else if (this._handlers === undefined)
            this._handlers = [handler];
        else if (this._handlers.indexOf(handler) > -1)
            C.trace("try to subscribe by callback already in list");
        else
            this._handlers.push(handler);
        return this._scope;
    }

    public onScoped(handler, scope) {
        if (!Types.isMethod(handler))
            Ex.raiseError("Handler in onScoped is not function");
        if (Types.isNullOrUndefined(scope))
            Ex.raiseError("Scope in onScoped is empty");

        if (this._scopedHandlers === undefined)
            this._scopedHandlers = [new ScopedFunc(handler, scope)];
        else if (this._scopedHandlers.some((item) => item.equal(handler, scope)))
            C.trace("try to subscribe by scoped callback already in list");
        else
            this._scopedHandlers.push(new ScopedFunc(handler, scope));

        return this._scope;
    }

    public single(handler) {
        if (!Types.isMethod(handler))
            return Ex.raiseErrorFmt("Try to single subscribe not method {0}", handler);
        if (Types.isNullOrUndefined(this._singleHandlers)) {
            this._singleHandlers = [handler];
            return;
        }
        if (this._singleHandlers.indexOf(handler) > -1)
            return C.trace("try to subscribe single by callback already in list");
        this._singleHandlers.push(handler);
    }

    public trigger(...restOfName: any[]) {
        this._a = arguments.length < 1 ? undefined : Array.prototype.slice.call(arguments, 0);
        if (!this._stopped)
            return this.callHandlers();

        this._argsWhenStopped = this._a;
        this._needRun = true;
        return false;
    }

    public stop() {
        this._stopped = true;
    }

    public start() {
        this._stopped = false;
        if (!this._needRun) return;
        this._needRun = false;
        this._a = this._argsWhenStopped;
        return this.callHandlers();
    }

    public callHandlers() {
        try {
            this._inTrigger = true;
            ArrExt.arrayEach(this._singleHandlers, this.ff, this, this._catchErrors);
            this._singleHandlers = undefined; // clear since we have called them once
            const res = ArrExt.arrayAny(this._handlers, this.ff, this, this._catchErrors);
            if (res)
                return !res;
            return !ArrExt.arrayAny(this._scopedHandlers, this.ffScoped, this, this._catchErrors);
        } finally {
            this._inTrigger = false;
            this.finalizePendingDeletes();
        }
    }

    private ff(i, item) {
        const v = item.apply(this._scope, this._a);
        return v === false;
    }

    private ffScoped(i, item) {
        const v = item.ff(this._a);
        return v === false;
    }

}
