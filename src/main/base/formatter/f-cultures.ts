import * as DT from "../date-extension";
import * as FmtDate from "./format-date";
import * as Types from "../types-utils";

// tslint:disable:object-literal-sort-keys
export let dateFmt = {
    default: null, // special assumed use defaultDateTime if there is time fraction, or use defaultDate if only date specified
    defaultMonth: "MMM-yyyy",
    defaultDateTime: "dd-MMM-yyyy HH:mm:ss",
    defaultDateTimeMin: "dd-MMM-yyyy HH:mm",
    defaultDate: "dd-MMM-yyyy",
    defaultTime: "HH:mm:ss",
    shortDate: "M/d/yy",
    swsShortDate: "yyMMdd",
    mediumDate: "MMM d, yyyy",
    longDate: "MMMM d, yyyy",
    fullDate: "dddd, MMMM d, yyyy",
    fullDateShortMonth: "ddd, MMM d, yyyy",
    fullDateNoDay: "MMMM d, yyyy",
    weekDayShortDate: "dddd, MMM d",
    shortTime: "h:mm TT",
    monthDay: "MMMM dd",
    shortMonthDay: "dd MMM",
    mediumTime: "h:mm:ss TT",
    longTime: "h:mm:ss TT Z",
    weekDay: "dddd",
    monthYear: "MMMM, yyyy",
    day: "dd",
};
// tslint:enable:object-literal-sort-keys

export let dayNamesShort = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"];

export let dayNamesLong = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"];

export let monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"];

export let monthNamesLong = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"];

export let is24Hrs = true;
export let firstDayOfWeek;
export let firstDayOfWorkWeek;

export function applyCultureFmt(culture) {
    if (Types.isNullOrUndefined(culture)) return;

    dateFmt.longDate = culture.longDateFmt;
    dateFmt.shortDate = culture.shortDateFmt;
    dateFmt.fullDate = culture.fullDateFmt;
    dateFmt.shortTime = culture.shortTimeFmt;

    dateFmt.defaultMonth = culture.yearMonthFmt;
    dateFmt.defaultDate = culture.shortDateFmt;
    dateFmt.defaultTime = culture.shortTimeFmt;
    dateFmt.defaultDateTime = culture.dateTimeFmt;
    dateFmt.defaultDateTimeMin = culture.dateTimeFmt;
    dateFmt.monthDay = culture.monthDay;
    dateFmt.fullDateNoDay = culture.fullDateNoDay || culture.longDateFmt.replace(/(d{4}([\s,])*)/g, "");

    dayNamesShort = culture.shortDayNames;
    dayNamesLong = culture.dayNames;
    monthNamesShort = culture.shortMonthNames;
    monthNamesLong = culture.monthNames;
    is24Hrs = culture.is24Hrs;
    firstDayOfWeek = culture.firstDayOfWeek;
    firstDayOfWorkWeek = culture.firstDayOfWorkWeek;
    DT.setFirstDayOfWeek(culture.firstDayOfWeek);
    FmtDate.clearDateFmt();
}
