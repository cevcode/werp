import * as C from "../console";
import * as Fmt from "../formatting";
import LogMessage from "./log-message";
import * as Types from "../types-utils";

import { DEF, R } from "../resources";

export const _res = {
    NoMessageToLog: DEF("Log.NoMessageToLog", "Log message has not been provided!!!"),
};

const _level = {
    DEBUG: "LOG_DEBUG",
    ERR: "LOG_ERR",
    EXEC: "LOG_EXEC",
    INFO: "LOG_INFO",
    NOTICE: "LOG_NOTICE",
    SAVE: "LOG_SAVE",
    WARN: "LOG_WARN",
};

export class Logger {
    public $OnLogged;
    public _defLifetime;
    public level;

    constructor() {
        // this.$OnLogged = new SyncHandler(this, "onLogged");
        this._defLifetime = 1e4;
        this.level = _level;
    }

    public getLog(level) {
        return level ? logList[level] : logList;
    }

    public clearLog(level) {
        if (!level)
            logList = {};
        else
            delete logList[level];
        this.raiseOnLogged(level);
    }

    /**
     * @param {String} msg
     * @param {String} details
     */
    public notice(msg, details) {
        this.pushMessage(_level.NOTICE, msg, details);
        C.log(msg, details);
    }

    public info(msg, details) {
        this.pushMessage(_level.INFO, msg, details);
        C.log(msg, details);
    }

    public infoFmt(msg, details, ...params) {
        const dd = details ? Fmt.format(details, ...params) : details;
        return this.info(msg, dd);
    }

    public save(msg, details, source) {
        this.pushMessage(_level.SAVE, msg, details, source);
        C.info(msg, details, source);
    }

    public exec(msg, details, source) {
        this.pushMessage(_level.EXEC, msg, details, source);
        C.info(msg, details, source);
    }

    public exception(ex) {
        const msg = "Exception: " + (Types.isString(ex) ? ex : ex.message);
        const details = ex.stack;
        this.pushMessage(_level.ERR, msg, details);
        C.error(msg, ex.stack);
    }

    public error(msg, details?, source?) {
        this.pushMessage(_level.ERR, msg, details, source);
        C.error(msg, details, source);
    }

    public errorFmt(msg, details, ...params) {
        const dd = details ? Fmt.format(details, ...params) : details;
        return this.error(msg, dd);
    }

    public warn(msg, details, source?) {
        this.pushMessage(_level.WARN, msg, details, source);
        C.warn(msg, details, source);
    }

    public warnFmt(msg, details, ...params) {
        const dd = details ? Fmt.format(details, ...params) : details;
        return this.warn(msg, dd);
    }

    private raiseOnLogged(l, logItem?) {
        // this.$OnLogged.trigger(l, logItem);
    }

    /**
     * @param {String} severity
     * @param {String} message
     * @param {String} details
     * @param {Error} [source] exception to be thrown
     */
    private pushMessage(severity, message, details, source?) {
        message = message || R(_res.NoMessageToLog);
        details = details || "";
        severity = severity || _level.WARN;

        let l = logList[severity];
        if (Types.isEmpty(l))
            logList[severity] = l = [];
        const rec = new LogMessage(l.length, severity, message, details, source);
        l.push(rec);
        this.raiseOnLogged(severity, rec);
    }
}

let logList = {};

const LOG = new Logger();
export default LOG;
