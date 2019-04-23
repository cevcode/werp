import * as Ex from "./exceptions";
import * as ObjExt from "./obj-extension";
import * as Types from "./types-utils";

import { DEF, R } from "./resources";

export const _res = {
    Empty: DEF("Format.Empty", "<empty>"),
    NoParameter: DEF("Format.NoParameter", "<no parameter #{0}>"),
};

const _formaters = [];

export function pad(r, len) {
    let rr = r.toString();
    if (len > 0)
        while (rr.length < len)
            rr = " " + rr;
    else if (len < 0)
        while (rr.length < -len)
            rr = rr + " ";
    return rr;
}

export function lPad0(val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) val = "0" + val;
    return val.substr(0, len);
}

function internalFormat(fmt, v) {
    const l = _formaters.length;
    for (let i = 0; i < l; i++) {
        const elem = _formaters[i];
        if (fmt.search(elem.regex) !== -1)
            return elem.handler(fmt, v);
    }
    return v.toString();
}

function asString(obj) {
    return obj.toString === {}.toString ? "{" + ObjExt.objectAsString(obj) + "}" : obj.toString();
}

function _format(skipEmpty, mask, ...rest) {
    if (typeof mask !== "string" || mask.length < 2) return mask;
    let dd;
    let len;
    let text;
    let v;
    const last = rest.length;
    let pos = 0;
    let r = "";
    let nextOpen = -1;
    while (true) {
        const start = nextOpen === -1 ? mask.indexOf("{", pos) : nextOpen;
        if (start === -1)
            return r + mask.substring(pos);

        const e = mask.indexOf("}", start + 1);
        nextOpen = mask.indexOf("{", start + 1);
        if (nextOpen > -1 && nextOpen < e) {
            r += mask.substring(pos, nextOpen - 1);
            pos = nextOpen - 1;
            continue;
        }
        if (e === -1) {
            r += mask.substring(pos, start + 1);
            pos = start + 1;
            continue;
        }
        const end = e + 1;
        const inner = mask.substring(start + 1, e);
        const idx = parseInt(inner);
        if (idx >= last) {
            text = R(_res.NoParameter).replace("{0}", idx.toString());
        } else {
            v = rest[idx];
            if (Types.isNullOrUndefined(v)) {
                text = skipEmpty ? "" : R(_res.Empty);
            } else {
                const lPos = inner.indexOf(",");
                if (lPos > -1) {
                    len = parseInt(inner.substring(lPos + 1));
                    dd = inner.indexOf(":", lPos);
                    text = pad(dd !== -1 ? internalFormat(inner.substring(dd + 1), v) : asString(v), len);
                } else {
                    dd = inner.indexOf(":");
                    text = dd !== -1 ? internalFormat(inner.substring(dd + 1), v) : asString(v);
                }
            }
        }
        r += mask.substring(pos, start) + text;
        pos = end;
    }
}

export function registerFormatter(regex, handler, type) {
    Ex.raiseErrorIf(!regex && !type || !handler, "Regex and handler required for registering");
    _formaters.push({ regex, handler, type });
}

const _rMask = /{(\d+)(,(-?\d*))?((:([^}]*)))?}/g; /// {(\d+)(,(-?\d*))?((:((\w?(\d*)))))?}/g
const _rMask2 = /,-?\d+/;
const _rMask3 = /:[^}]*/;

function formatOld(mask) {
    if (typeof mask !== "string" || mask.length < 2) return mask;
    const a = arguments;
    const last = a.length;
    return mask.replace(_rMask, (match, name) => {
        const i = parseInt(name);
        if (i >= last)
            return R(_res.NoParameter).replace("{0}", i.toString());
        const v = a[i + 1];
        const l = match.match(_rMask2);
        const len = l !== null ? parseInt(l[0].substring(1)) : undefined;
        const f = match.match(_rMask3);
        const fmt = f !== null ? f[0].substring(1) : undefined;

        const r = Types.isNullOrUndefined(v) ? R(_res.Empty) : fmt ? internalFormat(fmt, v) : asString(v);

        return !Types.isNullOrUndefined(len) ? pad(r, len) : r;
    });
}

export function format(mask, ...rest: any[]): string {
    return _format(false, mask, ...rest);
}

export function formatSkipEmpty(mask, ...rest: any[]) {
    return _format(true, mask, ...rest);
}

export function formatR(resName, ...rest: any[]): string {
    const format = R(resName);
    return _format(false, format, ...rest);
}

