export default class ScopedFunc {
    public _handler;
    public _scope;

    constructor(handler, scope) {
        this._handler = handler;
        this._scope = scope;
    }

    public ff(a) {
        return this._handler.apply(this._scope, a);
    }
    public equal(handler, scope) {
        return this._handler === handler && this._scope === scope;
    }
}
