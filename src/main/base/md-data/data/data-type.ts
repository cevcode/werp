// tslint:disable:object-literal-sort-keys
export const _dataType = {
    calculated: "_calc",
    reference: "_ref",
    details: "_set",
};

export const t = {
    string: "string",
    multiline: "multiline",
    expression: "swsexpression",
    swstext: "swstext",
    ago: "ago",
    date: "date",
    datetime: "datetime",
    overdue: "overdue", // show time from value to today
    time: "time",
    bit: "bool",
    numeric: "numeric",
    int: "integer",
    longint: "longint",
    smallint: "smallint",
    tinyint: "tinyint",
    decimal: "decimal",
    money: "money",
    percent: "percent",
    lookup: "lookup",
    lookupgrid: "lookupgrid",
    lookupIcon: "lookupicon",
    grid: "grid",
    link: "link",
    email: "email",
    skype: "skype",
    fileLink: "filelink",
    imageGallery: "imagegallery",
    image: "image",
    file: "file",
    day: "day",
    color: "color",
    strFromList: "strfromlist",
    answerCheck: "answercheck",
    numFromList: "numfromlist",
    numFromListEditable: "numfromlisteditable",
    manyFromList: "manyfromlist",
    user: "user",
    password: "password",
    html: "html",
    dualList: "duallist",
    orderedList: "orderedlist",
    filter: "filter",
    linkedList: "linkedlist",
    varObject: "varobject",
    json: "json",
    anyType: "anytype",
    xml: "xml",
    formula: "formula",
    relations: "relations",
    sql: "sql",
};
// tslint:enable:object-literal-sort-keys

export function isRef(dt) {
    return dt === _dataType.reference;
}

export function isSet(dt) {
    return dt === _dataType.details;
}

export function isCalc(dt) {
    return dt === _dataType.calculated;
}
