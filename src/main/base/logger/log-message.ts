import * as DT from "../date-extension";
import * as FnExt from "../func-extension";

export default class LogMessage {
    public id;
    public time;
    public severity;
    public message;
    public details;
    public severityId;
    public source;

    constructor(id, severity, message, details, source) {
        this.id = id;
        this.time = DT.toSwsDateTime(new Date());
        this.severity = severity;
        this.message = message;
        this.details = details;
        this.severityId = "MSG_LOG";
        this.source = source;
    }

    public showAlertInLogger() {
        return FnExt.callByName(this.source, "showAlertInLogger") !== false;
    }
}
