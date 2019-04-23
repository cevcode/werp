import * as Types from "./types-utils";

declare global {
    // tslint:disable-next-line:interface-name
    interface String {
        contains(value: string): boolean;
    }
}

String.prototype.contains = function(value) {
    return this.indexOf(value) > -1;
};

const _emptyExp = /^\s+$/;

export function isEmptyOrWhiteSpace(s) {
    return s === null || s === undefined || s === "" || _emptyExp.test(s);
}

export function emptyOrNotString(str) {
    return typeof str !== "string" || str.length < 1;
}

export function isNotEmpty(str) {
    return typeof str === "string" && str.length > 0;
}

export function getNotEmptyLowerCase(value) {
    if (emptyOrNotString(value))
        return undefined;
    return value.toLowerCase();
}

export function getQuotedString(caption) {
    return "'" + caption + "'";
}

export function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), replace);
}

export function endWith(str, value) {
    if (!isNotEmpty(str) || !isNotEmpty(value)) return false;
    const p = str.slice(-value.length);
    return p === value;
}

export function startWith(str, value) {
    if (!isNotEmpty(str) || !isNotEmpty(value)) return false;
    const p = str.substring(0, value.length);
    return p === value;
}

export function isParameter(value) {
    return value && Types.isString(value) && (startWith(value, "@") || startWith(value, "&"));
}

export function isRefColumn(value) {
    return value && Types.isString(value) && (startWith(value, "{") && endWith(value, "}"));
}

export function simplifyHtml(htmlStr) {
    const str = htmlStr
        .replace(/<img[^>]*>/ig, "img-placeholder")
        .replace(/<\/?[a-z][a-z0-9]*[^<>]*>/ig, "")
        .replace(/img-placeholder/ig, '<span class="html-placeholder image"></span>');
    const re = new RegExp("&nbsp;", "g");
    return str.replace(re, " ");
}

const _wordExp = /(^|\s)\S/g;

export function getFirstWordLetters(str, limit) {
    if (Types.isNullOrUndefined(str) || !str.match)
        return "";

    const matches = str.match(_wordExp);
    if (!matches)
        return str.trim().substr(0, 1);

    const m = matches.map((s) => s.trim());
    const res = m.join("");
    return limit ? res.substring(0, limit) : res;
}

export function getParameterNameByPath(parameterName) {
    if (!isParameter(parameterName))
        return undefined;

    const cd = parameterName.substring(1);
    const path = cd.split(".");
    return path[0]; //   /(?:^@)([^\.|^\n]+)/
}

// const _firstSpaceExp = /^[ ]+/g;

// export function getNotMoreThan(s, maxLen) {
//     if (s && s.length > maxLen)
//         return s.substring(0, 1024) + "...";
//     return s;
// }

// export function arrayToString(value, splitter) {
//     if (isNullOrUndefined(value)) return "";
//     if (typeof value === "string") return value;
//     if (isArray(value)) return value.join(splitter || " ");
//     return value.toString();
// }

// /**
//  * @param {String} str
//  * @returns {String}
//  */
// export function noSpace(str) {
//     return str.replace(_firstSpaceExp, "");
// }

// export function safeGetString(value) {
//     if (isLValue(value))
//         return value.toString();
//     return isNullOrUndefined(value) || typeof value !== "string" ? "" : value;
// }

// export function isFormula(value) {
//     return value && isString(value) && (startWith(value, "="));
// }

// export function getFormulaText(value) {
//     return typeof value === "string" ? Json.decode(value.substring(1)) : value;
// }

// export function toFormulaText(value) {
//     return "=" + Json.encode(value);
// }
