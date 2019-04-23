import * as FnExt from "./func-extension";
import * as Types from "./types-utils";
import { Entity } from "./md-data/entity-md";

class ViewRegistration {
    private _factory: ViewFactory;
    private _cd: string;
    private _caption: string;
    private _icon: string;
    private _useNew: boolean;
    private _checkFunction: any;
    private _cnf: any;
    private _constructor: any;

    constructor(factory: ViewFactory, cd: string, caption: string, icon: string) {
        this._factory = factory;
        this._cd = cd;
        this._caption = caption;
        this._icon = icon;
        this._useNew = undefined;
        this._constructor = undefined;
        this._checkFunction = undefined;
        this._cnf = undefined;
    }

    public getForMenu() {
        return { caption: this._caption, data: this._cnf, viewCd: this._cd, className: "devault-view", icon: this._icon };
    }

    public setConstructor(constructor, useNew) {
        this._useNew = !!useNew;
        this._constructor = constructor;
        return this;
    }

    public get Constructor() {
        return this._constructor;
    }

    public setCheckFn(fn) {
        this._checkFunction = fn;
        return this;
    }

    public setCnf(cnf) {
        this._cnf = cnf;
        return this;
    }

    public setDefault() {
        this._factory.defaultView = this;
        return this;
    }

    public check(entity) {
        if (!entity)
            return true;
        if (entity.canUseView && !entity.canUseView(this._cd))
            return false;
        return this._checkFunction ? this._checkFunction(entity) : true;
    }
}

export default class ViewFactory {
    private _register: {ViewRegistration};
    private _default: ViewRegistration;
    private _type: string;

    constructor(type?: string) {
        this._register = { } as { ViewRegistration };
        this._default = undefined;
        this._type = type;
    }

    public register(cd: string, caption: string, icon: string, constructor?, useNew?: boolean, checkFunction?, cnf?): ViewRegistration {
        const r = new ViewRegistration(this, cd, caption, icon)
            .setConstructor(constructor, useNew).setCheckFn(checkFunction).setCnf(cnf);
        this._register[cd] = r;
        return r;
    }

    set defaultView(view: ViewRegistration) {
        this._default = view;
    }

    public getViews(): { ViewRegistration } {
        return this._register;
    }

    public get(cd?: string, entity?: Entity) {
        const res = this.getVCtrOrDef(cd, entity);
        return res && res.check(entity) ? res : this.getDefaultView(entity);
    }

    private getDefaultView(entity?: Entity) {
        if (!entity)
            return this._default;
        const views = FnExt.safeCallByName(entity, "getViews");
        if (Types.isEmpty(views))
            return this._default;
        const self = this;
        let res;
        views.some((view) => {
            const ctr = self._register[view];
            if (ctr && ctr.check(entity)) {
                res = ctr;
                return true;
            }
        });
        return res || this._default;
    }

    private getVCtrOrDef(cd: string, entity: Entity) {
        if (Types.isNullOrUndefined(cd))
            return this.getDefaultView(entity);
        const res = this._register[cd];
        return res || this.getDefaultView(entity);
    }
}
