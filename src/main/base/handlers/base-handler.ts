import * as C from "../console";

export default class BaseHandler {
    public _pDelete;

    public _inTrigger;
    protected _handlers;
    protected _scopedHandlers;
    protected _scope;

    constructor(scope) {
        this._scope = scope;
        this._handlers = undefined;
        this._scopedHandlers = undefined;
    }

    public addPendingDelete(handler, scope?) {
        if (!this._pDelete)
            this._pDelete = [];
        this._pDelete.push({ h: handler, s: scope });
        C.trace("Unsubscribe during trigger call", handler, scope);
        return this._scope;
    }

    public finalizePendingDeletes() {
        if (!this._pDelete) return;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this._pDelete.length; i++) {
            const item = this._pDelete[i];
            if (item.s === undefined)
                this.off(item.h);
            else
                this.offScoped(item.h, item.s);
        }
        this._pDelete = undefined;
    }

    public off(handler) {
        if (this._inTrigger)
            return this.addPendingDelete(handler);

        if (this._handlers === undefined)
            return;

        const idx = this._handlers.indexOf(handler);
        if (idx < 0) return;
        this._handlers.splice(idx, 1);
    }

    public offScoped(handler, scope) {
        if (this._inTrigger)
            return this.addPendingDelete(handler, scope);

        if (this._scopedHandlers != null) {
            const idx = this._scopedHandlers.findIndex((item) => item.equal(handler, scope));
            if (idx != null)
                this._scopedHandlers.splice(idx, 1);
        }
        return this._scope;
    }
}
