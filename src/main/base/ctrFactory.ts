import * as Ex from "./exceptions";
import { DEF, R } from "./resources";

export const _res = {
    NoDefaultControl: DEF("Controls.NoDefaultControl", "No default {0} control specified and no control for type {1}"),
    NoControlForType: DEF("Controls.NoControlForType", "Unable to find control for type {0}"),
};

class CtrRegistration {
    private _columnType: string;
    private _control: any;

    constructor(columnType: string, control: any) {
        this._columnType = columnType;
        this._control = control;
    }

    public get ColumnType(): string {
        return this._columnType;
    }

    public get Control(): any {
        return this._control;
    }
}

/**
 * @class control factory implementation
 * @param {String} [mode] can be RO (readonly), RW (editable), F (filter)
 * @param {boolean} [alwaysNewInstance] for any call of getCtr will create new instance of control, even if it was already created
 * @param {boolean} [noDefault] use only registered types, no default control
 * @constructor
 */
export default class CtrFactory {
    private _mode: string;
    private _controls: { [columnType: string]: CtrRegistration };
    private _default: any;
    private _noDefault: boolean;
    private _registered: boolean;
    private _register: (f: CtrFactory) => void;

    constructor(mode: string, register?: (f: CtrFactory) => void, noDefault?: boolean) {
        this._mode = mode || "RO";
        this._controls = {};
        this._default = null;
        this._noDefault = noDefault;
        this._register = register;
    }

    public registerCtr(columnType: string, control: any, isDefault?: boolean): any {
        columnType = columnType.toLowerCase();
        const res = new CtrRegistration(columnType, control);
        this._controls[columnType] = res;
        if (isDefault)
            this._default = columnType;
        return res;
    }

    public getCtr(columnType: string): any {
        this.registerControls();

        if (!this._controls.hasOwnProperty(columnType)) {
            if (!this._default) {
                if (this._noDefault)
                    return undefined;
                Ex.raiseErrorFmt(R(_res.NoDefaultControl), this._mode, columnType);
            }
            columnType = this._default;
        }

        const ctr = this._controls[columnType];
        if (!ctr)
            Ex.raiseErrorFmt(R(_res.NoControlForType), columnType);
        return ctr.Control;
    }

    private registerControls() {
        if (this._registered || !this._register)
            return;
        this._registered = true;
        this._register(this);
    }
}
