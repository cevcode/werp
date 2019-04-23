import * as Ex from "./exceptions";
import * as FnExt from "./func-extension";
import * as ObjExt from "./obj-extension";
import * as Res from "./resources";
import * as Types from "./types-utils";

import { DEF, R } from "./resources";

export const _res = {
    Loading: DEF("Format.Loading", "<loading...>"),
};
// region no loaded support

// tslint:disable-next-line:variable-name
const __notLoaded = {// dummy value
    notLoaded: true,
    toString: () => {
        return R(_res.Loading);
    },
};

export function isNotLoaded(value) {
    return value === __notLoaded;
}

export function getNotLoaded() {
    return __notLoaded;
}

// endregion

const _lValueProto = {
    isLValue: () => {
        return true;
    },
};

export class LValue {
    public isLValue;

    // tslint:disable-next-line:variable-name
    private Id;
    private caption;
    private icon;
    // tslint:disable-next-line:variable-name
    private Class;

    constructor(value, caption, icon?, cl?) {
        this.Id = value;
        this.caption = caption;

        this.icon = icon;
        this.Class = cl;
        this.isLValue = _lValueProto.isLValue;
    }

    public toString() {
        return this.caption;
    }
}

export function setObjectAsLValue(object) {
    object.isLValue = _lValueProto.isLValue;
}

/** @typedef {string|number} Sws.lValueKey */

/**
 * @param {lValueKey} value
 * @param {string} caption
 * @returns {LValue}
 */
export function createLValue(value, caption) {
    return new LValue(value, caption);
}

/**
 * @param {lValueKey} value
 * @param {string} caption
 * @param {string} icon style
 * @param {string} [cl] css class
 * @returns {LValue}
 */
export function createLValueExt(value, caption, icon?, cl?) {
    return new LValue(value, caption, icon, cl);
}

export function isLValue(value) {
    if (!value) return false;
    return value.prototype === _lValueProto || value.isLValue === _lValueProto.isLValue;
}

export function objectToLValues(object) {
    return ObjExt.objectToArray(object, (n, v) => {
        return createLValue(n, v.toString());
    });
}

export function objectToLValuesWithProps(object) {
    return ObjExt.objectToArray(object, (n, v) => {
        const c = v.c || v.toString();
        const i = v.i;
        return createLValueExt(n, c, i);
    });
}

export function lValuesToArray(arr) {
    return arr.map((v) => {
        return getLValue(v);
    });
}

export function objectToLValuesFromResGroup(object) {
    return ObjExt.objectToArray(object, (n, v) => {
        const r = Res.getResGroup(v);
        const c = r.caption || v;
        const i = r.icon;
        return createLValueExt(n, c, i);
    });
}

export function createCachedListOfValues(loader, converter) {
    let _values;
    if (!Types.isMethod(loader))
        Ex.raiseError("Expected loader as method");

    return (record, callback) => {
        if (!Types.isNullOrUndefined(_values))
            return callback ? FnExt.safeCall(record, callback, _values) : _values;

        loader((values) => {
            _values = Types.isMethod(converter) ? converter(values) : values;
            return FnExt.safeCall(record, callback, _values);
        });
    };
}

/**
 * Returns true if value is equal to lValue or value.Id is equal to lValue
 * @param {Sws.lValueKey} value
 * @param {Sws.LValue|*} lValue
 * @returns {boolean}
 */
export function equalLValue(value, lValue) {
    return !Types.isNullOrUndefined(value) && !Types.isNullOrUndefined(lValue) && (value === lValue || lValue.Id === value);
}

export function equalLValues(lValue1, lValue2) {
    return getLValue(lValue1) === getLValue(lValue2);
}

/**
 * Returns value.Id if exists or value
 * @param {Sws.LValue|object} value
 * @returns {Sws.lValueKey}
 */
export function getLValue(value) {
    return !Types.isNullOrUndefined(value) ? (value.hasOwnProperty("Id") ? value.Id : value) : undefined;
}

export function arrayGetLValue(array, value, firstIfEmpty) {
    if (!Types.isArray(array) || !array.length) return null;

    const v = array.find((vv) => equalLValue(value, vv));
    return Types.isNullOrUndefined(v) && firstIfEmpty ? array[0] : v;
}

export function treeGetLValue(value, items) {
    let r;

    function get(ii): boolean {
        return ii.some((p) => {
            if (equalLValue(value, p)) {
                r = p;
                return true;
            }
            return p.getItems ? !!get(p.getItems()) : false;
        });
    }

    get(items);
    return r;
}
