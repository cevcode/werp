import * as ArrExt from "../arr-extension";
import * as DT from "../date-extension";
import * as Ex from "../exceptions";
import { dateFmt, is24Hrs } from "./f-cultures";
import * as FmtDate from "./format-date";
import FmtRes from "./formatter-res";
import * as Fmt from "../formatting";
import * as Strings from "../str-extension";
import * as Types from "../types-utils";

import { DEF, R } from "../resources";

// tslint:disable:object-literal-sort-keys
const _res = {
    RequireNumber: DEF("ValidationUnformat.RequireNumber", "Expect number value"),
    RequireInt: DEF("ValidationUnformat.RequireInt", ""),
    bitFalse: DEF("fmt.bitFalse", "No"),
    bitTrue: DEF("fmt.bitTrue", "Yes"),
    bitUndefined: DEF("fmt.bitUndefined", "?"),
    now: DEF("fmt.now", "Now"),
    hAgo: DEF("fmt.hAgo", "{0} h {1} min"),
    mAgo: DEF("fmt.mAgo", "{0} min"),
    noControl: DEF("fmt.noControl", "<NO CONTROL>"),
    d1: DEF("fmt.overdue.d1", "{0} day"),
    d: DEF("fmt.overdue.d", "{0} days"),
    h1: DEF("fmt.overdue.h1", "{0} hour"),
    h: DEF("fmt.overdue.h", "{0} hours"),
    m1: DEF("fmt.overdue.m1", "{0} min"),
    m: DEF("fmt.overdue.m", "{0} min"),
    s1: DEF("fmt.overdue.s1", "{0} sec"),
    s: DEF("fmt.overdue.s", "{0} sec"),
    Minute: DEF("fmt.Datepart.Minute", "minute(s)"),
    Hour: DEF("fmt.Datepart.Hour", "hour(s)"),
    Day: DEF("fmt.Datepart.Day", "day(s)"),
    Week: DEF("fmt.Datepart.Week", "week(s)"),
    Month: DEF("fmt.Datepart.Month", "month(s)"),
};

const trueValues = ["yes", "true", "1"];

export function percentToDecimal(value) {
    if (Types.isEmptySwsValue(value))
        return undefined;
    value = value.replace("%", "");
    return toDecimal(value);
}

export function toDecimal(value) {
    if (Types.isEmptySwsValue(value))
        return undefined;
    value = Strings.replaceAll(value, R(FmtRes.thousandsSep), "");
    if (!Types.isNumberString(value))
        Ex.throwExceptionR(_res.RequireNumber);
    return typeof value === "string" ? parseFloat(value) : value;
}

export function toInt(value) {
    if (Types.notEmptySwsValue(value) && !Types.isIntString(value))
        Ex.throwExceptionR(_res.RequireInt);
    return typeof value === "string" ? parseInt(value) : value;
}

export function strToString(value) {
    if (Types.isEmpty(value)) return R(FmtRes.empty);
    return value;
}

export function numberToString(value) {
    if (Types.isEmpty(value)) return R(FmtRes.empty);
    return value.toString();
}

export function swsDateTimeSmartToString(value, _format, onlyTime) {
    const d = DT.toDateTimeFromSwsDate(value);
    const now = new Date();
    const dif = DT.dateMinDiff(now, d);
    if (dif < 5)
        return R(_res.now);
    if (dif < 60)
        return Fmt.formatR(_res.mAgo, dif);
    if (dif < 24 * 60) {
        const h = parseInt((dif / 60).toString());
        const m = dif % 60;
        return _format(R(_res.hAgo), h, m);
    }
    if (!_format && !onlyTime)
        _format = d.getFullYear() === now.getFullYear() ? _format.dateFmt.shortMonthDay : _format.dateFmt.defaultDate;
    return onlyTime ? _format.swsTimeToString(value, _format) : _format.swsDateTimeToString(value, _format);
}

export function swsTimeSmartToString(value) {
    return swsDateTimeSmartToString(value, dateFmt.defaultTime, true);
}

export function swsDateToString(value, format) {
    const f = FmtDate.createDateFormater(format || "defaultDate");
    return f(value);
}

export function swsTimeToString(value, format) {
    const f = FmtDate.createDateFormater(format || "defaultTime");
    return f(value.substring(8));
}

export function dateTimeDif(date) {
    const f = FmtDate.createTimeDifFormater();
    return f(DT.toSwsDateTime(date));
}

export function dateTimeToString(date) {
    return FmtDate.swsDateTimeToString(DT.toSwsDateTime(date));
}

export function timeToString(date) {
    const f = FmtDate.createDateFormater("defaultTime");
    return f(DT.toSwsDateTime(date));
}

export function dateToString(date, format?) {
    const f = FmtDate.createDateFormater(format || "defaultDate");
    return f(DT.toSwsDateTime(date));
}

export function periodToString(from, to) {
    // tslint:disable-next-line:triple-equals
    if (from == to)
        return dateToString(from, dateFmt.longDate);

    const sameY = from.getYear() === to.getYear();
    const sameM = sameY && (from.getMonth() === to.getMonth());
    if (sameM) {
        const days = Fmt.format("{0} - {1}", from.getDate(), to.getDate());
        const f = dateFmt.defaultMonth; // fmt.dateFmt.fullDateNoDay.replace(/d{2}/g, days);
        return Fmt.format("{0} {1}", days, dateToString(to, f));
    }

    const res = sameY ? dateFmt.monthDay : dateFmt.fullDateNoDay;

    return Fmt.format("{0} - {1}", dateToString(from, res), dateToString(to, dateFmt.fullDateNoDay));
}

// region hour related to be used in calendars
/**
 * returns hour in 12 or 24 time format
 * @param {int} hour
 * @returns {String}
 */
export function hhToString(hour) {
    return (is24Hrs ? hour : (hour % 12 || 12)).toString();
}

/**
 * returns 00 for 24 hours format or am/pm for 12 hour format
 * @param {int} hour
 * @returns {String}
 */
export function ttToString(hour) {
    return is24Hrs ? "00" : DT.hourGetAmPm(hour);
}

/**
 * returns hour current time format
 * @param {int} hour
 * @returns {String}
 */
export function htToString(hour) {
    return is24Hrs ? Fmt.format("{0}:00", hour) : Fmt.format("{0} {1}", hour % 12, DT.hourGetAmPm(hour));
}
// endregion

export function monthToString(date) {
    const f = FmtDate.createDateFormater("defaultMonth");
    return f(DT.toSwsDateTime(date));
}

export function bitToString(value) {
    if (Types.isEmpty(value))
        return R(_res.bitUndefined);
    return value ? R(_res.bitTrue) : R(_res.bitFalse);
}

export function stringToBit(value) { // TODO:::???
    if (Types.isEmpty(value) || value === R(_res.bitUndefined))
        return undefined;
    const v = value.toLowerCase();
    return v === R(_res.bitTrue).toLocaleLowerCase() || ArrExt.arrayFirstIdx(trueValues, (i, vv) => vv === v) !== null;
}

function getThSep() {
    return (R(FmtRes.thousandsSep) || "");
}

export function getMoneyToStringFunction(len, pers, currency, isFirst) {
    if (Types.isNullOrUndefined(currency))
        currency = "";
    if (Types.isNullOrUndefined(pers))
        pers = 0;
    return new Function("value", // jshint ignore:line
        "{ return " +
        (isFirst ? "'" + currency + " ' + " : "") +
        " Number(value || 0).toFixed(" + pers + ").replace(/\\d(?=(\\d{3})+\\.)/g, \"$&" + getThSep() + "\")" +
        (!isFirst ? " + '" + currency + "'" : "") + "; }");
}

export function getMoneyToDecimalFunction(currency) {
    if (Types.isNullOrUndefined(currency))
        currency = "";
    return new Function("value", // jshint ignore:line
        "{ if (Sws.Types.isEmptySwsValue(value)) return undefined;" +
        " value = value.replace('" + currency + "', '');" +
        " return Sws.FMT.toDecimal(value); }");
}

export function getDecimalToStringFunction(len, pers) {
    if (Types.isNullOrUndefined(pers))
        pers = 0;
    return new Function("value",
        "{ return Number(value || 0).toFixed(" + pers + ").replace(/\\d(?=(\\d{3})+\\.)/g, \"$&" + getThSep() + "\"); }");
}

export function getPercentToStringFunction(len, pers) {
    if (Types.isNullOrUndefined(pers))
        pers = 0;
    return new Function("value",
        "{ return Fmt.format('{0}%', Number(value || 0).toFixed(" + pers + ").replace(/\\d(?=(\\d{3})+\\.)/g, \"$&" + getThSep() + "\")); }");
}
