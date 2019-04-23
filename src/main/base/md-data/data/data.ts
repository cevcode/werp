import * as ArrExt from "../../arr-extension";
import * as DT from "../../date-extension";
// TODO: import FILTER
import { FMTConverter, dateFmt, FmtRes, FmtDate } from "../../formatter";

import * as Fmt from "../../formatting";
import * as FnExt from "../../func-extension";
import * as Json from "../../json-utils";
import LOG from "../../logger/logger";
import { _res as ColumnRes } from "../base-column";
import * as ObjExt from "../../obj-extension";
import * as Strings from "../../str-extension";
import * as Types from "../../types-utils";
import * as Util from "../../utils";

import { DEF, R } from "../../resources";
import { getFieldType } from "../field-types";

import * as Filter from "./filter-const";

// tslint:disable:object-literal-sort-keys
export const _res = {
    FilePlaceholder: DEF("Data.FilePlaceholder", "Upload file or enter link here"),
    EmailIncorrect: DEF("Validation.EmailIncorrect", "Please enter a valid email address. For example name@domain.com."),
    RequireInt: DEF("Validation.RequireInt", "Valid integer expected"),
    RequireNumber: DEF("Validation.RequireNumber", "Valid number expected"),
    ValidateWithCaption: DEF("Validation.ValidateWithCaption", "{0} for {1}"),
    IncorrectYear: DEF("Validation.IncorrectYear", "Empty year trying to get year value from string"),
    IncorrectMonth: DEF("Validation.IncorrectMonth", "Incorrect month value [{0}]"),
    IncorrectDate: DEF("Validation.IncorrectDate", "Incorrect date value [{0}]"),
    IncorrectHour: DEF("Validation.IncorrectHour", "Incorrect hour value [{0}]"),
    IncorrectMinute: DEF("Validation.IncorrectMinute", "Incorrect minute value [{0}]"),
    IncorrectSeconds: DEF("Validation.IncorrectSeconds", "Incorrect sec value [{0}]"),
    NoTypeColumn: DEF("EntityColumn.NoTypeColumn", "Column with types for [{0}] not specified."),
    NoColumnMapping: DEF("EntityColumn.NoColumnMapping", "Mapping \"type to column\" for [{0}] not specified."),
    NoTypeMap: DEF("EntityColumn.NoTypeMap", "Mapping not specified."),
    NoTypeMapCol: DEF("EntityColumn.NoTypeMapCol", "Collumn [{0}]"),
    NoLetterColumn: DEF("EntityColumn.NoLetterColumn", "Column with letters for [{0}] not specified."),
    FileUploaderDownload: DEF("Controls.FileUploaderDownload", "Get {0}"),
};

const _type = {
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
    fileLink: "FileLink",
    imageGallery: "imagegallery",
    image: "image",
    file: "file",
    day: "day",
    color: "color",
    strFromList: "strFromList",
    answerCheck: "answerCheck",
    numFromList: "numFromList",
    numFromListEditable: "numFromListEditable",
    manyFromList: "manyFromList",
    user: "user",
    password: "password",
    html: "html",
    dualList: "dualList",
    orderedList: "orderedList",
    filter: "filter",
    linkedList: "linkedList",
    varObject: "varObject",
    json: "json",
    anyType: "anyType",
    xml: "xml",
    formula: "formula",
    relations: "relations",
    sql: "sql",
};
ObjExt.propsToLowerCase(_type);

const _dataType = {
    calculated: "_calc",
    reference: "_ref",
    details: "_set",
};
// tslint:enable:object-literal-sort-keys

// region default values
const _defValues = {};

export function setFieldTypeDefault(fieldType, defValue) {
    if (Strings.emptyOrNotString(fieldType)) return;

    _defValues[fieldType] = defValue;
}

export function getFieldTypeDefault(fieldType) {
    if (Strings.emptyOrNotString(fieldType)) return null;
    return _defValues[fieldType];
}

setFieldTypeDefault(_type.bit, false);
// endregion

const emailMask = /^[a-zA-Z0-9.!#$%&"*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/; // tslint:disable-line
const htmlRegexp = /<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|".*?"|[^"">\s]+))?)+\s*|\s*)\/?>/gi;

// region check functions
export function isEmail(value) { return value && value.match && value.match(emailMask); }
export function isDateType(dt) { return dt === _type.date || dt === _type.datetime; }
export function isNumberType(dt) {
    return dt === _type.int || dt === _type.money
        || dt === _type.longint || dt === _type.decimal
        || dt === _type.tinyint || dt === _type.percent;
}
function isNotNumberType(dt) { return !isNumberType(dt); }
function isFileType(dt) { return dt === _type.file; }
function isTextType(dt) { return dt === _type.multiline || dt === _type.string; }
function isMultilineType(dt) { return dt === _type.multiline; }
function isUserType(dt) { return dt === _type.user; }
function isImageType(dt) { return dt === _type.image; }
function isBoolType(dt) { return dt === _type.bit; }
function isXmType(dt) { return dt === _type.xml; }
function isParentRefE(cd, columnMd) { return isParentRef(columnMd); }
export function isParentRef(columnMd) { return columnMd.isParentChild(); }
export function isRef(dt) {
    return dt === _dataType.reference;
}
export function isSet(dt) {
    return dt === _dataType.details;
}
export function isCalc(dt) {
    return dt === _dataType.calculated;
}

function colWrap(func) {
    return (columnMd) => {
        const dt = FnExt.callByName(columnMd, "getFieldTypeCd");
        return dt && func(dt);
    };
}

function entWrap(func) {
    return (cd, columnMd) => {
        const dt = FnExt.callByName(columnMd, "getFieldTypeCd");
        return func(dt);
    };
}
// endregion

// region data type format
function validateNumberOp(op, value) {
    if (op === Filter.op.eq || op === Filter.op.less || op === Filter.op.lessEq || op === Filter.op.gr || op === Filter.op.grEq) {
        const v = parseFloat(value);
        return Types.isEmpty(v) ? undefined : v.toString();
    }
    return value;
}

function validateIntOp(op, value) {
    if (op === Filter.op.eq || op === Filter.op.less || op === Filter.op.lessEq || op === Filter.op.gr || op === Filter.op.grEq) {
        const v = parseInt(value);
        return Types.isEmpty(v) ? undefined : v.toString();
    }
    return value;
}

function errorWithCaptionR(error, caption) {
    return !caption ? R(error) : Fmt.formatR(_res.ValidateWithCaption, error, caption);
}

function validateNumber(value, caption) {
    return !Types.isNullOrUndefined(value) && !(Types.isNumberString(value)) ?
        errorWithCaptionR(_res.RequireNumber, caption) : undefined;
}

function validateInt(value, caption) {
    return !Types.isNullOrUndefined(value) && !(Types.isIntString(value)) ? errorWithCaptionR(_res.RequireInt, caption) : undefined;
}

function validateEmail(value, caption) {
    return !Types.isNullOrUndefined(value) && !isEmail(value) ? errorWithCaptionR(_res.EmailIncorrect, caption) : undefined;
}

function validateList(value, caption, column) {
    if (Types.isNullOrUndefined(value)) return undefined;

    let res;
    const values = column.deserialize(value);
    values.forEach((v) => {
        res = ObjExt.objectAddProps(res, v.validate());
    });
    return Types.isEmpty(res) ? null : ObjExt.objectToArray(res);
}

function validateFilter(value, caption, column) {
    const f = column.deserialize(value);
    return Types.isEmpty(f) ? null : f.validate();
}

function validateDate(value, caption, column) {
    if (Types.isEmpty(value)) return undefined;
    if (!value.substr)
        return Fmt.formatR(_res.IncorrectDate, value);

    const y = parseInt(value.substr(0, 4));
    if (Types.isEmpty(y))
        return R(_res.IncorrectYear);
    const m = parseInt(value.substr(4, 2));
    if (m < 1 || m > 12)
        return Fmt.formatR(_res.IncorrectMonth, m);
    const d = parseInt(value.substr(6, 2));
    if (d < 1 || d > 31)
        return Fmt.formatR(_res.IncorrectDate, d);
    return undefined;
}

function validateJSON(value) {
    try {
        if (Types.isNullOrUndefined(value)) return;
        Json.decode(value);
    } catch (ex) {
        return ex.message || ex;
    }
}

function validateDateTime(value, caption, column) {
    const v = validateDate(value, caption, column);
    if (Types.notEmpty(v))
        return v;
    return validateTime(v);
}

function validateTime(value) {
    if (Types.isEmpty(value)) return undefined;
    const h = parseInt(value.substr(8, 2) || 0);
    if (h === null || h < 0 || h > 23)
        return Fmt.formatR(_res.IncorrectHour, h);
    const mi = parseInt(value.substr(10, 2) || 0);
    if (mi === null || mi < 0 || mi > 59)
        return Fmt.formatR(_res.IncorrectMinute, mi);
    const ss = parseInt(value.substr(12, 2) || 0);
    if (ss === null || ss < 0 || ss > 59)
        return Fmt.formatR(_res.IncorrectSeconds, ss);
    return undefined;
}

function defToNative(value) { return value; }

// region title
function titleStr(value, record, fValue) { return fValue; }
function titleHtml(value) { return value ? value.toString().replace(htmlRegexp, " ").replace(/\s+/g, " ") : null; }
function titleFile(value) { return value.Link ? value.Name : Fmt.formatR(_res.FileUploaderDownload, value.Name); }
function titleImage(value) { return value ? "" : R(FmtRes.emptyValue); }
function titleOverdue(value) { return FmtDate.swsDateTimeToString(value); }
function formatFile(value) { return value.Name || R(FmtRes.emptyValue); }

const _swsFormatMask = /({{).+?(}})/g;
export function formatSwstext(value) {
    return value.replace(_swsFormatMask, (match, name) => {
        try {
            const o = Json.decode(match.substr(1, match.length - 2));
            // TODO: implement
            const url = null; // Sws.LOCATION.getEntityLink(o.e, o.key);
            const title = o.t;
            return Fmt.format("[[{0}{1}]]", url, Types.isNullOrUndefined(title) ? "" : "|" + title);
        } catch (ex) {
            // Sws.LOG.errorFmt(ex.message||ex, "In match or formatSwstext matc="{0}"",match);
            return match;
        }
    });
}

function formatHtml(value) {
    // TODO: implement
    // const html = Strings.simplifyHtml(value);
    // const node = Sws.UI.createElement("div");
    // return Sws.UI.setElementBody(node, html, true);
    return null;
}
// endregion

function serializeManyFromList(values) { return ArrExt.arrayAsStrings(values, undefined, ","); }
function deserializeManyFromList(value) { return Types.isEmpty(value) ? undefined : (Types.isArray(value) ? value : value.split(",")); }

function formatFilter(value, record) {
    // TODO: implement filter
    // const v = deserializeFilter(value);
    // return Sws.UI2.filterToHtml(v);
    return "";
}
function titleFilter(value) {
    const v = deserializeFilter(value);
    return v.toString();
}
function deserializeFilter(value) {
    // TODO: implement filter
    // return Sws.FILTER.deserializeFilter(Json.decode(value));
    return "";
}
function serializeFilter(value) {
    return Types.isNullOrUndefined(value) || Types.isEmpty(value.getItems()) ?
        null : Json.encode(value.serialize());
}

function getFilterEntity(record, column, callback) {
    // const columnCd = column.getColumnCd();
    // const f = column.getParam("Field");
    // const entityCd = FnExt.callByName(record, "get", f);
    // if (Types.isNullOrUndefined(entityCd))
    //     return FnExt.safeCallCallback(column, callback);

    // record.$Changed.on((cd, value) => {
    //     if (cd !== f) return;
    //     record.set(columnCd, null);
    //     record.raiseColumnChanged(columnCd, null);
    // });

    // Sws.MD.entity.getEntity(entityCd, callback);
}

function getFilterScopedEntity(record, callback) {
    // const entityCdColumn = "EntityCD";
    // if (record) {
    //     const entity = record._entity;
    //     const entityCd = entity.hasColumn(entityCdColumn) ? record.get(entityCdColumn) : undefined;
    //     if (entityCd)
    //         return Sws.MD.entity.getEntityWithRelations(entityCd, callback);
    // }
    // FnExt.callCallback(callback);
}

function formatJson(value) { return Json.encode(value, "\t"); }

function unformatJson(value) { return Json.decode(value); }

function getFDef(format, defValue) { return Strings.emptyOrNotString(format) ? defValue : format; }

function titleRelations(value, record, fV, columnMd) {
    const refEntityParam = columnMd.getRefEntityParam();
    const thisKeyParam = columnMd.getThisKeyParam();
    const otherKeyParam = columnMd.getOtherKeyParam();
    const refEntityCd = record.getF(refEntityParam);
    const thisKey = (record.get(thisKeyParam) || "").split(",");
    const otherKey = (record.get(otherKeyParam) || "").split(",");
    const oneToMany = columnMd.getRelationType();
    if (Types.isEmpty(thisKey))
        return refEntityCd;
    let keysStr = "";
    thisKey.forEach((k1, i) => {
        const k2 = otherKey[i];
        keysStr += (oneToMany ? k1 : k2) + " = " + (oneToMany ? k2 : k1) + ", ";
    });
    return refEntityCd + " (" + keysStr.substring(0, keysStr.length - 2) + ")";
}

function titlePassword() {
    return undefined;
}

const __defColumnLength = 30;

// TODO: calculate default width
function getDefItemWidth(len: number): number {
    return len * 7;
}

export class FormatType {
    public _format;
    public _unformat;
    public _align: string;
    public _class: string;
    public defaultLineCount: number;
    public maxLineCount: number;
    public minLineCount: number;
    public _defaultWidth: number;
    public validateOp;
    public title: string;
    public toNative;
    public serialize;
    public deserialize;
    public validate;
    public placeholder: string;
    public _formatStr: string;
    public noCacheStr: boolean;
    public valuePreprocessor;

    constructor(fmt, cls, len, validateOp?, unFmt?, title?, toNative?, validate?, placeholder?, formatStr?,
                align?, defLineCount?, maxLineCount?, minLineCount?, serialize?, deserialize?) {
        if (!(maxLineCount > 1))
            cls = Types.isNullOrUndefined(cls) ? "single-line" : cls + " single-line";

        this._format = fmt;
        this._unformat = unFmt;
        this._align = align;
        this.defaultLineCount = defLineCount;
        this.maxLineCount = maxLineCount;
        this.minLineCount = minLineCount || 1;
        this._class = cls;
        if (isNaN(len))
            len = __defColumnLength;
        this._defaultWidth = getDefItemWidth(len);
        this.validateOp = validateOp;
        this.title = title || fmt;
        this.toNative = !toNative ? defToNative : toNative;
        this.serialize = serialize;
        this.deserialize = deserialize;
        this.validate = validate;
        this.placeholder = placeholder;
        this._formatStr = formatStr;
        this.noCacheStr = false;
    }

    public setNoCacheStr(value) {
        this.noCacheStr = value;
        return this;
    }

    public setValuePreProcessor(valuePreprocessor) {
        if (Types.isMethod(valuePreprocessor))
            this.valuePreprocessor = valuePreprocessor;
        return this;
    }
}

function getDataTypeFormat(fieldTypeCd, isRef, length, visLen, isSet, defFmt) {
    let f;
    let len;
    const a = undefined;
    let c;
    const u = undefined;
    const toNative = undefined;
    let defLineCount;
    let maxLineCount = isSet ? 1000 : undefined;
    const minLineCount = undefined;
    let title;
    let _validateOp;
    let serialize;
    let deserialize;
    let _validate;
    let _placeholder;
    const _formatStr = undefined;

    switch (fieldTypeCd) {
        case _type.file:
            c = "left";
            f = formatFile;
            title = titleFile;
            _placeholder = R(_res.FilePlaceholder);
            break;
        case _type.manyFromList:
            serialize = serializeManyFromList;
            deserialize = deserializeManyFromList;
            break;
        case _type.dualList:
            serialize = serializeManyFromList;
            deserialize = deserializeManyFromList;
            maxLineCount = 30;
            defLineCount = 20;
            break;
        case _type.email:
            c = "email";
            _validate = validateEmail;
            break;
        case _type.user:
            c = "user";
            break;
        case _type.varObject:
            len = 30;
            break;
        case _type.orderedList:
            _validate = validateList;
            break;
        case _type.filter:
            f = formatFilter;
            title = titleFilter;
            serialize = serializeFilter;
            deserialize = deserializeFilter;
            _validate = validateFilter;
            // column.getFilterEntity = function(record, callback){ return getFilterEntity(record, column, callback); };
            break;
        default:
            c = "left";
            if (!isRef) {
                const fType = getFieldType(fieldTypeCd);
                if (fType) {
                    if (fType._baseTypeCd === "number") {
                        c = "right"; f = FMTConverter.numberToString; _validateOp = validateNumberOp; len = 10;
                        break;
                    }
                }
                len = Util.safeGetLen(length, 10, 20);
            }
            const _format = defFmt;
            f = typeof _format === "string" ? (value) => (FMTConverter.strToString(value)) : FMTConverter.strToString;
            title = titleStr;
            break;
    }

    if (!len)
        len = !length ? __defColumnLength : Util.safeGetLen(visLen || length, 10, 50);

    return new FormatType(f, c, len, _validateOp, u, title,
        toNative, _validate, _placeholder, _formatStr, a, defLineCount,
        maxLineCount, minLineCount, serialize, deserialize);
}

export class FieldTypeRegistry {
    private _fieldTypesReg;
    private _defFormatFunc;

    constructor(defFormat) {
        this._fieldTypesReg = {};
        this._defFormatFunc = defFormat;
    }

    public getColumnFormat(column) {
        const fieldTypeCd = column.getFieldTypeCd();
        const func = this._fieldTypesReg.hasOwnProperty(fieldTypeCd) ? this._fieldTypesReg[fieldTypeCd] : this._defFormatFunc;
        return func(fieldTypeCd, column);
    }

    public getFormatByType(fieldTypeCd) {
        const func = this._fieldTypesReg.hasOwnProperty(fieldTypeCd) ? this._fieldTypesReg[fieldTypeCd] : this._defFormatFunc;
        return func(fieldTypeCd);
    }

    public regFieldTypeFormatter(formatFunc, ...rest) {
        if (rest)
            rest.forEach((fieldTypeCd) => {
                this._fieldTypesReg[fieldTypeCd] = formatFunc;
            });
        return this;
    }

    public registerDefFormatFunc(defFormatFunc) {
        this._defFormatFunc = defFormatFunc;
        return this;
    }
}

const _fieldTypeRegistry = new FieldTypeRegistry((fieldTypeCd, column) => {
    const _formatStr = FnExt.callByName(column, "getFormatStr");
    const _isRef = FnExt.callByName(column, "isRef");
    const _length = FnExt.callByName(column, "getLength");
    const _visLen = FnExt.callByName(column, "getVisLen");
    const _isSet = FnExt.callByName(column, "isSet");
    return getDataTypeFormat(fieldTypeCd, _isRef, _length, _visLen, _isSet, _formatStr);
});

function dateTimePreprocessor(value) {
    switch (Types.getBaseType(value)) {
        case "number":
            return value.toString();
        default:
            return value;
    }
}

// region registered field type formatters
_fieldTypeRegistry
    .regFieldTypeFormatter((fieldType, column) => {
        const currency = FnExt.callByName(column, "getParam", "Currency");
        const isFirst = FnExt.callByName(column, "getParam", "IsFirst");
        const precision = FnExt.callByName(column, "getPrecision");
        const c = "right lim-width";
        const len = 10;
        const u = FMTConverter.getMoneyToDecimalFunction(currency);
        const f = FMTConverter.getMoneyToStringFunction(length, precision, currency, isFirst); // u = FmtConverter.stringToMoney;

        return new FormatType(f, c, len, validateNumberOp, u, null, null, validateNumber);
    }, _type.money)
    .regFieldTypeFormatter((fieldType, column) => {
        const precision = FnExt.callByName(column, "getPrecision");
        const c = "right lim-width";
        const len = 10;
        const u = FMTConverter.toDecimal;
        const f = FMTConverter.getDecimalToStringFunction(length, precision); // u = FmtConverter.stringToMoney;

        return new FormatType(f, c, len, validateNumberOp, u, null, null, validateNumber);
    }, _type.decimal)
    .regFieldTypeFormatter((fieldType, column) => {
        const precision = FnExt.callByName(column, "getPrecision");
        const c = "right lim-width";
        const len = 10;
        const u = FMTConverter.percentToDecimal;
        const f = FMTConverter.getPercentToStringFunction(len, precision);

        return new FormatType(f, c, len, validateNumberOp, u, null, null, validateNumber);
    }, _type.percent)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const defFmt = FnExt.callByName(column, "getFormatStr");
        const _formatStr = getFDef(defFmt, dateFmt.defaultDate);
        const c = "left lim-width";
        const len = 12;
        const f = FmtDate.createDateFormater(_formatStr); // fmt.swsDateToString
        const u = FmtDate.createDateUnFormatter(_formatStr);

        return new FormatType(f, c, len, undefined, u, undefined, DT.toDateTimeFromSwsDate,
            validateDate, dateFmt.defaultDate, _formatStr)
            .setValuePreProcessor(dateTimePreprocessor);
    }, _type.date)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const defFmt = FnExt.callByName(column, "getFormatStr");
        const _formatStr = getFDef(defFmt, dateFmt.defaultDateTime);
        const c = "left lim-width";
        const len = 18;
        const f = FmtDate.createDateFormater(_formatStr);
        const u = FmtDate.createDateUnFormatter(_formatStr);

        return new FormatType(f, c, len, undefined, u, undefined,
            DT.toDateTimeFromSwsDate, validateDateTime, dateFmt.defaultDateTime, _formatStr)
            .setValuePreProcessor(dateTimePreprocessor);
    }, _type.datetime)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const defFmt = FnExt.callByName(column, "getFormatStr");
        const _formatStr = getFDef(defFmt, dateFmt.defaultTime);
        const c = "left lim-width";
        const len = 8;
        const f = FmtDate.createDateFormater(_formatStr);
        const u = FmtDate.createDateUnFormatter(_formatStr, true);

        return new FormatType(f, c, len, undefined, u, undefined,
            DT.toDateTimeFromSwsDate, validateTime, dateFmt.defaultTime, _formatStr)
            .setValuePreProcessor(dateTimePreprocessor);
    }, _type.time)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const defFmt = FnExt.callByName(column, "getFormatStr");
        const _formatStr = getFDef(defFmt, dateFmt.defaultDateTime);
        const c = "left lim-width";
        const len = 5;
        const f = FmtDate.createOverdueFormater(_formatStr);
        const u = FmtDate.createDateUnFormatter(_formatStr);

        return new FormatType(f, c, len, undefined, u, titleOverdue,
            DT.toDateTimeFromSwsDate, undefined, dateFmt.defaultDateTime, _formatStr)
            .setNoCacheStr(true);
    }, _type.overdue)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const defFmt = FnExt.callByName(column, "getFormatStr");
        const _formatStr = getFDef(defFmt, dateFmt.defaultDateTime);
        const c = "left lim-width";
        const len = 5;
        const f = FmtDate.createTimeDifFormater(_formatStr);
        const u = FmtDate.createDateUnFormatter(_formatStr);

        return new FormatType(f, c, len, undefined, u, titleOverdue,
            DT.toDateTimeFromSwsDate, undefined, dateFmt.defaultDateTime, _formatStr)
            .setNoCacheStr(true)
            .setValuePreProcessor(dateTimePreprocessor);
    }, _type.ago)

    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const c = "bool lim-width";
        const len = null;
        const f = FMTConverter.bitToString;
        const u = FMTConverter.stringToBit;

        return new FormatType(f, c, len, undefined, u);
    }, _type.bit)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const c = "right lim-width";
        const len = 10;
        const u = FMTConverter.toInt;
        const f = FMTConverter.numberToString;
        const _validateOp = fieldTypeCd === _type.numeric ? validateNumberOp : validateIntOp;
        const _validate = fieldTypeCd === _type.numeric ? validateNumber : validateInt;

        return new FormatType(f, c, len, _validateOp, u, undefined, undefined, _validate);
    }, _type.longint, _type.int, _type.tinyint, _type.smallint, _type.numeric)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        let c = "multiline left";
        const f = fieldTypeCd === _type.swstext ? formatSwstext : undefined;
        const minLineCount = 3;
        const maxLineCount = 40;
        const defLineCount = 10;
        if (fieldTypeCd === _type.xml)
            c += " xml";

        return new FormatType(f, c, undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined, defLineCount, maxLineCount, minLineCount);
    }, _type.xml, _type.expression, _type.multiline, _type.swstext, _type.html)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const c = "multiline left sql";
        const minLineCount = 3;
        const maxLineCount = 40;
        const defLineCount = 10;

        return new FormatType(undefined, c, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined, undefined, undefined,
            defLineCount, maxLineCount, minLineCount);
    }, _type.sql)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const c = "multiline left";
        const f = formatHtml;
        const minLineCount = 3;
        const maxLineCount = 40;
        const defLineCount = 10;

        return new FormatType(f, c, undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined, defLineCount, maxLineCount, minLineCount);
    }, _type.html)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const c = "multiline left";
        const f = undefined; // = formatJson,
        const u = undefined; // = unformatJson,
        const minLineCount = 3;
        const maxLineCount = 40;
        const defLineCount = 10;

        return new FormatType(f, c, undefined, undefined, u, undefined, undefined,
            validateJSON, undefined, undefined, undefined, defLineCount, maxLineCount, minLineCount);
    }, _type.json)
    .regFieldTypeFormatter((fieldTypeCd, column) => {
        const c = "image center";
        const minLineCount = 5;
        const maxLineCount = 40;
        const defLineCount = 10;

        return new FormatType(undefined, c, undefined, undefined, undefined,
            titleImage, undefined, undefined, undefined, undefined, undefined, defLineCount, maxLineCount, minLineCount);
    }, _type.image)
    .regFieldTypeFormatter(() => {
        const len = 50;
        return new FormatType(undefined, undefined, len);
    }, _type.answerCheck)
    .regFieldTypeFormatter(() => {
        return new FormatType(undefined, undefined, undefined, undefined, undefined, titleRelations);
    }, _type.relations)
    .regFieldTypeFormatter(() => {
        return new FormatType(undefined, undefined, undefined, undefined, undefined, titlePassword);
    }, _type.password)
    ;

// endregion

export function getColumnFormat(column) {
    const res = _fieldTypeRegistry.getColumnFormat(column);
    if (res.placeholder)
        column.getPlaceholder = () => res.placeholder;
    column.getFilterEntity = (record, callback) => getFilterEntity(record, column, callback);
    column.getFilterScopedEntity = (record, callback) => getFilterScopedEntity(record, callback);
    if (res.noCacheStr)
        column._noCacheStr = true;
    return res;
}
// endregion

function getVarObjectValue(typeColumnCd, typeMapping, record) {
    const cd = getVarObjectColumnCd(typeColumnCd, typeMapping, record);
    return cd ? record.get(cd) : undefined;
}

function getVarObjectColumnCd(typeColumnCd, typeMapping, record) {
    if (record.isEmpty(typeColumnCd)) return undefined;
    const t = record.get(typeColumnCd);
    const cd = typeMapping[t];
    if (Strings.isNotEmpty(cd)) return cd;
    LOG.errorFmt(R(_res.NoTypeMap), R(_res.NoTypeMapCol), t);
}

let __varObjTypes;

function getSupportedVarObjTypes() {
    if (!__varObjTypes)
        __varObjTypes = {
            [_type.string]: null,
            [_type.bit]: null,
            [_type.date]: null,
            [_type.datetime]: null,
            [_type.decimal]: null,
            [_type.file]: null,
            [_type.int]: null,
            [_type.json]: null,
            [_type.longint]: null,
            [_type.multiline]: null,
            [_type.smallint]: null,
            [_type.numeric]: null,
            [_type.ago]: null,
            [_type.overdue]: null,
            [_type.string]: null,
            [_type.swstext]: null,
        };
    return __varObjTypes;
}

export function finalizeInitColumn(col, entity) {
    const columnCd = col.getColumnCd();
    const fieldTypeCd = col.getFieldTypeCd();
    const entityCaption = entity.getCaption();
    let typeColumnCd;
    const typesFormat = {};

    function getTypeColumn(rec) {
        const t = rec.get(typeColumnCd);
        const types = getSupportedVarObjTypes();
        return types && types.hasOwnProperty(t) ? t : undefined;
    }

    function getFormater(rec) {
        const ft = getTypeColumn(rec);
        let f = typesFormat[ft];
        if (!f)
            f = typesFormat[ft] = _fieldTypeRegistry.getFormatByType(ft);
        return f;
    }

    switch (fieldTypeCd) {
        case _type.anyType:
            typeColumnCd = col.getParam("TypeColumn");
            if (Strings.emptyOrNotString(typeColumnCd))
                return col.setBadMetadata(Fmt.formatR(_res.NoTypeColumn, fieldTypeCd));

            col.getTypeColumn = getTypeColumn;
            col.format = function format(value, rec) {
                return Types.isEmpty(value) ? R(FmtRes.emptyValue) : FnExt.getFnResult(value, getFormater(rec)._format, rec);
            };
            col.title = function title(value, rec) {
                return Types.isEmpty(value) ? R(FmtRes.emptyValue) : FnExt.getFnResult(value, getFormater(rec).title, rec);
            };
            col.deserialize = function deserialize(value, rec) {
                return FnExt.getFnResult(value, getFormater(rec).deserialize, rec);
            };
            break;
        case _type.varObject:
            typeColumnCd = col.getParam("TypeColumn");
            if (Strings.emptyOrNotString(typeColumnCd))
                return col.setBadMetadata(Fmt.formatR(_res.NoTypeColumn, fieldTypeCd));
            if (!entity.hasColumn(typeColumnCd))
                return col.setBadMetadata(Fmt.format(ColumnRes.NoField, typeColumnCd, entityCaption));
            const typeMapping = col.getParam("TypeMapping");
            if (Types.isEmpty(typeMapping))
                return col.setBadMetadata(Fmt.formatR(_res.NoColumnMapping, fieldTypeCd));
            if (ObjExt.objectAny(typeMapping, (t, cd) => {
                if (entity.hasColumn(cd)) return;
                col.setBadMetadata(Fmt.format(ColumnRes.NoField, cd, entityCaption));
                return true;
            }))
                return;

            entity.getColumn(typeColumnCd).addDependency(columnCd);

            col.updateCalc = (record) => {
                return getVarObjectValue(typeColumnCd, typeMapping, record);
            };
            col.getVarObjectColumn = (record) => {
                const cd = getVarObjectColumnCd(typeColumnCd, typeMapping, record);
                return cd ? entity.getColumn(cd) : undefined;
            };
            col.format = (value, record) => {
                const cd = getVarObjectColumnCd(typeColumnCd, typeMapping, record);
                return record.getF(cd || columnCd);
            };
            col.getClass = (record) => {
                const cd = getVarObjectColumnCd(typeColumnCd, typeMapping, record);
                return cd ? entity.getColumn(cd).getClass() : "";
            };
            break;
        case _type.answerCheck:
            const letterColumnCd = col.getParam("Field");
            if (Strings.emptyOrNotString(letterColumnCd))
                return col.setBadMetadata(Fmt.formatR(_res.NoLetterColumn, fieldTypeCd));
            if (!entity.hasColumn(letterColumnCd))
                return col.setBadMetadata(Fmt.format(ColumnRes.NoField, letterColumnCd, entityCaption));
            const letterColumn = entity.getColumn(letterColumnCd);
            letterColumn.addDependency(columnCd);
            col.getLetterColumn = () => letterColumnCd;
            break;
        default:
            break;
    }
}

export const t = _type;
export const dt = _dataType;
export const E = {
    isBoolColumn: entWrap(isBoolType),
    isDateColumn: entWrap(isDateType),
    isFileColumn: entWrap(isFileType),
    isImageColumn: entWrap(isImageType),
    isNotNumberColumn: entWrap(isNotNumberType),
    isNumberColumn: entWrap(isNumberType),
    isParentRef: isParentRefE,
    isTextColumn: entWrap(isTextType),
    isUserColumn: entWrap(isUserType),
    isXmlColumn: entWrap(isXmType),
};

export const isDateColumn = colWrap(isDateType);
export const isNumberColumn = colWrap(isNumberType);
export const isNotNumberColumn = colWrap(isNotNumberType);
export const isFileColumn = colWrap(isFileType);
export const isTextColumn = colWrap(isTextType);
export const isMultilineColumn = colWrap(isMultilineType);
export const isUserColumn = colWrap(isUserType);
export const isImageColumn = colWrap(isImageType);
export const isBoolColumn = colWrap(isBoolType);
export const isXmlColumn = colWrap(isXmType);
