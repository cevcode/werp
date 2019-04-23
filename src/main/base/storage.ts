import * as Exc from "./exceptions";
import * as Json from "./json-utils";
import * as TypesUtils from "./types-utils";

function setEncrypted(cd, value) {
    Exc.raiseErrorIf(!encrypt, "Storage encrypt not defined");
    if (TypesUtils.isNullOrUndefined(value))
        return setItem(cd, value);
    const enc = encrypt(value);
    return setItem(cd, enc);
}

function getEncrypted(cd) {
    Exc.raiseErrorIf(!decrypt, "Storage encrypt not defined");
    const v = getItem(cd);
    if (TypesUtils.isNullOrUndefined(v)) return undefined;
    return decrypt(v);
}

//#endregion

//#region folder settings
function getUserFolderSettingNm(db, userId, folderCd, cd) {
    return "f " + db + "#" + userId + "#" + folderCd + "#" + cd;
}

//#endregion

//#region per user settings
function getUserSettingNm(db, userId, cd) {
    return "u " + db + "#" + userId + "#" + cd;
}

//#endregion

//#region per db settings
function getDbSettingNm(db, cd) {
    return "d " + db + "#" + cd;
}

export function getDbValueInt(db, cd) {
    const path = getDbSettingNm(db, cd);
    return getItem(path);
}

export function setDbValueInt(db, cd, value) {
    const path = getDbSettingNm(db, cd);
    return setItem(path, value);
}

//#endregion

export let encrypt;
export let decrypt;

const getCleanArray = (source) => source && source.filter ? source.filter((x) => x != null) : [];

/**
 * @param {String} name
 * @param fromSessionStorage
 * @returns {String|null}
 */
export function getItem(name, fromSessionStorage?) {
    const st = fromSessionStorage ? sessionStorage : localStorage;
    const v = st.getItem(name);
    return v === "null" || v === "undefined" ? null : v;
}

export function getNumber(name, fromSessionStorage?) {
    const st = fromSessionStorage ? sessionStorage : localStorage;
    const v = st.getItem(name);
    return v === "null" || v === "undefined" ? null : Number(v);
}

/**
 * @param {String} name
 * @param {String|number|undefined|null} value
 * @param {Boolean} [toSessionStorage]
 */
export function setItem(name, value, toSessionStorage?) {
    const st = toSessionStorage ? sessionStorage : localStorage;
    if (TypesUtils.isNullOrUndefined(value))
        st.removeItem(name);
    else
        st.setItem(name, value);
}

export function getDebug(name) {
    return !!getItem("debug-" + name, true);
}

export function setDebug(name, value) {
    setItem("debug-" + name, value, true);
}

export function getUserValue(db, userId, cd) {
    const path = getUserSettingNm(db, userId, cd);
    return getItem(path);
}

export function setUserValue(db, userId, cd, value) {
    const path = getUserSettingNm(db, userId, cd);
    return setItem(path, value);
}

export function getDbValue(db, cd) {
    return getDbValueInt(db, cd);
}

export function setDbValue(db, cd, value) {
    return setDbValueInt(db, cd, value);
}

export function setUserFolderValue(db, userId, folderCd, cd, value, toSessionStorage) {
    const path = getUserFolderSettingNm(db, userId, folderCd, cd);
    return setItem(path, value, toSessionStorage);
}

export function getUserFolderValue(db, userId, folderCd, cd, fromSessionStorage) {
    const path = getUserFolderSettingNm(db, userId, folderCd, cd);
    return getItem(path, fromSessionStorage);
}

export function getDatabases() {
    const db = getItem("Databases");
    return TypesUtils.isEmpty(db) ? [] : db.split(",");
}

export function setDatabases(db) {
    setItem("Databases", db);
}

export function setDatabase(database) {
    const db = getDatabases();
    if (db.some((v) => v === database))
        return;
    db.unshift(database);
    setDatabases(db);
}

export function getLastShownVer(db, userId) {
    return getUserValue(db, userId, "LastVer");
}

export function setLastShownVer(db, userId, ver) {
    setUserValue(db, userId, "LastVer", ver);
}

//#region user names
function getPwdName(db, user) {
    return `PWD@${db}@${user}`;
}

export function getUsernames() {
    const uNames = Json.decode(getItem("Usernames"));
    return TypesUtils.isEmpty(uNames) ? [] : uNames;
}

export function setUsernames(names) {
    setItem("Usernames", Json.encode(names));
}

export function getDbUsernames(db) {
    const uNames = getUsernames();
    return TypesUtils.isEmpty(uNames) ? [] : (TypesUtils.isEmpty(uNames[db]) ? [] : uNames[db]);
}

export function getDbUserCd(db) {
    return getDbValueInt(db, "UserCd");
}
//#endregion

export function saveDbUserPwd(db, user, pwd) {
    setDbValueInt(db, "UserCd", user);
    if (encrypt)
        setEncrypted(getPwdName(db, user), pwd);
    // setItem(getPwdName(db, user), pwd);
}

export function getDbUserPwd(db, user) {
    if (decrypt)
        return getEncrypted(getPwdName(db, user));
    return undefined;
}

export function setDbUsernames(db, names) {
    const uNames = getUsernames();
    uNames[db] = names;
    setUsernames(uNames);
}

export function getUserCd(db) {
    return getDbValue(db, "LastUser");
}

export function setUserCd(db, userCd) {
    setDbValueInt(db, "LastUser", userCd);
    const names = getDbUsernames(db);
    if (names.some((v) => v === userCd))
        return;
    names.unshift(userCd);
    setDbUsernames(db, names);
}

export function getLanguageId() {
    return parseInt(getItem("languageId"));
}

export function setLanguageId(value) {
    return setItem("languageId", value);
}

export function getTimeZone() {
    return getItem("timeZone");
}

export function setTimeZone(timeZone) {
    return setItem("timeZone", timeZone);
}

export function getLocalCss(db) {
    return getDbValueInt(db, "CustomCss");
}

export function setLocalCss(db, css) {
    setDbValueInt(db, "CustomCss", css);
}
