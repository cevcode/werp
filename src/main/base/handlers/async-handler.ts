import * as H from "../handler";
import LOG from "../logger/logger";
import * as Types from "../types-utils";

export default class AsyncHandler {
    private _name;
    private _scope;
    private _handlers = [];
    private _stopped;
    private _lastArgsWhenStopped;
    private _a = undefined;
    private _interval;
    private _sync;

    constructor(scope, name, interval) {
        this._name = name;
        this._scope = scope;
        this._handlers = [];
        this._stopped = false;
        this._lastArgsWhenStopped = undefined;
        this._a = undefined;
        this._interval = interval || 0;
        this._sync = {};
    }

    public on(handler) {
        if (!Types.isMethod(handler))
            return LOG.error("handler is empty in AsyncHandler.on");

        this._handlers.push(handler);
    }

    public off(handler) {
        const idx = this._handlers.indexOf(handler);
        if (idx < 0) return;
        this._handlers.splice(idx, 1);
    }

    public trigger() {
        this._a = Array.prototype.slice.call(arguments, 0);
        if (!this._stopped)
            return H.timeout(this._sync, this, this._interval, this.runAsync, true);

        this._lastArgsWhenStopped = this._a;
        return false;
    }

    public stop() {
        this._stopped = true;
    }

    public start() {
        this._stopped = false;
        if (!this._lastArgsWhenStopped) return;
        this._a = this._lastArgsWhenStopped;
        H.timeout(this._sync, this, this._interval, this.runAsync, true);
    }

    private runAsync() {

        this._handlers.some((item) => {
            const v = item.apply(this._scope, this._a);
            return v === false;
        });
    }

}
