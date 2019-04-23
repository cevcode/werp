import * as Fmt from "./formatting";
import * as Types from "./types-utils";

let _firstDayOfWeek;

export function getFirstDayOfWeek() {
    return _firstDayOfWeek;
}

export function setFirstDayOfWeek(day: number): void {
    _firstDayOfWeek = day;
}

export function getWeekDaysCount(onlyWorkDays?: boolean): number {
    return onlyWorkDays ? 5 : 7;
}

export function getWeekDays(count?, fDayOfWeek?): number[] {
    count = Types.isNullOrUndefined(count) ? getWeekDaysCount() : count;
    const f = Types.isNullOrUndefined(fDayOfWeek) ? _firstDayOfWeek : fDayOfWeek;
    const days = [];
    for (let i = 0; i < count; i++) {
        let idx = i + f;
        if (idx >= 7)
            idx -= count;
        days.push(idx);
    }
    return days;
}

export function isWorkingDay(day: number): boolean {
    return day > 0 && day < getWeekDaysCount() - 1;
}

export function add(datepart: string, date: Date, n: number): Date {
    let y = date.getFullYear();
    let m = date.getMonth();
    let d = date.getDate();
    const h = date.getHours();
    let mi = date.getMinutes();
    const ss = date.getSeconds();

    switch (datepart) {
        case "d":
        case "dd":
            d = d + n;
            break;
        case "m":
        case "mm":
            m = m + n;
            break;
        case "yy":
        case "yyyy":
            y = y + n;
            break;
        case "mi":
            mi = mi + n;
            break;
    }
    return new Date(y, m, d, h, mi, ss);
}

export function getOnlyDate(date: Date): Date {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    return new Date(y, m, d);
}

export function cutTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function getDateOrLast(date: Date, shift: number): Date {
    const y = date.getFullYear();
    const m = date.getMonth() + shift;
    let d = date.getDate();
    const dayCount = new Date(y, m + 1, 0).getDate();
    if (dayCount < d) d = dayCount;
    return new Date(y, m, d, date.getHours(), date.getMinutes(), date.getSeconds());
}

export function getStartDate(date: Date, fDayOfWeek?) {
    fDayOfWeek = Types.isNullOrUndefined(fDayOfWeek) ? _firstDayOfWeek : fDayOfWeek;
    const first = firstDayOfMonth(date);
    let start = new Date(first.getFullYear(), first.getMonth(), first.getDate() - first.getDay() + fDayOfWeek);
    if (start > first)
        start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7);
    return start;
}

export function getFirstDateOfWeek(date: Date, fDayOfWeek?): Date {
    fDayOfWeek = Types.isNullOrUndefined(fDayOfWeek) ? _firstDayOfWeek : fDayOfWeek;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + fDayOfWeek);
}

export function lastDayOfMonth(year: number, month: number): Date {
    const d = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, d);
}

export function firstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function sameDate(date1: Date, date2: Date): boolean {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

export function sameMonth(date1: Date, date2: Date): boolean {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

export function dateDiff(date1: Date, date2: Date): number {
    const t1 = date1.getTime();
    const t2 = date2.getTime();
    return Math.round((t1 - t2) / (24 * 3600 * 1000));
}

export function dateFullDiff(date1: Date, date2: Date): object {
    const t1 = date1.getTime();
    const t2 = date2.getTime();
    const minDif = Math.round((t1 - t2) / (60 * 1000));
    const secondsDif = Math.round((t1 - t2) / 1000);
    return {
        d: Math.round(minDif / (60 * 24)),
        h: Math.round((minDif / 60) % 24),
        m: Math.round(minDif % 60),
        s: Math.round(secondsDif % 60),
    };
}

export function dateMinDiff(date1, date2) {
    const t1 = date1.getTime();
    const t2 = date2.getTime();
    return Math.round((t1 - t2) / (60 * 1000));
}

export function isToday(date: Date): boolean {
    return sameDate(new Date(), date);
}

/**
 * @param {Date} date
 */
export function toSwsDateTime(date: Date): string {
    if (!date) return undefined;
    const d = toSwsDate(date); // date.getFullYear() + Fmt.lPad0(date.getMonth()+1, 2)+ Fmt.lPad0(date.getDate(), 2);
    let h = "";
    const ss = Fmt.lPad0(date.getSeconds(), 2);
    if (ss !== "00")
        h = h + ss;
    const m = Fmt.lPad0(date.getMinutes(), 2);
    if (h.length > 0 || m !== "00")
        h = m + h;
    const hh = Fmt.lPad0(date.getHours(), 2);
    if (h.length > 0 || hh !== "00")
        h = hh + h;
    return d + h;
}

export function toSwsDate(date) {
    return date.getFullYear() + Fmt.lPad0(date.getMonth() + 1, 2) + Fmt.lPad0(date.getDate(), 2);
}

/**
 * @param {String} date in format YYYYMMDDHHMISSLL
 */
export function toDateTimeFromSwsDate(date): Date {
    if (Types.isEmpty(date)) return undefined;
    const y = parseInt(date.substr(0, 4));
    const m = parseInt(date.substr(4, 2)) - 1;
    const d = parseInt(date.substr(6, 2));
    const h = parseInt(date.substr(8, 2) || 0);
    const mi = parseInt(date.substr(10, 2) || 0);
    const s = parseInt(date.substr(12, 2) || 0);
    const l = parseInt(date.substr(14, 3) || 0);
    const res = new Date(y, m, d, h, mi, s, l);
    if (isNaN(res.valueOf())) return undefined;
    return res;
}

export function getHourFromSwsDateTime(date) {
    return Types.isEmpty(date) ? 0 : parseInt(date.substr(8, 2) || 0);
}

export function getMinutesFromSwsDateTime(time) {
    return Types.isEmpty(time) ? 0 : parseInt(time.substr(10, 2) || 0);
}

export function getMinutesFromSwsTime(time) {
    return Types.isEmpty(time) ? 0 : parseInt(time.substr(2, 2) || 0);
}

export function getSecondsFromSwsTime(time) {
    return Types.isEmpty(time) ? 0 : parseInt(time.substr(4, 2) || 0);
}

/**
 * returns am or pm for hour
 * @param {int} hour
 * @returns {String}
 */
export function hourGetAmPm(hour) {
    return hour < 12 ? "am" : "pm";
}

export function getMeridianFromSwsFormat(time) {
    const h = getHourFromSwsTime(time);
    return hourGetAmPm(h);
}

export function getMonthFromSwsFormat(date) {
    return Fmt.lPad0(date.substr(0, 6), 6);
}

export function getDateFromSwsFormat(date) {
    return Fmt.lPad0(date.substr(0, 8), 8);
}

export function getDateHourFromSwsFormat(date) {
    return Fmt.lPad0(date.substr(0, 10), 10);
}

export function getTimeFromSwsFormat(date) {
    return Types.isEmpty(date) ? "" : date.substr(8);
}

export function getHourFromSwsTime(time, fmt?) {
    const ampm = fmt && (fmt.contains("t") || fmt.contains("T"));
    const h = Types.isEmpty(time) ? 0 : parseInt(time.substr(0, 2) || 0);
    return ampm ? h % 12 || 12 : h;
}
