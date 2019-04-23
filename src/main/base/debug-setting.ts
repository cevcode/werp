import * as C from "./console";
import * as Storage from "./storage";

export default class DebugSetting {
    public _name;
    public _debug;

    constructor(name) {
        this._name = name;
        this._debug = Storage.getDebug(name);
    }

    private setDebugValue(value) {
        this._debug = value;
        Storage.setDebug(this._name, this._debug);
    }

    public startDebug() {
        this.setDebugValue(true);
    }

    public stopDebug() {
        this.setDebugValue(false);
    }

    public write(...params) {
        if (!this._debug) return;

        C.debug(this._name, ...params);
    }
}
