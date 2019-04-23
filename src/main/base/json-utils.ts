import * as TypesUtils from "./types-utils";

/**
 * return object from string
 * @param item
 * @returns {*}
 */
export function decode(item) {
    if (TypesUtils.isEmpty(item)) return undefined;
    if (JSON && JSON.parse)
        return JSON.parse(item);

    // tslint:disable-next-line:no-eval
    return eval("json=" + item);
}

/**
 * return json string for item
 * @param item
 * @param [space]
 * @returns {*}
 */
export function encode(item, space?) {
    if (item === undefined || (!item && item !== false && item !== 0 && item !== ""))
        return null;

    if (JSON.stringify)
        return JSON.stringify(item, null, space);
}
