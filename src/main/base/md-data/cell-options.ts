import * as FnExt from "../func-extension";
import * as Obj from "../obj-hash";

export function sameOptions(first, second) {
    if (first === second)
        return true;

    const f = FnExt.callByName(first, "getHash");
    const s = FnExt.callByName(second, "getHash");
    return f === s;
    // return areObjectPropsEqual(first, second);
}

export type BuildOptionsFunc = (ro, d, color, back, style, ds, f, align, cls, empty, loading, changed) => CellOptions;

let onBuildOptions: BuildOptionsFunc;

export function setBuildOptionsFunc(buildOptionsFunc: BuildOptionsFunc) {
    onBuildOptions = buildOptionsFunc;
}

export class CellOptions {
    public readonly;
    public disabled;
    public color;
    public background;
    public style;
    public datasource;
    public colFilter;
    public align;
    public empty;
    public loading;
    public cls;
    public changed;
    public _hash;

    /**
     *
     * @param {boolean} ro
     * @param {boolean} d
     * @param {string|undefined} color
     * @param {string|undefined} back
     * @param {string|undefined} style
     * @param ds
     * @param f
     * @param {string|undefined} align
     * @param {string|undefined} cls
     * @param {boolean} empty
     * @param {boolean} loading
     * @param {boolean} changed
     */
    constructor(ro?, d?, color?, back?, style?, ds?, f?, align?, cls?, empty?, loading?, changed?) {
        this.readonly = ro;
        this.disabled = d;
        this.color = color;
        this.background = back;
        this.style = style;
        this.datasource = ds;
        this.colFilter = f;
        this.align = align;
        this.empty = empty;
        this.loading = loading;
        this.cls = cls;
        this.changed = changed;
        this._hash = undefined;
    }

    /**
     * @param {CellOptions} source
     */
    public clone(source) {
        this.readonly = source.readonly;
        this.disabled = source.disabled;
        this.color = source.color;
        this.background = source.background;
        this.style = source.style;
        this.datasource = source.datasource;
        this.colFilter = source.colFilter;
        this.align = source.align;
        this.empty = source.empty;
        this.loading = source.loading;
        this.cls = source.cls;
        this.changed = source.changed;
        this._hash = undefined;
        return this;
    }
    public updateValues(ro, d, color, back, style, ds, f, align, cls, empty, loading, changed) {
        this.readonly = ro;
        this.disabled = d;
        this.color = color;
        this.background = back;
        this.style = style;
        this.datasource = ds;
        this.colFilter = f;
        this.align = align;
        this.empty = empty;
        this.loading = loading;
        this.cls = cls;
        this.changed = changed;
        this._hash = undefined;
        return this;
    }
    public getHash() {
        if (this._hash !== undefined)
            return this._hash;
        this._hash = Obj.getHash(this);
        return this._hash;
    }
}

export function defBuildOptions(ro, d, color, back, style, ds, f, align, cls, empty, loading, changed) {
    return new CellOptions(ro, d, color, back, style, ds, f, align, cls, empty, loading, changed);
}

export function buildOptions(ro, d, color, back, style, ds, f, align, cls, empty, loading, changed) {
    if (onBuildOptions)
        return onBuildOptions(ro, d, color, back, style, ds, f, align, cls, empty, loading, changed);
    return defBuildOptions(ro, d, color, back, style, ds, f, align, cls, empty, loading, changed);
}
