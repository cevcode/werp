/**
 * Enum: Type names without element
 * @enum {string}
 * @readonly
 */
// tslint:disable:variable-name
export const BaseType = {
    array: "array",
    boolean: "boolean",
    date: "date",
    function: "function",
    null: "null",
    number: "number",
    object: "object",
    string: "string",
    undefined: "undefined",
};

/**
 * Enum: Type names with element
 * @enum {string}
 * @readonly
 */
export const Type = {
    array: "array",
    boolean: "boolean",
    date: "date",
    element: "element",
    function: "function",
    null: "null",
    number: "number",
    object: "object",
    string: "string",
    undefined: "undefined",
};

function checkEmptyByType(type, value) {
    switch (type) {
        case BaseType.null:
        case BaseType.undefined:
            return true;
        case BaseType.array:
        case BaseType.string:
            return value.length === 0;
        case BaseType.number:
            return isNaN(value);
        case BaseType.date:
            return isNaN(Number(value));
        case BaseType.object:
            return checkObjEmpty(value);
        default:
            return false;
    }
}

/**
 * @param {*} value
 * @returns {Boolean}
 */
export function isEmpty(value) {
    return checkEmptyByType(getType(value), value);
}

function checkObjEmpty(value) {
    return Object.keys(value).length === 0;
}

export function isEmptyObject(value) {
    if (value === undefined || value === null) return true;
    const t = typeof value;
    if (t !== "object") return true;
    return checkObjEmpty(value);
}

export function isEmptySwsValue(value) {
    return checkEmptyByType(getBaseType(value), value);
}

/**
 *
 * @param value
 * @return {Type}
 */
export function getType(value) {
    const res = getBaseType(value);
    if (res === BaseType.object && value instanceof Element)
        return Type.element;
    return res;
}

/**
 * returns 'null'|'undefined'|'object'|'array'|'date'
 * @param value
 * @return {string}
 */
export function getBaseType(value) {
    if (value === null) return BaseType.null;
    if (value === undefined) return BaseType.undefined;

    const t = typeof value;
    if (t !== "object")
        return t;

    if (value instanceof Array) return BaseType.array;
    if (value instanceof Date) return BaseType.date;

    return BaseType.object;
}

export function isString(value) {
    return typeof value === "string";
}

export function isNumber(value) {
    return typeof value === "number";
}

export function isInt(value) {
    return typeof value === "number" && (value % 1 === 0);
}

export function isNumberString(value) {
    // tslint:disable-next-line:triple-equals
    return value !== null && value !== undefined && value == parseFloat(value);
}

export function isIntString(value) {
    // tslint:disable-next-line:triple-equals
    return value !== null && value !== undefined && value == parseInt(value);
}

export function getStringParts(value, splitter) {
    if (typeof value !== "string" || !value.length) return undefined;
    const i = value.indexOf(splitter);
    if (i === -1)
        return { f: value, s: undefined };
    return { f: value.substring(0, i), s: value.substring(i + 1) };
}

export function notEmpty(value) {
    return !isEmpty(value);
}

export function notEmptySwsValue(value) {
    return !isEmptySwsValue(value);
}

export function isNullOrUndefined(value) {
    return value === undefined || value === null;
}

export function getBoolDefaultTrue(value) {
    return value === undefined ? true : !!value;
}

export function getBoolDefaultFalse(value) {
    return value === undefined ? false : !!value;
}

export function nvl(value, defValue) {
    return isNullOrUndefined(value) ? defValue : value;
}

export function getMappedOrValue(value, mapping) {
    if (isEmpty(mapping) || isEmpty(value) || !mapping.hasOwnProperty(value))
        return value;
    return mapping[value];
}

export function isType(item, type) {
    return isEmpty(item) || typeof type !== "function" ? false : (item instanceof type);
}

export function isMethod(method) {
    return typeof method === "function";
}

export function getVBetweenOrDef(value, min, max, def) {
    return !isEmpty(value) && value >= min && value <= max ? value : def;
}

const _arrayMap = [].map;

/**
 * Checks whether object is array
 * @param obj
 * @returns {boolean}
 */
export function isArray(obj) {
    return obj && (obj.map === _arrayMap);
}
