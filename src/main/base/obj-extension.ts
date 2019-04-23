import * as C from "./console";
import * as ObjHash from "./obj-hash";
import * as Types from "./types-utils";

/**
 * @param {Object} object
 * @param {Function} fn
 */
export function objectEachSimple(object, fn) {
    if (object === null || object === undefined) return;
    let cnt = 0;
    for (const i in object) { // jshint ignore:line
        if (!object.hasOwnProperty(i)) continue;
        fn(i, object[i], cnt);
        cnt++;
    }
}

/**
 * @param {Object} object
 * @param {Function} fn
 * @param {Object} [scope] - will be used as this in call, if omitted will use object
 * @param {boolean} [catchErrors] if true exceptions will be internally processed and not
 */
export function each(object, fn, scope?, catchErrors?) {
    /* jshint ignore:start */
    if (object === null || object === undefined) return;

    let count = 0;
    scope = scope || object;
    for (const i in object) {
        if (!object.hasOwnProperty(i)) continue;
        try {
            fn.call(scope, i, object[i], count);
        } catch (e) {
            C.error(e);
            if (!catchErrors) throw e;
        }
        count++;
    }
    /* jshint ignore:end */
}

export let objectEach = each;

/**
 * @param {Object} object
 * @param {function} fn
 * @param {Object} [scope]
 * @return {boolean}
 */
export function objectAny(object, fn, scope?) {
    let count = 0;
    scope = scope || object;
    for (const i in object) {
        if (!object.hasOwnProperty(i)) continue;
        if (fn.call(scope, i, object[i], count)) return true;
        count++;
    }
    return false;
}

/**
 * @param {Object} object
 * @param {function} fn
 * @param {Object} [scope]
 * @return {null|int}
 */
export function objectFirst(object, fn, scope?) {
    let count = 0;
    scope = scope || object;
    for (const i in object) {
        if (!object.hasOwnProperty(i)) continue;
        if (fn.call(scope, i, object[i], count)) return i;
        count++;
    }
    return null;
}

export function objectClone(obj) {
    const target = {};
    for (const v in obj) {
        if (obj.hasOwnProperty(v))
            target[v] = obj[v];
    }

    return target;
}

export function objectCopy(obj, fn?) {
    if (!fn) return objectClone(obj);

    const res = {};
    objectEachSimple(obj, (i, value) => {
        const r = fn(i, value);
        if (!Types.isNullOrUndefined(r))
            res[i] = r;
    });
    return res;
}

export function objectToArray(obj: object, fn?): any[] {
    if (!fn) return objectToArraySimple(obj);

    const res = [];
    objectEachSimple(obj, (i, value) => {
        const r = fn(i, value);
        if (!Types.isNullOrUndefined(r))
            res.push(r);
    });
    return res;
}

export function objectToArraySimple(obj: object): any[] {
    const res = [];
    each(obj, (i, value) => {
        if (!Types.isNullOrUndefined(value))
            res.push(value);
    });
    return res;
}

export function objectAsString(obj, splitter?, equalSign?, noProps?) {
    if (Types.isNullOrUndefined(splitter))
        splitter = "&";
    if (Types.isNullOrUndefined(equalSign))
        equalSign = "=";
    let s = "";
    noProps = !!noProps;
    if (Types.isArray(obj)) {
        obj.forEach((value) => {
            if (s !== "") s = s + splitter;
            s += value;
        });
        s = "[" + s + "]";
    } else {
        objectEachSimple(obj, (cd, value) => {
            if (s !== "") s = s + splitter;
            s += noProps ? value : cd + equalSign + value;
        });
    }

    return s;
}

export function checkPrototype(object, proto) {
    return object && object.__proto__ === proto; // jshint ignore: line
}

function toLowerCase(cd, value: string): string {
    return value.toLowerCase();
}

export function propsToLowerCase(obj) {
    return each(obj, toLowerCase);
}

export function objectAddProps(obj, source, skipExisting?) {
    if (Types.isEmptySwsValue(source)) return obj;
    if (Types.isNullOrUndefined(obj))
        obj = {};

    objectEachSimple(source, (cd, value) => {
        if (Types.isNullOrUndefined(value)) return;
        if (skipExisting && !Types.isNullOrUndefined(obj[cd])) return;
        obj[cd] = value;
    });
    return obj;
}

function shouldNotCompareProp(prop, value) {
    return prop === "prototype" || prop === "__proto__" || Types.isMethod(value);
}

export function areObjectPropsEqual(first: object, second: object, fn?): boolean {
    if (first === second)
        return true;

    const fEmpty = Types.isNullOrUndefined(first);
    const sEmpty = Types.isNullOrUndefined(second);
    if (fEmpty && sEmpty) return true; // both empty
    if (fEmpty && !sEmpty || sEmpty && !fEmpty) return false;
    if (typeof first !== "object")
        return first === second;

    if (Types.isNullOrUndefined(fn)) {
        const f = ObjHash.getHash(first, true); // we will use objectHash for properly compare props with html elements
        const s = ObjHash.getHash(second, true);
        return f === s;
    }

    let idx = objectFirst(first, (prop, value) => {
        if (!shouldNotCompareProp(prop, value)) return;

        return !fn(second[prop], value, fn);
    });
    if (idx !== null) return false;

    idx = objectFirst(second, (prop, value) => {
        if (!shouldNotCompareProp(prop, value)) return;

        return !fn(first[prop], value);
    });
    return idx === null;
}

export function getNewProps(oldObject: object, newObject: object): object {
    if (oldObject == null) return newObject;
    if (newObject == null) return newObject;

    let res;
    for (const propName in newObject) {
        if (!newObject.hasOwnProperty(propName)) continue;

        const oldV = oldObject[propName];
        const newV = newObject[propName];
        if (oldObject.hasOwnProperty(propName) && oldV === newV) continue;
        if (res === undefined)
            res = {};
        res[propName] = newV;
    }
    return res;
}

export function setStateInternal(obj, newState) {
    const dif = getNewProps(obj.state, newState);
    if (dif == null) return;
    obj.setState(dif);
}

// object binding

// export class BaseObject {
//     public bound(name) {
//         return getBoundFunc(this, name);
//     }
// }

// export function setPrototype(object, prototype) {
//     object.__proto__ = prototype; // jshint ignore: line
// }

// export function areProtoEqual(first, second) {
//     return first && second && first.__proto__ === second.__proto__; // jshint ignore: line
// }

// function setProtoInternal(baseProto, proto) {
//     setPrototype(proto, baseProto);
//     proto.base = function(methodName, p1, p2, p3, p4, p5, p6, p7) {
//         const baseMethod = baseProto[methodName];
//         if (!isMethod(baseMethod)) return undefined;
//         return baseMethod.call(this, p1, p2, p3, p4, p5, p6, p7);
//     };
//     return proto;
// }

// export function protoExtend(baseProto, proto) {
//     return setProtoInternal(baseProto.prototype, proto);
// }

// export function protoExtend2() {
//     const last = arguments.length;
//     const proto = arguments[last - 1];
//     if (proto === undefined || last === 1)
//         return proto;

//     let baseProto;
//     if (last === 2)
//         baseProto = arguments[0].prototype;
//     else {
//         baseProto = {};
//         for (let i = 0; i < last - 1; i++) {
//             const base = arguments[i];
//             objectAddProps(baseProto, base.prototype, true);
//         }
//     }
//     return setProtoInternal(baseProto, proto);
// }

// export function typedClone(source, constructor) {
//     const target = constructor ? new constructor() : {};
//     for (const v in source) {
//         if (!source.hasOwnProperty(v)) continue;

//         let srcV = source[v];
//         if (getBaseType(srcV) === "array")
//             srcV = srcV.slice();
//         target[v] = srcV;
//     }

//     return target;
// }

// export function objectKeyCount(object) {
//     return Object.keys(object).length;
// }

// export function childrenEach(element, fn, scope, catchErrors) {
//     if (!element) return;

//     try {
//         if (!scope)
//             fn(element);
//         else
//             fn.call(scope, element);

//         arrayEach(element.children, (i, item) => {
//             childrenEach(item, fn, scope, catchErrors);
//         }, scope);
//     } catch (e) {
//         Sws.C.error(e);
//         if (!catchErrors) throw e;
//     }
// }

// export function childrenOnlyEach(element, fn, scope, catchErrors) {
//     if (!element) return;

//     try {
//         arrayEach(element.children, (i, item) => {
//             childrenEach(item, fn, scope, catchErrors);
//         }, scope);
//     } catch (e) {
//         Sws.C.error(e);
//         if (!catchErrors) throw e;
//     }
// }

// export function areObjectsEqual(first, second, strictEq) {
//     if (!first && !second) return true; // both empty
//     if (!first && second || !second && first) return false;
//     return strictEq ? first === second : first.toString() === second.toString();
// }

// export function getDifPropNames(object1, object2) {
//     const res = [];
//     let p;
//     if (!isNullOrUndefined(object1)) {
//         for (p in object1) {
//             if (!object1.hasOwnProperty(p)) continue;

//             if (isNullOrUndefined(object2) || !object2.hasOwnProperty(p) || object1[p] !== object2[p])
//                 res.push(p);
//         }
//     }
//     if (!isNullOrUndefined(object2)) {
//         for (p in object2) {
//             if (!object2.hasOwnProperty(p)) continue;

//             if (isNullOrUndefined(object1) || !object1.hasOwnProperty(p))
//                 res.push(p);
//         }
//     }
//     return res;
// }

// export function getFirstPropName(obj) {
//     if (!obj) return undefined;
//     const keys = Object.keys(obj);
//     return keys.length > 0 ? keys[0] : undefined;
// }

// export function getOriginUrl() {
//     return window.location.origin ||
//         (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : ""));
// }

// export function getHashUrl(hash) {
//     return getOriginUrl() + window.location.pathname + window.location.search + "#" + hash;
// }

// export function getFullUrl(hash) {
//     return getOriginUrl() + window.location.pathname + window.location.search + hash;
// }

// export function getPageUrl(page) {
//     return getOriginUrl() + "/" + page;
// }

// export function initObject(...params) {
//     const res = {};
//     const l = arguments.length;
//     for (let i = 0; i < l; i = i + 2) {
//         const n = arguments[i];
//         if (!isNullOrUndefined(n))
//             res[n] = arguments[i + 1];
//     }
//     return res;
// }

// export function initObjectNonEmpty(...params) {
//     const res = {};
//     const l = arguments.length;
//     for (let i = 0; i < l; i = i + 2) {
//         const n = arguments[i];
//         if (isNullOrUndefined(n)) continue;
//         const v = arguments[i + 1];
//         if (!isNullOrUndefined(v))
//             res[n] = v;
//     }
//     return res;
// }

// export function addToObject(obj, ...props) {
//     const res = isNullOrUndefined(obj) ? {} : obj;
//     for (let i = 0; i < props.length; i = i + 2) {
//         const n = props[i];
//         if (!isNullOrUndefined(n))
//             res[n] = props[i + 1];
//     }
//     return res;
// }

// export function addToArray(array, item) {
//     if (isNullOrUndefined(array))
//         return [item];
//     array.push(item);
//     return array;
// }

// export function addToObjectWithRemove(obj) {
//     const res = isEmpty(obj) ? {} : objectCopy(obj);
//     let n;
//     let v;
//     const l = arguments.length;
//     for (let i = 1; i < l; i = i + 2) {
//         n = arguments[i];
//         if (isNullOrUndefined(n)) continue;
//         v = arguments[i + 1];
//         if (v !== undefined)
//             res[n] = v;
//         else {
//             if (res.hasOwnProperty(n))
//                 delete res[n];
//         }
//     }
//     return res;
// }

// export function addProxyMethodsToProto(dest, propName, ...restOfName: string[]) {
//     raiseErrorIf(!dest, "Dest is required");
//     const len = arguments.length;
//     if (typeof dest === "function")
//         dest = dest.prototype;
//     for (let i = 2; i < len; i++) {
//         const met = arguments[i];
//         // tslint:disable-next-line:only-arrow-functions
//         (function (method) {
//             dest[method] = function (p1, p2, p3, p4, p5) {
//                 const p = this[propName];
//                 if (isNullOrUndefined(p)) return undefined;
//                 const m = p[method];
//                 return isMethod(m) ? p[method](p1, p2, p3, p4, p5) : undefined;
//             };
//         }(met));
//     }
// }

// export function addProxyMethod(dest, sync, propName, m1, m2, m3, m4) {
//     raiseErrorIf(!dest, "Dest is required");
//     raiseErrorIf(!sync, "Sync is required");
//     const len = arguments.length;

//     for (let i = 3; i < len; i++) {
//         const met = arguments[i];
//         // tslint:disable-next-line:only-arrow-functions
//         (function (method) {
//             // tslint:disable-next-line:only-arrow-functions
//             dest[method] = function (p1, p2, p3, p4, p5) {
//                 const p = sync[propName];
//                 if (isNullOrUndefined(p)) return undefined;
//                 const m = p[method];
//                 return isMethod(m) ? p[method](p1, p2, p3, p4, p5) : undefined;
//             };
//         }(met));
//     }
// }

// export function extend(base, obj) {
//     // we skip existing in obj- this mean that method is overridden in obj
//     return objectAddProps(obj, base.prototype, true);
// }

// export function sameProto(first, second) {
//     if (!first && !second) return true;
//     if (!first && second || !second && first) return false;
//     return first.__proto__ === second.__proto__; // jshint ignore: line
// }
