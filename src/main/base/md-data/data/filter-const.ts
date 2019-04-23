// tslint:disable:object-literal-sort-keys
export const op = {
    eq: "=",
    eqRef: "eqRef",
    notEq: "!=",
    gr: ">",
    grEq: ">=",
    less: "<",
    lessEq: "<=",
    btw: "between",
    nBetween: "!between",
    contains: "contains",
    nContain: "!contains",
    start: "start",
    nStart: "!start",
    end: "end",
    nEnd: "!end",
    mask: "mask",
    nMask: "!mask",
    empty: "null",
    nEmpty: "!null",
    in: "in",
    nIn: "!in",
    func: "f",
};

/**
 * Enum for filter condition operations
 * @readonly
 * @enum {string}
 */
export const grp = {
    or: "or",
    and: "and",
    nOr: "!or",
    nAnd: "!and",
};
// tslint:enable:object-literal-sort-keys

export const toStringColumn = "&toString";
export const thisColumn = "This";

export const selfCol = "&selfcol";

export function isThisColumn(colCd) {
    return colCd === thisColumn;
}
