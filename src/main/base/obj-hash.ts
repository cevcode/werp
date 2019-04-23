import * as Strings from "./str-extension";
import * as Types from "./types-utils";

type HashFunc = (o: string) => string;

let hashFunc: HashFunc = (o) => o;

export function setHashFunc(f: HashFunc) {
    hashFunc = f;
}

export function getHash(obj, all?): string {
    const t = Types.getBaseType(obj);
    switch (t) {
        case "string":
            return hashFunc(obj);
        case "function":
            return hashFunc(obj.toString());
        case "number":
        case "date":
        case "boolean":
            return obj.toString();
        case "null":
        case "undefined":
            return t;
    }

    return hashFunc(stringHash(obj, all));
}

export function stringHash(obj, all?, objects?) {
    let s;
    let value;
    const splitter = ",";
    const equalSign = ":";
    let o;
    const t = Types.getBaseType(obj);
    switch (t) {
        case "string":
            return obj;
        case "number":
        case "date":
        case "boolean":
            return obj.toString();
        case "array":
            const len = obj.length;

            if (objects)
                objects.push(obj);
            else
                objects = [obj];

            for (let i = 0; i < len; i++) {
                o = obj[i];
                value = objects.indexOf(o) > -1 ? "<loop>" : stringHash(o, all, objects);
                s = s === undefined ? value : s + splitter + value;
            }
            return "[" + s + "]";
        case "function":
            return t;
        case "null":
        case "undefined":
            return obj;
    }

    if (Types.isMethod(obj.getHashObj)) {
        value = obj.getHashObj();
        return "{" + stringHash(value) + "}";
    }

    if (obj.hasOwnProperty("innerHTML"))
        return obj.innerHTML;

    if (objects)
        objects.push(obj);
    else
        objects = [obj];

    for (const cd in obj) {
        if (!obj.hasOwnProperty(cd))
            continue;
        if (!all && Strings.startWith(cd, "_"))
            continue;

        o = obj[cd];
        value = cd + equalSign + (objects.indexOf(o) > -1 ? "<loop>" : stringHash(o, all, objects));
        s = s === undefined ? value : s + splitter + value;
    }
    return s === undefined ? "{}" : "{" + s + "}";
}

export const objectHash = stringHash;

export default getHash;
