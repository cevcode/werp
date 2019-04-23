import getHash from "main/base/obj-hash";

declare var ActiveXObject: any;

function getNewRequest() {
    return "undefined" !== typeof (XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Msxml2.XMLHTTP");
}

function copyProps(source) {
    // tslint:disable-next-line:triple-equals
    if (source == undefined) return undefined;
    const res = {};
    for (const prop in source)
        if (source.hasOwnProperty(prop) && source[prop] !== undefined)
            res[prop] = source[prop];
    return res;
}

const _metadataUrl = "/";
const _methodName = "InvokeNoSession";
const _logTime = true;

function logTime(request, result, length?) {
    if (result.time == null) return;

    if (length === undefined)
        length = JSON.stringify(result).length;
    console.log("request", request, "took", result.time, length, result);
}

const request = (db, params) => {
    const xhr = getNewRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            // tslint:disable-next-line:triple-equals
            if (xhr.readyState != 4)
                return;

            switch (xhr.status) {
                case 200:
                    const value = xhr.responseText;
                    let o = JSON.parse(value);
                    if (o && o.hasOwnProperty("d"))
                        o = JSON.parse(o.d);

                    if (o) {
                        if (_logTime)
                            logTime(params, o, value.length);

                        if (o.hasOwnProperty("retval"))
                            o = o.retval;
                    }

                    if (o && o.Error)
                        reject(o.Error);
                    else
                        resolve(o);
                    break;
                case 503:
                    reject("app offline");
                    break;
                default:
                    reject(xhr.response);
                    break;
            }
        };
        let url = `${_metadataUrl}${_methodName}`;
        if (db)
            url += `?db=${db}`;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
        const res = !params ? params : "{'_params':'" + JSON.stringify(params) + "'}";
        xhr.send(res);
    });
};

interface IMethodParams {
    M: string;
    P?: any;
    S: any;
}

export class Request {
    public db: string;

    public obj: IMethodParams;

    public _hash: string;

    constructor(db: string, method: string, params?, sessionParams?) {
        this.db = db || _db;
        this.obj = { M: method, P: params, S: sessionParams  || _sessionParams};
    }

    private calcHash(): string {
        return (this.db ? this.db : "") + getHash(this.obj);
    }

    public getHash() {
        if (!this._hash)
            this._hash = this.calcHash();
        return this._hash;
    }

    public call() {
        return serverRequest(this.db, this.obj);
    }

    public getUsed() {
        return { db: this.db, params: this.obj.P, ...this.obj.S };
    }

}

type ServerConvertor<T> = (payload: any) => T;
const _requestCache = {};

export function requestWithConvert<T>(method: string, params: object, convertor: ServerConvertor<T>): Promise<T> {
    const req = new Request(null, method, params);
    const hash = req.getHash();
    if (_requestCache.hasOwnProperty(hash))
        return _requestCache[hash].promise;

    const removeFromCache = res => {
        delete _requestCache[hash];
        return res;
    };
    const promise = req.call().then(removeFromCache).then(convertor);
    _requestCache[hash] = { promise };
    return promise;
}

let _sessionParams;
let _db;

export function setDb(newDb) {
    _db = newDb;
}

export function setSessionParams(newParams) {
    _sessionParams = copyProps(newParams);
}

export const serverRequest = (db, params) => {
    if (currentBatch && currentBatch.active) {
        console.info("Use in batch");
        return currentBatch.add(db, params);
    }
    return request(db, params);
};

let currentBatch;

export const batch = (handler) => {
    const wasActive = currentBatch && currentBatch.active;
    if (wasActive)
        return handler();

    try {
        if (!currentBatch)
            currentBatch = new Batch();
        else
            currentBatch.activate();
        return handler();
    } finally {
        currentBatch.flush();
        currentBatch.deactivate();
    }
};


export class Batch {

    public requests: any[];
    public active: boolean;

    constructor() {
        this.activate();
        this.requests = undefined;
    }

    public activate() {
        // console.info("activate");
        this.active = true;
    }

    public deactivate() {
        // console.info("deactivate");
        this.active = false;
    }

    public add(db, params) {

        const request = {
            db,
            params,
            resolve: undefined,
            reject: undefined,
        };

        if (this.requests === undefined)
            this.requests = [request];
        else
            this.requests.push(request);

        return new Promise( (resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
        });
    }

    public call() {
        const {db, params: {S} } = this.requests[0];
        const result: IMethodParams = {
            M: "batch",
            P: {
                batch: this.requests.map(req => {
                    const {M, P} = req.params;
                    return {M, P};
                })
            },
            S
        };
        return request(db, result);
    }

    public mapReq2Results(data, requests) {
        for (let i = 0; i < data.length; i++) {
            const r = requests[i];
            const v = data[i];
            if (_logTime)
                logTime(r.params, v);

            if (v.Error)
                r.reject(v.Error);
            else
                r.resolve(v.retval);
        }
    }

    public flush() {
        const requests = this.requests;
        if (!requests || requests.length === 0) return;

        if (requests.length === 1) {
            const r = requests[0];
            this.requests = [];
            return request(r.db, r.params).then(data => r.resolve(data)).catch(error => r.reject(error));
        }

        this.call()
            .then(data => this.mapReq2Results(data, requests))
            .catch(error => {
                requests.forEach( req => {
                    req.reject(error);
                });
                console.info("error in batch");
            });
        this.requests = [];
    }
}
