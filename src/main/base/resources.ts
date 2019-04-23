import * as Ex from "./exceptions";
import * as Types from "./types-utils";

export const R2 = (uiRes, resName) => {
    return uiRes && uiRes[resName] || _defaults[resName] || "UNKNOWN";
};

const _defaults = {};

export const DEF = (name, value) => {
    _defaults[name] = value;
    return name;
};

export const resMethods = {
    getResource: undefined,
};

export const R = (resName) => resMethods.getResource ? resMethods.getResource(resName) : resName;

export function registerResGroup(id, caption, icon, tooltip) {
    if (Types.isEmpty(id))
        Ex.raiseError("Resgroup Id is empty");

    const grp = { caption, icon, tooltip };
    resGroup[id] = grp;
    return grp;
}

export function registerResGrpRoot(id, rootRes, icon) {
    if (Types.isEmpty(id))
        Ex.raiseError("Resgroup Id is empty");
    if (Types.isEmpty(rootRes))
        Ex.raiseError("Resgroup root is empty");

    const grp = { caption: rootRes.Caption, icon, tooltip: rootRes.Tooltip };
    resGroup[id] = grp;
    return grp;
}

export function addResGrp(root, name, caption, tooltip) {
    if (!root[name])
        root[name] = {};

    const r = root[name];
    r.Caption = caption;
    r.Tooltip = tooltip;
    return r;
}

export function getResGroup(id) {
    if (Types.isEmpty(id))
        Ex.raiseError("Resgroup Id is empty");

    const r = resGroup[id];
    if (!r)
        Ex.raiseErrorFmt("Resource with id='{0}' not found", id);
    return r;
}

const resGroup = {};
