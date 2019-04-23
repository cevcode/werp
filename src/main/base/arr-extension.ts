import * as C from "./console";
import * as Ex from "./exceptions";
import * as Fmt from "./formatting";
import * as Types from "./types-utils";
import * as ObjExt from "./obj-extension";

type ArrayIterator = (i: number, item: any) => any;

export function arrayFirst(array: any[], fn: ArrayIterator, scope?: object): any | null {
    if (!array) return null;
    const len = array.length;
    for (let i = 0; i < len; i++) {
        const item = array[i];
        if (fn.call(scope, i, item)) return item;
    }
    return null;
}

export function arrayFirstOrDefault(array: any[], defValue: any): any {
    if (!array || array.length <= 0) return;
    const v = array[0];
    return Types.isNullOrUndefined(v) ? defValue : v;
}

/**
 * Finds index of first element where fn returns true, or null if not found
 * @param array
 * @param fn
 * @returns {Number|null}
 */
export function arrayFirstIdx(array: any[], fn: ArrayIterator) {
    if (!array || !fn) return null; // if array or function empty return not found

    const len = array.length;
    for (let i = 0; i < len; i++) {
        const item = array[i];
        if (fn(i, item)) return i;
    }
    return null;
}

export function arrayAdd(destination: any[], source: any[], fn?: ArrayIterator, addNulls?): any[] {
    const res = destination || [];
    source.map((value, i) => {
        const r = fn ? fn(i, value) : value;
        if (addNulls || !Types.isNullOrUndefined(r))
            res.push(r);
    });
    return res;
}

export function arrayAddIfNotExist(array: any[], item): boolean {
    const i = array.indexOf(item);
    if (i === -1) {
        array.push(item);
        return true;
    }
    return false;
}

export function arrayRemove(array: any[], item: any): boolean {
    const i = array.indexOf(item);
    if (i === -1) return false;
    array.splice(i, 1);
    return true;
}

export function arrayAsStrings(array, fmt?, splitter = "\n"): string {
    if (Types.isEmpty(array)) return null;
    if (!Types.isArray(array))
        return fmt ? Fmt.format(fmt, array) : array;

    let s1 = "";
    array.forEach((value) => {
        if (s1 !== "") s1 = s1 + splitter;
        s1 += fmt ? Fmt.format(fmt, value) : value;
    });
    return s1;
}

export function arrayAsComaSep(arr, fmt?) {
    return arrayAsStrings(arr, fmt, ", ");
}

/**
 * returns true if for any of array items fn returns true
 * @param {Array} array
 * @param {Function} fn
 * @param {Object} [scope]
 * @param {boolean} [catchErrors]
 * @returns {boolean}
 */
export function arrayAny(array: any[], fn: ArrayIterator, scope?: object, catchErrors?: boolean): boolean {
    if (!array || !fn) return false; // if array or function empty return not found

    const len = array.length;
    for (let i = 0; i < len; i++) {
        const item = array[i];
        try {
            const res = scope ? fn.call(scope, i, item) : fn(i, item);
            if (res) return true;
        } catch (e) {
            C.error(e);
            if (!catchErrors) throw e;
        }
    }
    return false;
}

/**
 * execute one function for
 * @param {Array|HTMLCollection} array
 * @param {Function} fn
 * @param {Object} [scope] - optional will be available as this in callback
 * @param {boolean} [catchErrors]
 */
export function arrayEach(array: any[], fn: ArrayIterator, scope?: object, catchErrors?: boolean) {
    if (!array || array.length <= 0) return;

    const len = array.length;
    for (let i = 0; i < len; i++) {
        const item = array[i];
        if (!catchErrors) {
            if (!scope)
                fn(i, item);
            else
                fn.call(scope, i, item);
        } else {
            try {
                if (!scope)
                    fn(i, item);
                else
                    fn.call(scope, i, item);
            } catch (e) {
                C.error(e);
                if (!catchErrors) throw e;
            }
        }
    }
}

export function areArraysEqual(first, second) {
    const emptyF = Types.isNullOrUndefined(first);
    const emptyS = Types.isNullOrUndefined(second);
    if (emptyF && emptyS || first === second) return true;
    if (emptyF && !emptyS || !emptyF && emptyS || first.length !== second.length)
        return false;

    const len = first.length;
    for (let i = 0; i < len; i++) {
        const v1 = first[i];
        const v2 = second[i];
        if (v1 === v2)
            continue;

        if (!ObjExt.areObjectPropsEqual(v1, v2))
            return false;
    }
    return true;
}

/**
 * @param {Array} array
 * @param {function(object, int, object)} fn
 * @returns {Object|undefined}
 */
export function arrayToObject(array: any[], fn): object {
    if (Types.isNullOrUndefined(array)) return;
    Ex.raiseErrorIf(!Types.isMethod(fn), "Expected proper iterator method");

    const res = {};
    const len = array.length;
    for (let i = 0; i < len; i++) {
        const item = array[i];
        fn(res, i, item);
    }
    return res;
}

export function arrayDelete(array: any[], fn: ArrayIterator) {
    if (!array || !fn) return null; // if array or function empty return not found

    const len = array.length;
    for (let i = len - 1; i >= 0; i--) {
        const item = array[i];
        if (fn(i, item))
            array.splice(i, 1);
    }
    return array;
}

export function arrayMoveValueToStart(array: any[], value, maxLen?, fn?: ArrayIterator) {
    if (!array) return [value];
    if (!fn)
        fn = (i, item) => {
            return item === value;
        };
    arrayDelete(array, fn);
    array.unshift(value);
    if (maxLen)
        array.splice(maxLen);
    return array;
}

// /**
//  * @param {Array} array
//  * @param {Number} start
//  * @param {Number} end
//  * @returns {Number|null}
//  */
// export function arrayFindFirstGap(array: any[], start: number, end: number): number {
//     if (!array) return null;
//     for (let i = start || 0; i < end; i++) {
//         if (!array[i]) {
//             return i;
//         }
//     }
//     return null;
// }

// /**
//  * @param {Array} array
//  * @param {Number} start
//  * @param {Number} end
//  * @returns {Number|null}
//  */
// export function arrayFindLastGap(array: any[], start: number, end: number): number {
//     if (!array) return null;

//     for (let i = end || array.length; i > start || 0; i--) {
//         if (!array[i]) {
//             return i;
//         }
//     }
//     return null;
// }

// /**
//  * @param {String|Number} value
//  * @param {Array} array
//  * @param {Boolean} [strictEq]
//  * @returns {Boolean}
//  */
// export function inArray(value, array: any[], strictEq): boolean {
//     strictEq = !!strictEq;
//     for (const item in array) {
//         // tslint:disable-next-line:triple-equals
//         if (strictEq && item === value || !strictEq && item == value)
//             return true;
//     }
//     return false;
// }

// export function arrayGetUniqNamed(array: any[]): any[] {
//     const strs = {};

//     return arrayCopy(array, (i, item) => {
//         if (isNullOrUndefined(item)) return;

//         const s = item.toString();
//         if (strs.hasOwnProperty(s)) return;
//         strs[s] = true;
//         return item;
//     });
// }

// export let arrEachFast;

// if (Array.prototype.forEach) {
//     // tslint:disable-next-line:only-arrow-functions
//     arrEachFast = function (array, fn) {
//         if (!array || !fn) return;
//         if (array.forEach)
//             array.forEach(fn);
//         else
//             Array.prototype.forEach.call(array, fn);
//     };
// } else {
//     // tslint:disable-next-line:only-arrow-functions
//     arrEachFast = function (array, fn) {
//         if (!array || !fn) return;
//         const len = array.length;
//         if (!(len > 0)) return; // jshint ignore:line

//         for (let i = 0; i < len; i++) {
//             const item = array[i];
//             const r = fn(item, i, array);
//         }
//     };
// }


// export let arrCopyFast;

// if (Array.prototype.map) {
//     // tslint:disable-next-line:only-arrow-functions
//     arrCopyFast = function (array, fn): any[] {
//         if (isNullOrUndefined(array)) return;
//         if (array.map)
//             return array.map(fn);
//         else
//             return Array.prototype.map(array, fn);
//     };
// } else {
//     // tslint:disable-next-line:only-arrow-functions
//     arrCopyFast = function (array, fn) {
//         const len = array ? array.length : 0;
//         if (!(len > 0)) return []; // jshint ignore:line

//         const res = [];
//         for (let i = 0; i < len; i++) {
//             const item = array[i];
//             const r = fn ? fn(item, i, array) : item;
//             res.push(r);
//         }
//         return res;
//     };
// }

// export function arrayEachReverse(array: any[], fn: ArrayIterator, scope?, catchErrors?): void {
//     if (!array || array.length <= 0) return;

//     const len = array.length;
//     for (let i = len - 1; i >= 0; i--) {
//         const item = array[i];
//         if (!catchErrors) {
//             if (!scope)
//                 fn(i, item);
//             else
//                 fn.call(scope, i, item);
//         } else {
//             try {
//                 if (!scope)
//                     fn(i, item);
//                 else
//                     fn.call(scope, i, item);
//             } catch (e) {
//                 Sws.C.error(e);
//                 if (!catchErrors) throw e;
//             }
//         }
//     }
// }

// export function arrayEachReverseSimple(array: any[], fn: ArrayIterator, breakOnNonEmpty) {
//     if (!array || array.length <= 0) return;
//     const len = array.length;
//     for (let i = len - 1; i >= 0; i--) {
//         const item = array[i];
//         const r = fn(i, item);
//         if (breakOnNonEmpty && r)
//             return r;
//     }
// }

// export function arrayEachReverseOrSingle(array: any[], fn: ArrayIterator, breakOnNonEmpty) {
//     if (isNullOrUndefined(array) || !fn) return;
//     if (!isArray(array))
//         return fn(0, array);

//     return arrayEachReverseSimple(array, fn, breakOnNonEmpty);
// }

// export function arrayCopy(array: any[], fn?: ArrayIterator): any[] {
//     const len = array ? array.length : 0;
//     if (!(len > 0)) return []; // jshint ignore:line

//     const res = [];
//     for (let i = 0; i < len; i++) {
//         const item = array[i];
//         const r = fn ? fn(i, item) : item;
//         if (!isNullOrUndefined(r))
//             res.push(r);
//     }
//     return res;
// }

// export function arrayMerge(array1: any[], array2: any[]): any[] {
//     const len1 = array1 ? array1.length : undefined;
//     const len2 = array2 ? array2.length : undefined;

//     if (!len2)
//         return !len1 ? [] : array1.slice();

//     const res = array1.slice();
//     for (let i = 0; i < len2; i++) {
//         const v = array2[i];
//         if (res.indexOf(v) === -1) res.push(v);
//     }
//     return res;
// }

// export function arrayJoin(array: any[], fn?: ArrayIterator): any[] {
//     const res = [];
//     arrayEachSimple(array, (i, value) => {
//         const r = fn ? fn(i, value) : value;
//         if (isNullOrUndefined(r))
//             return;
//         if (isArray(r))
//             arrayAdd(res, r);
//         else
//             res.push(r);
//     });
//     return res;
// }

// export function arrayCount(array: any[], fn?: ArrayIterator): number {
//     if (!array || !array.length)
//         return 0;

//     let cnt = 0;
//     const len = array.length;
//     for (let i = 0; i < len; i++) {
//         const value = array[i];
//         const r = fn ? fn(i, value) : value;
//         if (r)
//             cnt++;
//     }
//     return cnt;
// }

// export function arrayEachSimple(array: any[], fn: ArrayIterator, breakOnNonEmpty?: boolean): void {
//     if (!array || !fn) return;
//     const len = array.length;
//     if (!(len > 0)) return; // jshint ignore:line

//     for (let i = 0; i < len; i++) {
//         const item = array[i];
//         const r = fn(i, item);
//         if (breakOnNonEmpty && r)
//             return r;
//     }
// }

// function checkEmptyItem(item): boolean {
//     return item != null;
// }

// export function arrCopyFastNotEmpty(array: any[], fn): any[] {
//     const r = arrCopyFast(array, fn);
//     if (!r) return r;
//     return r.filter(checkEmptyItem);
// }

// export function arrayEachOrSingle(array: any[], fn: ArrayIterator, breakOnNonEmpty?: boolean) {
//     if (isNullOrUndefined(array) || !fn) return;
//     if (!isArray(array))
//         return fn(0, array);

//     const len = array.length;
//     for (let i = 0; i < len; i++) {
//         const item = array[i];
//         const r = fn(i, item);
//         if (breakOnNonEmpty && r)
//             return r;
//     }
// }

// export function arraySerialize(items: any[]): any[] {
//     return arrayCopy(items, (i, item) => {
//         return safeCall(item, item.serialize);
//     });
// }

// export function getFlatArray(...params): any[] {
//     const array = [];
//     for (const item of params) {
//         if (isNullOrUndefined(item))
//             continue;

//         if (isArray(item)) {
//             for (const ii of item) {
//                 if (!isNullOrUndefined(ii))
//                     array.push(ii);
//             }
//         } else
//             array.push(item);
//     }
//     return array;
// }

// export function arrayAddNotEmpty(array?: any[], ...params): any[] {
//     if (!array) array = [];
//     const len = params.length;
//     for (let i = 0; i < len; i++) {
//         const item = params[i];
//         if (!isNullOrUndefined(item))
//             array.push(item);
//     }
//     return array;
// }

// export function arrayAddIf(array?: any[], ...params): any[] {
//     if (!array)
//         array = [];
//     const len = params.length;
//     for (let i = 0; i < len; i += 2) {
//         const cond = params[i];
//         if (!cond) continue;
//         const item = params[i + 1];
//         if (!isNullOrUndefined(item))
//             array.push(item);
//     }
//     return array;
// }

// /**
//  * @param {Function} constructor
//  * @param {Array} array
//  * @params {Array|Object}
//  * @returns {Array}
//  */
// export function arrayDeserialize(constructor, array: any[], ...params): any[] {
//     if (!params.length)
//         return arrayCopy(array, (i, item) => {
//             return constructor(item);
//         });

//     return arrayCopy(array, (i, item) => {
//         // params[0] = item;
//         return constructor(item, ...params);
//         // return constructor.apply(this, params);
//     });
// }

// export function arrayGetSafeIndex(array: any[], index): number | null {
//     raiseErrorIf(!isArray(array), "array expected :" + array);
//     if (array.length === 0) return null;

//     if (index < 0) index = 0;
//     else if (index >= array.length) index = array.length - 1;
//     return index;
// }

// /**
//  * Remove value from array
//  * @param {Array} aValues
//  * @param strValue
//  * @returns {Array} - array without removed item
//  */
// export function removeByValue(aValues: any[], strValue): any[] {
//     const idx = aValues.indexOf(strValue);
//     if (idx >= 0)
//         aValues.splice(idx, 1);

//     return aValues;
// }

// export function arrayFindStr(array: any[], str: string): any | undefined {
//     if (!array || typeof str !== "string")
//         return undefined;
//     const len = array.length;
//     for (let i = 0; i < len; i++) {
//         const item = array[i];
//         // tslint:disable-next-line:triple-equals
//         if (item != undefined && item.toString() === str)
//             return item;
//     }
// }

// export function arrayFindStrIdx(array: any[], str: string): number | undefined {
//     if (!array || typeof str !== "string")
//         return undefined;
//     const len = array.length;
//     for (let i = 0; i < len; i++) {
//         const item = array[i];
//         // tslint:disable-next-line:triple-equals
//         if (item != undefined && item.toString() === str)
//             return i;
//     }
// }

// /**
//  * returns true if for any of array items fn returns true
//  * @param {Array} array
//  * @param {Function} fn
//  * @returns {boolean}
//  */
// export function arrayAnySimple(array: any[], fn: ArrayIterator): boolean {
//     if (!array || !fn) return false; // if array or function empty return not found

//     const len = array.length;
//     for (let i = 0; i < len; i++) {
//         const item = array[i];
//         const res = fn(i, item);
//         if (res) return true;
//     }
//     return false;
// }

export function arrayContains(array: any[], value: any): boolean {
    if (value == null) return false;
    return arrayAny(array, (i, v) => {
        return v === value;
    });
}

// export function arrayContainsSimple(array: any[], value: any): boolean {
//     if (isNullOrUndefined(value)) return false;
//     return array.indexOf(value) > -1;
// }

// export function arrayContainsAny(array, v1, v2, v3, v4, v5, v6): boolean {
//     if (!array) return false;
//     const len = array.length;
//     if (!len) return false;
//     const l = arguments.length - 1;
//     if (l < 1) return false;

//     for (let i = 0; i < len; i++) {
//         const v = array[i];
//         if (v1 !== undefined && v === v1 ||
//             v2 !== undefined && v === v2 ||
//             v3 !== undefined && v === v3 ||
//             v4 !== undefined && v === v4 ||
//             v5 !== undefined && v === v5 ||
//             v6 !== undefined && v === v6)
//             return true;
//     }
//     return false;
// }

// export function areArraysLengthEqual(first, second) {
//     return first && second && first.length === second.length;
// }

// export function arrayToStringByMethod(array, methodName, splitter = ", "): string {
//     let res;
//     arrEachFast(array, (item) => {
//         const vv = methodName ? callByName(item, methodName) : item;
//         res = res === undefined ? vv : res + splitter + vv;
//     });
//     return res;
// }

// export function stringArrayAsObject(array: any[], fn) {
//     const res = {};
//     const len = (array ? array.length : 0) || 0;

//     if (len === 0) return res;
//     for (let i = 0; i < len; i++) {
//         const v = array[i];
//         if (!v) continue;
//         const vv = fn ? fn(v) : true;
//         res[v] = vv;
//     }
//     return res;
// }
