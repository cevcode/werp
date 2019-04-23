import * as FmtDate from "./format-date";
import FmtRes from "./formatter-res";

import { R } from "../resources";

export function unFormatTo(date, unformat, format) {
    const u = FmtDate.createDateUnFormatter(unformat);
    return FmtDate.swsDateTimeToString(u(date), format);
}

export function formatNumber(value) {
    return Number(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&" + (R(FmtRes.thousandsSep) || "")).split(".")[0];
}
