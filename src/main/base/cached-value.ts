import * as ObjExt from "./obj-extension";
import * as Types from "./types-utils";

export class CachedObject {
    private _cache;

    constructor(source: object) {
        const t = Types.getBaseType(source);
        this._cache = {};
        if (t !== "object")
            return;
        for (const cd in source) {
            if (source.hasOwnProperty(cd))
                this._cache[cd] = source[cd];
        }
    }

    public clearValue(cd: string) {
        if (this._cache.hasOwnProperty(cd))
            this._cache[cd] = undefined;
    }

    public setCachedValue(cd, value) {
        this._cache[cd] = value === undefined ? null : value;
        return value;
    }

    public getCachedValue(cd) {
        return this._cache[cd];
    }

    public hasCachedValue(cd) {
        return this._cache[cd] !== undefined;
    }

    public eachCachedValue(fn) {
        if (!fn) return;
        return ObjExt.objectEachSimple(this._cache, (cd, value) => {
            if (value === undefined)
                return;
            fn(cd, value);
        });
    }

    public anyCached(fn) {
        return ObjExt.objectAny(this._cache, fn);
    }

    public clearAll() {
        const cache = this._cache;
        for (const pr in cache) {
            if (cache.hasOwnProperty(pr))
                cache[pr] = undefined;
        }
    }

    public hasEmptyCache() {
        return Types.isEmptyObject(this._cache);
    }
}

export default function createCachedObject(source?: object) {
    return new CachedObject(source);
}
