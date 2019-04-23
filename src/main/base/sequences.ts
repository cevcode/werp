import * as Fmt from "./formatting";
import * as Strings from "./str-extension";

// tslint:disable-next-line:variable-name
let __c = 1;
// tslint:disable-next-line:variable-name
const __start = Date.now().toString(32) + "-";

export function getUid() {
    __c++;
    return __start + __c.toString(32);
}

export function setUid(entity) {
    entity.__Uid = getUid();
}

export function sameUid(object1, object2) {
    const u1 = object1 ? object1.__Uid : undefined;
    const u2 = object2 ? object2.__Uid : undefined;
    return u1 === u2;
}

export function getNextName(names, formatName) {
    let num = 0;
    let name;

    if (formatName && !Strings.endWith(formatName, "{0}"))
        formatName += "{0}";

    while (true) {
        name = formatName ? Fmt.format(formatName, num ? num : "") : num;
        if (!names.includes(name))
            return name;
        num++;
    }
}
