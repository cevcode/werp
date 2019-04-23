import * as DT from "../date-extension";
import * as Ex from "../exceptions";
import { dateFmt } from "./f-cultures";
import * as Fmt from "../formatting";
import * as ObjExt from "../obj-extension";
import * as Types from "../types-utils";
import * as FCultures from "./f-cultures";

import { DEF, R } from "../resources";

// tslint:disable:object-literal-sort-keys
const _res = {
    EmptyYear: DEF("Format.Error.EmptyYear", "Empty year trying to get year value from string"),
    IncorrectYear: DEF("Format.Error.IncorrectYear", "Year expected in YYYY format and should be greater than {0}"),
    IncorrectMonth: DEF("Format.Error.IncorrectMonth", "Incorrect month value [{0}]"),
    IncorrectDayInMonth: DEF("Format.Error.IncorrectDayInMonth", "Incorrect day in month value [{0}]"),
    Incorrect_1_12Hour: DEF("Format.Error.Incorrect_1_12Hour", "Incorrect hour (1-12) value [{0}]"),
    Incorrect_0_11Hour: DEF("Format.Error.Incorrect_0_11Hour", "Incorrect hour (0-11) value [{0}]"),
    Incorrect_0_23Hour: DEF("Format.Error.Incorrect_0_23Hour", "Incorrect hour (0-23) value [{0}]"),
    Incorrect_1_24Hour: DEF("Format.Error.Incorrect_1_24Hour", "Incorrect hour (1-24) value [{0}]"),
    IncorrectMin: DEF("Format.Error.IncorrectMin", "Incorrect minute (0-59) value [{0}]"),
    IncorrectSec: DEF("Format.Error.IncorrectSec", "Incorrect sec (0-59) value [{0}]"),
    IncorrectAmPm: DEF("Format.Error.IncorrectAmPm", "Incorrect am-pm value [{0}]"),
    LastDayIs30: DEF("Format.Error.LastDayIs30", "Last day in {0} is 30"),
    LastDayIs29: DEF("Format.Error.LastDayIs29", "In leap year last day in Feb is 29"),
    LastDayIs28: DEF("Format.Error.LastDayIs28", "In non leap year last day in Feb is 28"),
    TrailingCharacters: DEF("Format.Error.", "There are trailing characters left in the value, it doesn't match pattern {0}"),
    FitPattern: DEF("Format.Error.", "Value [{0}] does not fit pattern [{1}] expected [{2}]"),
    ExpectValue: DEF("Format.Error.", "Value does not fit pattern '{0}'. Expected '{1}{2}', got '{3}'"),
    now: DEF("fmt.now", "Now"),
    today: DEF("fmt.today", "Today"),
    yesterday: DEF("fmt.yesterday", "Yesterday"),
    ago: DEF("fmt.overdue.ago", "{0} ago"),
    overdue: DEF("fmt.overdue.overdue", "{0} overdue"),
};

let _dateFormaters = {};

// tslint:disable:max-line-length
// tslint:disable:object-literal-sort-keys
const _dateFmt = {
    token: /d{1,4}|M{1,4}|yy(?:yy)?|([HhmsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone: /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip: /[^-+\dA-Z]/g,
    minYear: 1970,
};
// tslint:enable:object-literal-sort-keys
// tslint:enable:max-line-length

// region code from http://www.mattkruse.com/javascript/date/source.html
// ------------------------------------------------------------------
// getDateFromFormat( date_string , format_string )
//
// This function takes a date string and a format string. It matches
// If the date string matches the format string, it returns the
// getTime() of the date. If it does not match, it returns 0.
// ------------------------------------------------------------------
function getDateFromFormat(val, _format, timeOptional, typeOfTime) {
    val = val + "";
    _format = _format + "";
    // tslint:disable-next-line:variable-name
    let i_val = 0;
    let i;
    // tslint:disable-next-line:variable-name
    let i_format = 0;
    let c = "";
    let token = "";
    let x;
    let y;
    let year;
    let month;
    let date;
    let hh = 0;
    let mm = 0;
    let ss = 0;
    let ampm;

    if (!typeOfTime) {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
        date = now.getDate();
    }

    function _getInt(str, ii, minlength, maxlength, def) {
        const substr = str.substring(ii, ii + maxlength).match(/[\d]*/);
        if (substr.length < 1) return null;

        const v = substr[0];
        if (Types.isEmpty(v) && Types.notEmpty(def)) return def;
        const r = parseInt(v);
        i_val += v.length;
        return r;
    }

    while (i_format < _format.length) {
        // Get next token from format string
        c = _format.charAt(i_format);
        token = "";
        while ((_format.charAt(i_format) === c) && (i_format < _format.length)) {
            token += _format.charAt(i_format++);
        }
        // Extract contents of value based on format token
        if (token === "yyyy" || token === "yy" || token === "y") {
            if (token === "yyyy") {
                x = 4; y = 4;
            } else if (token === "yy") {
                x = 2; y = 2;
            } else if (token === "y") {
                x = 2; y = 4;
            }
            year = _getInt(val, i_val, x, y, year);
            if (year === null)
                Ex.throwExceptionR(_res.EmptyYear);

            if (year < 100) {
                if (year > 70) {
                    year = 1900 + (year - 0);
                } else {
                    year = 2000 + (year - 0);
                }
            } else
                if (year < _dateFmt.minYear)
                    Ex.throwExceptionR(_res.IncorrectYear);
        } else if (token === "MMM" || token === "NNN") {
            month = 0;
            for (i = 0; i < _format.monthNamesShort.length; i++) {
                // tslint:disable-next-line:variable-name
                const month_name = _format.monthNamesShort[i];
                if (val.substring(i_val, i_val + month_name.length).toLowerCase() === month_name.toLowerCase()) {
                    if (token === "MMM" || (token === "NNN" && i > 11)) {
                        month = i + 1;
                        if (month > 12)
                            month -= 12;
                        i_val += month_name.length;
                        break;
                    }
                }
            }
            if (month < 1 || month > 12)
                Ex.throwExceptionFmtR(_res.IncorrectMonth, month);
        } else if (token === "EE" || token === "E") {
            for (i = 0; i < _format.dayNamesShort.length; i++) {
                // tslint:disable-next-line:variable-name
                const day_name = _format.dayNamesShort[i];
                if (val.substring(i_val, i_val + day_name.length).toLowerCase() === day_name.toLowerCase()) {
                    i_val += day_name.length;
                    break;
                }
            }
        } else if (token === "MM" || token === "M") {
            month = _getInt(val, i_val, token.length, 2, month);
            if (month === null || month < 1 || month > 12)
                Ex.throwExceptionFmtR(_res.IncorrectMonth, month);
        } else if (token === "dd" || token === "d") {
            date = _getInt(val, i_val, token.length, 2, date);
            if (date < 1 || date > 31)
                Ex.throwExceptionFmtR(_res.IncorrectDayInMonth, date);
        } else if (token === "hh" || token === "h") {
            hh = _getInt(val, i_val, token.length, 2, 1);
            if (hh === null || hh < 1 || hh > 12)
                Ex.throwExceptionFmtR(_res.Incorrect_1_12Hour, hh);
        } else if (token === "HH" || token === "H") {
            hh = _getInt(val, i_val, token.length, 2, 0);
            if (hh === null || hh < 0 || hh > 23)
                Ex.throwExceptionFmtR(_res.Incorrect_0_23Hour, hh);
        } else if (token === "KK" || token === "K") {
            hh = _getInt(val, i_val, token.length, 2, 0);
            if (hh === null || hh < 0 || hh > 11)
                Ex.throwExceptionFmtR(_res.Incorrect_0_11Hour, hh);
        } else if (token === "kk" || token === "k") {
            hh = _getInt(val, i_val, token.length, 2, 1);
            if (hh === null || hh < 1 || hh > 24)
                Ex.throwExceptionFmtR(_res.Incorrect_1_24Hour, hh);
            hh--;
        } else if (token === "mm" || token === "m") {
            mm = _getInt(val, i_val, token.length, 2, mm);
            if (mm === null || mm < 0 || mm > 59)
                Ex.throwExceptionFmtR(_res.IncorrectMin, mm);
        } else if (token === "ss" || token === "s") {
            ss = _getInt(val, i_val, token.length, 2, ss);
            if (ss === null || ss < 0 || ss > 59)
                Ex.throwExceptionFmtR(_res.IncorrectSec, ss);
        } else if (token === "a" || token === "tt") {
            const ap = val.substring(i_val, i_val + 2).toLowerCase();

            switch (ap) {
                case "am":
                case "a":
                case "":
                    ampm = "AM";
                    break;
                case "pm":
                case "p":
                    ampm = "PM";
                    break;
                default:
                    Ex.throwExceptionFmtR(_res.IncorrectAmPm, ap);
            }
            i_val += ap.length;
        } else {
            const s = val.substring(i_val, i_val + token.length);
            if (s.length === 0) {
                if (typeOfTime && !Types.isNullOrUndefined(hh) ||
                    timeOptional && year > 0 && month > 0 && date > 0)
                    break;
            }
            if (s !== token) {
                if (s === "")
                    break;
                Ex.throwExceptionFmtR(_res.ExpectValue, _format, token, _format.substring(i_format), s);
            }
            i_val += token.length;
        }
    }
    // If there are any trailing characters left in the value, it doesn't match
    if (i_val !== val.length)
        Ex.throwExceptionFmtR(_res.TrailingCharacters, _format);
    // Is date valid for month?
    if (month === 2) {
        // Check for leap year
        if (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) { // leap year
            if (date > 29)
                Ex.throwExceptionFmtR(_res.LastDayIs29);
        } else {
            if (date > 28)
                Ex.throwExceptionFmtR(_res.LastDayIs28);
        }
    } else {
        if (month === 4 || month === 6 || month === 9 || month === 11) {
            if (date > 30)
                Ex.throwExceptionFmtR(_res.LastDayIs30, _format.monthNamesLong[month]);
        }
    }
    // Correct hours value
    if (hh < 12 && ampm === "PM")
        hh = hh - 0 + 12;
    else if (hh > 11 && ampm === "AM")
        hh -= 12;

    return toSwsDateFmt(year, month, date, hh, mm, ss);
}
// endregion

function padOrEmpty(value, num) {
    return Types.isNullOrUndefined(value) ? "" : Fmt.lPad0(value, num);
}

export function toSwsDateFmt(year, month, date, hours, minutes, seconds) {
    const d = Fmt.format("{0}{1}{2}", padOrEmpty(year, 4), padOrEmpty(month, 2), padOrEmpty(date, 2));
    let h = "";
    if (!Types.isNullOrUndefined(seconds)) {
        const ss = Fmt.lPad0(seconds, 2);
        if (ss !== "00")
            h = h + ss;
    }
    if (!Types.isNullOrUndefined(minutes)) {
        const m = Fmt.lPad0(minutes, 2);
        if (h.length > 0 || m !== "00")
            h = m + h;
    }
    const hh = Fmt.lPad0(hours, 2);
    h = h.length > 0 ? hh + h : (hh !== "00" ? hh : h);
    return d + h;
}

export function swsDateSmartToString(value, fmt?) {
    const d = DT.toDateTimeFromSwsDate(value);
    const now = new Date();

    if (DT.sameDate(now, d))
        return R(_res.today);
    if (DT.sameMonth(now, d)) {
        const r = now.getDate() - d.getDate();
        if (r === 1)
            return R(_res.yesterday);
        if (r < 7)
            return swsDateTimeToString(value, dateFmt.weekDay);
    }

    if (!fmt)
        fmt = dateFmt.fullDateShortMonth;
    return swsDateTimeToString(value, fmt);
}

export function swsDateTimeToString(value, fmt?) {
    const f = createDateFormater(fmt || "defaultDateTime");
    return f(value);
}

function timeDifFmt(value, fmt) {
    const d = DT.toDateTimeFromSwsDate(value);
    if (!d) return "";
    if (!DT.sameDate(new Date(), d))
        return swsDateSmartToString(value);

    const r = DT.dateFullDiff(new Date(), d);
    const aa = ObjExt.objectToArray(r, (cd, v) => {
        if (!v) return;

        // tslint:disable-next-line:triple-equals
        return { f: R(_res.overdue[v == 1 ? cd + "1" : cd]), v };
    });
    if (aa.length < 1)
        return R(_res.now);

    const first = aa[0];
    const s = Fmt.format(first.f, aa.length > 1 ? first.v + "+" : first.v);
    return Fmt.formatR(fmt, s);
}

function overdueFmt(value) {
    return timeDifFmt(value, _res.overdue);
}

function timeDifFormater(value) {
    return timeDifFmt(value, _res.ago);
}

export function clearDateFmt() {
    _dateFormaters = [];
}

export function createDateUnFormatter(mask, time?) {
    const defWithTime = mask === "default"; // assume that here we create default date time handler

    if (defWithTime)
        mask = dateFmt.defaultDateTime;
    else {
        mask = mask ? String(dateFmt[mask] || mask) : undefined;
        if (Types.isNullOrUndefined(mask))
            mask = dateFmt.defaultDate;
    }

    function unformat(value) {
        if (Types.isEmpty(value))
            return null;
        return getDateFromFormat(value, mask, defWithTime, time);
    }
    return unformat;
}

export function createOverdueFormater(mask?) {
    return overdueFmt;
}

export function createTimeDifFormater(mask?) {
    return timeDifFormater;
}

function getArrOf(items: string[]) {
    return "[" + items.map((item) => `'${item}'`).join() + "]";
}

export function createDateFormater(mask) {
    const isDefault = (Types.isNullOrUndefined(mask) || mask === "default"); // assume that here we create default dime time handler
    mask = String(dateFmt[mask] || mask);
    const nm = isDefault ? "default" : mask;

    if (_dateFormaters.hasOwnProperty(nm))
        return _dateFormaters[nm];

    let _d = false;
    let _m = false;
    let _h12 = false;
    let _h = false;
    let _mi = false;
    let _min = false;
    let _s = false;
    let _ss = false;
    let _dw = false;
    let _y = false;

    function rDateParts($0) {
        let $s = null;
        switch ($0) {
            case "d": $s = " d "; _d = true; break;
            case "dd": $s = " value.substr(6,2)  "; _d = true; break;
            case "ddd": $s = " dayNamesShort[dw] "; _dw = true; break;
            case "dddd": $s = " dayNamesLong[dw] "; _dw = true; break;
            case "M": $s = " m "; _m = true; break;
            case "MM": $s = " value.substr(4,2) "; _m = true; break;
            case "MMM": $s = " monthNamesShort[m-1] "; _m = true; break;
            case "MMMM": $s = " monthNamesLong[m-1] "; _m = true; break;
            case "yy": $s = " value.substr(2,2) "; break;
            case "yyyy": $s = " value.substr(0,4) "; break;
            case "h": $s = " h12 "; _h12 = true; break;
            case "hh": $s = " (h12 < 10 ? '0'+_h12 : _h12) "; _h12 = true; break;
            case "H": $s = " h "; _h = true; break;
            case "HH": $s = " (h < 10 ? '0'+h : h) "; _h = true; break;
            case "m": $s = " mi "; _mi = true; break;
            case "mm": $s = " min "; _min = true; break;
            case "s": $s = " s "; _s = true; break;
            case "ss": $s = " ss"; _ss = true; break;
            //                    case "l"    : $s = Fmt.lPad0(L, 3); break;
            //                    case "L"    : $s = Fmt.lPad0(L > 99 ? Math.round(L / 10) : L); break;
            case "t": $s = " (h < 12 ? 'a'  : 'p') "; _h = true; break;
            case "tt": $s = " (h < 12 ? 'am'  : 'pm') "; _h = true; break;
            case "T": $s = " (h < 12 ? 'A'  : 'P') "; _h = true; break;
            case "TT": $s = " (h < 12 ? 'AM'  : 'PM') "; _h = true; break;
            // tslint:disable-next-line:max-line-length
            //                    case "Z"    : $s = utc ? "UTC" : (String(date).match(_dateFmt.timezone) || [""]).pop().replace(_dateFmt.timezoneClip, ""); break;
            //                    case "o"    : $s = (o > 0 ? "-" : "+") + Fmt.lPad0(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4); break;
            //                    case "S"    : $s = ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]; break;
        }
        if (_dw) {
            _d = true; _m = true; _y = true;
        }
        return $s === null ? $0.slice(1, $0.length - 1) : "'+" + $s + "+'";
    }

    function calcR(sDt, sDtMin?, sD?) {
        return "{ if(value == null) return null;\n" +
            " var dayNamesShot = " + getArrOf(FCultures.dayNamesShort) + ";\n" +
            " var dayNamesLong = " + getArrOf(FCultures.dayNamesLong) + ";\n" +
            " var monthNamesShort = " + getArrOf(FCultures.monthNamesShort) + ";\n" +
            " var monthNamesLong = " + getArrOf(FCultures.monthNamesLong) + ";\n" +
            " if(!value.substr) value = value.toString();\n" +
            (_y ? " var y = parseInt(value.substr(0,4));\n" : "") +
            (_d ? " var d = parseInt(value.substr(6,2));\n" : "") +
            (_m ? " var m = parseInt(value.substr(4,2));\n" : "") +
            (_dw ? " var dw = (new Date(y, m-1, d)).getDay();\n" : "") +
            (sD ? " if(value.length <= 8) return '" + sD + "';\n" : "") +
            (_h || _h12 ? " var h = parseInt(value.substr(" + (_d ? "8" : "0") + ",2)||'0');\n" : "") +
            (_h12 ? " var h12 = h%12||12;\n" : "") +
            (_mi || _min ? " var mi = parseInt(value.substr(" + (_d ? "10" : "2") + ",2)||'0');\n" : "") +
            (_min ? " var min = mi < 10 ? '0' + mi : mi;\n" : "") +
            (sDtMin ? " if(value.length <= 12) return '" + sDtMin + "';\n" : "") +
            (_s || _ss ? " var s = parseInt(value.substr(" + (_d ? "12" : "4") + ",2)||'0');\n" : "") +
            (_ss ? " var ss = s < 10 ? '0' + s : s;\n" : "") +
            // "Sws.C.debug('format', value, m);"+
            " return '" + sDt + "';\n}";
    }

    let s;
    if (!isDefault) {
        s = mask.replace(_dateFmt.token, rDateParts);
        s = calcR(s);
    } else {
        const sD = dateFmt.defaultDate.replace(_dateFmt.token, rDateParts);
        const sDt = dateFmt.defaultDateTime.replace(_dateFmt.token, rDateParts);
        const sDtMin = dateFmt.defaultDateTimeMin.replace(_dateFmt.token, rDateParts);
        s = calcR(sDt, sDtMin, sD);
    }

    const f = new Function("value", s);
    _dateFormaters[nm] = f;
    return f;
}
