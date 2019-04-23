import * as ArrExt from "../arr-extension";
import createCachedObject from "../cached-value";
import * as C from "../console";
import * as Ex from "../exceptions";
import * as Fmt from "../formatting";
import * as FnExt from "../func-extension";
import SyncHandler from "../handlers/sync-handler";
import LOG from "../logger/logger";
import * as LV from "../lvalue";
import { _res as ColumnRes, BaseColumn } from "./base-column";
import * as CellOp from "./cell-options";
import * as Const from "./const";
import * as ObjExt from "../obj-extension";
import * as ObjHash from "../obj-hash";
import * as Strings from "../str-extension";
import * as Types from "../types-utils";
import * as Utils from "../utils";

import { DEF, R } from "../resources";

export const _res = {
    ColumnNotFound: DEF("Record.ColumnNotFound", "Column [{0}] not found"),
    EmptyTostringFmt: DEF("Record.EmptyTostringFmt", "<Unknown>"),
    NewRecordFmt: DEF("Record.NewRecordFmt", "<New record>"),
    NoEntityForRecord: DEF("Record.NoEntityForRecord", "Record without entity"),
    NotRef: DEF("Record.NotRef", "Column [{0}] is not reference in entity {1}, can't get dataset for it."),
    NotSet: DEF("Record.NotSet", "Column [{0}] is not set in entity {1}, can't get dataset for it."),
    RefRecordNotFound: DEF("Record.RefRecordNotFound", "Ref record not found"),
    RefRecordNotFoundDetails: DEF("Record.RefRecordNotFoundDetails", "{0} with key {1}"),
};

export let dataset;
export let memoryDs;

/**
 * @param {CellOptions} source
 * @param {CellOptions} [prevOptionsObj]
 * @returns {CellOptions}
 */
function cloneOptions(source: CellOp.CellOptions, prevOptionsObj?: CellOp.CellOptions): CellOp.CellOptions {
    if (Types.isNullOrUndefined(source)) return null;
    // if(Types.isEmptySwsValue(source)) return null;
    if (prevOptionsObj)
        return prevOptionsObj.clone(source);
    return new CellOp.CellOptions().clone(source);
}

function createRefDs(rec, columnCd, columnMd) {
    // const ref = Sws.dataset.createRef(rec, columnMd);
    // const entityCd = columnMd.getRefEntity();
    // return Sws.dataset.create(entityCd, ref).setCacheRecordKeys();
}

// region stacked changes
function stackPushChange(rec, columnCd) {
    if (rec._stackChanges === undefined)
        rec._stackChanges = [columnCd];
    else
        rec._stackChanges.push(columnCd);
}

function stackPopChange(rec) {
    if (rec._stackChanges === undefined)
        return undefined;
    return rec._stackChanges.pop();
}

function setValueWithPopChange(rec, columnCd, value) {
    rec.setValue(columnCd, value);
    return stackPopChange(rec);
}

function inStacked(rec, columnCd) {
    return rec._stackChanges !== undefined && rec._stackChanges.indexOf(columnCd) > -1;
}
// endregion

// region update empty refs
function updateRefNotEmptyValue(rec, columnCd, columnMd, newValue) {
    const isRec = ObjExt.checkPrototype(newValue, Record.prototype);
    if (!isRec)
        return Ex.raiseErrorFmt("Try to set reference {0} not record value {1}", columnCd, newValue);

    const thisKey = columnMd.getThisKey();
    const otherKey = columnMd.getOtherKey();

    stackPushChange(rec, columnCd);
    otherKey.forEach((key, i) => {
        const value = newValue.get(key);
        rec.set(thisKey[i], value);
    });
    return setValueWithPopChange(rec, columnCd, newValue.toString());
}

function updateRefEmptyValue(rec, columnCd, columnMd) {
    const thisKey = columnMd.getThisKey();

    stackPushChange(rec, columnCd);
    thisKey.forEach((key, i) => {
        if (columnMd.needClearOnEmpty(key))
            rec.set(key, null);
        else
            C.info("No need to clean", key, "when reset", columnCd);
    });
    return setValueWithPopChange(rec, columnCd, null);
}

function updateParentRefEmptyValue(rec, columnCd, columnMd) {
    const thisKey = columnMd.getThisKey();
    // var otherKey = columnMd.getOtherKey();

    const pk = rec._entity.getKeys();
    // todo: strange logic here, need to avoid this removedK var
    const removedK = thisKey.map((key, i) => {
        return pk.indexOf(key) > -1 ? i : undefined;
    });

    stackPushChange(rec, columnCd);
    thisKey.forEach((key, i) => {
        if (removedK && removedK.hasOwnProperty(i))
            return;
        rec.set(key, null);
    });
    return setValueWithPopChange(rec, columnCd, null);
}
// endregion

function updateDeps(rec, dep, callback, columnCd?) {
    if (Types.isEmpty(dep))
        return FnExt.sCallReturnNull(rec, callback);

    const entity = rec._entity;
    const locks = rec._lockedDep;
    const locked = locks !== undefined && locks !== dep;
    if (locked) {
        // C.warn("Proceed locked save");
        dep.forEach((item) => {
            if (locks.indexOf(item) === -1)
                locks.push(item);
        });
        return;
    }

    if (columnCd)
        stackPushChange(rec, columnCd);

    dep.forEach((f) => {
        // if(f === columnCd) return;
        if (!entity.hasColumn(f))
            return;

        if (inStacked(rec, f))
            return;

        C.info("need update", f);

        FnExt.callByName(rec, "updateValueFromFormula", f);
        rec.clearCachedValueAndRefs(f);
        const field = entity.getColumn(f);
        if (field.isRef()) {
            const ds = rec.getRefDataset(field);
            // rec.updateColumn(f);
            return;
        }

        if (field.isSet() || rec.updateFValue(f))
            rec.raiseRefreshColumn(null, f);
        // var o = entity.getOptions(f, rec);
        // ds.setColumnFilter(o.colFilter);
    });
    FnExt.safeCall(rec, callback);
    if (columnCd)
        stackPopChange(rec);
}

export class Record {
    public _source;
    public _value;
    public _pk;
    public _sourcePk;

    public _entity;
    public _dataset;
    public _parentRecord;

    public _valErrors;
    public _calcs;
    public _entityCd;
    // tslint:disable-next-line:variable-name
    public __toString;
    public _isDb;
    public _dataSets;

    public _isDeleted;
    public _isCopied;
    public _canceled;

    public _subRecord;
    public _sets;
    public _refs;
    public _stringPk;
    public _refPks;
    public _refPksEncoded;
    public _newWithDetails;
    public $Changed;
    public $NeedRefreshColumn;
    public $OptionsChanged;
    public $StyleChanged;

    public _noValidateEmpty;
    public _lValues;
    public _pendingRefs;
    public _fValues;
    public _tValues;
    public _cValues;
    public _cachedListOfValues;
    public _links;

    public _inPropChanged;
    public _roOptions;
    public _rwOptions;

    private _lockedDep;
    private _reqKeys;

    constructor(entity, source?, newValues?, owner?, newWithDetails?) {
        if (!entity)
            Ex.raiseErrorR(_res.NoEntityForRecord);
        this._source = source;
        this._entity = entity;
        this._value = newValues;
        this._calcs = createCachedObject(); // {};
        this._dataSets = {};
        /** @type {Dataset} */
        this._dataset = undefined;
        this._entityCd = entity.getEntityCd();
        this.__toString = undefined;
        this._isDeleted = false;
        this._isCopied = !!newValues && owner;
        this._isDb = !!entity.getPk;
        this._subRecord = undefined;
        this._parentRecord = undefined;
        this._canceled = false;
        this._sets = undefined;
        this._noValidateEmpty = !FnExt.callByName(entity, "needValidateEmpty");
        this._lValues = createCachedObject(); // {};
        this._refs = createCachedObject(); // {};
        this._pendingRefs = {};
        this._fValues = createCachedObject(); // {};
        this._tValues = createCachedObject(); // {};
        this._cValues = createCachedObject(source); // {};
        this._links = createCachedObject(); // {};

        this._sourcePk = FnExt.callByName(owner, "getPk");
        this._inPropChanged = false;

        // region cached options
        this._roOptions = {};
        this._rwOptions = {};
        // endregion

        this._refPks = createCachedObject(); // {};
        this._refPksEncoded = createCachedObject(); // {};

        // TODO: get CreateWithDetails application setting
        // this._newWithDetails = Types.isNullOrUndefined(newWithDetails) ? SETTINGS.getBool("CreateWithDetails") : newWithDetails;

        this.$Changed = new SyncHandler(this, "onChanged");
        this.$NeedRefreshColumn = new SyncHandler(this, "needRefreshColumn");
        this.$OptionsChanged = new SyncHandler(this, "OptionsChanged");
        this.$StyleChanged = new SyncHandler(this, "StyleChanged");
        if (source)
            this.updateCalcs();
    }

    public initFromObject(object) {
        this.applyDefaults(undefined);
        this._source = ObjExt.objectCopy(object);
        return this;
    }

    public valueFromObject(object: any): Record {
        this.clearCache();
        this._value = ObjExt.objectCopy(object);
        return this;
    }

    public getHashObj() {
        return {
            e: this._entityCd,
            v: this.getAsObject(),
        };
    }
    public getUpdatable() {
        const r = {};
        this._entity.eachUpdatableColumn((cd, columnMd) => {
            if (cd === Const.toStringColumn) return;
            const value = this.getDeserialized(cd);
            if (Types.isEmpty(value)) return;
            r[cd] = value;
        });
        return r;
    }
    public getAsObject(onlyVisible?) {
        return ObjExt.objectCopy(this._entity.getColumns(), (cd, columnMd) => {
            if (cd === Const.toStringColumn) return undefined;
            if (onlyVisible && !columnMd.isVisible()) return undefined;
            const value = this.getDeserialized(cd);
            return Types.isEmpty(value) ? undefined : value;
        });
    }
    public update(data) {
        const s = data && !Types.isNullOrUndefined(data.source) ? data.source : data;
        const source = Types.isArray(s) ? s[0] : s;
        if (this.isInserted()) {
            if (Types.isNullOrUndefined(source)) {
                this._source = this._value;
                this.clearCache();
                return;
            }
        }

        if (C.check(source, "Source not defined for record in update"))
            return;
        this._source = source;
        this.clearCache();
        this.raiseColumnChanged(undefined, undefined);
        this.markChangesInDs();
    }
    public lockDependencies() {
        if (this._lockedDep !== undefined)
            return false;

        this._lockedDep = [];
        C.info("LOCK record", this);
        return true;
    }
    public unlockDependencies(callback?) {
        if (this._lockedDep === undefined)
            return;
        if (this._lockedDep.length) {
            C.info("UNLOCK record", this);
            updateDeps(this, this._lockedDep, callback);
        }
        this._lockedDep = undefined;
    }
    public updateColumn(columnCd, callback?) {
        const col = this._entity.getColumn(columnCd);
        const dep = FnExt.callByName(col, "getDependencies");

        C.info("update column:", columnCd, "value:", this.get(columnCd));

        const updateDep = () => {
            updateDeps(this, dep, callback, columnCd);
        };

        if (col.isField() || col.isSet())
            return updateDep();

        if (col.isRef()) {
            if (this._refs.hasCachedValue(columnCd))
                return updateDep();

            this.getRefDataset(col, updateDep);
        } else if (col.isCalc())
            return; // todo: update calculated field
    }
    public getEntity() {
        return this._entity;
    }

    public onEntityReady(callback) {
        this._entity.onEntityReady(callback);
    }

    public getEntityCd() {
        return this._entityCd;
    }

    public getSource(columnCd) {
        return this._source && this._source.hasOwnProperty(columnCd) ? this._source[columnCd] : undefined;
    }

    private getValue_l(columnCd, noRaise) {
        if (columnCd === Const.toStringColumn)
            return this.toString();
        const v = this._calcs.getCachedValue(columnCd);
        if (v !== undefined)
            return v;
        // if(this._calcs.hasOwnProperty(columnCd))
        //     return this._calcs[columnCd];
        if (this._value && this._value.hasOwnProperty(columnCd))
            return this._value[columnCd];
        if (this._source && this._source.hasOwnProperty(columnCd))
            return this._source[columnCd];
        if (this._entity.hasColumn(columnCd))
            return null;

        const msg = Fmt.formatR(ColumnRes.NoField, columnCd, this._entity._entityCd);
        if (!noRaise)
            LOG.error(msg);
        else
            throw new Error(msg);
    }
    /**
     * @param {String} columnCd
     * @returns {*} value of columnCd, or throws exception if property not defined in entity
     */
    public get(columnCd, withSub?, noRaise?) {
        if (withSub && this._dataset.withSubType()) {
            if (this._subRecord)
                return this._subRecord.get(columnCd, undefined, noRaise);
            return undefined; // not yet loaded so we do not know value yet
        }

        if (Const.isThisColumn(columnCd))
            return this;

        let v = this._cValues.getCachedValue(columnCd);
        if (v !== undefined)
            return v;
        // if(this._cValues.hasOwnProperty(columnCd))
        //     return this._cValues[columnCd];

        v = this.getValue_l(columnCd, noRaise);
        this._cValues.setCachedValue(columnCd, v);
        return v;
    }

    public getEncoded(columnCd) {
        if (columnCd === Const.toStringColumn) return this.getStringPk();
        const col = this._entity.getColumn(columnCd);
        return col.isRef() ? this.getRefStringPk(columnCd) : ObjHash.objectHash(this.get(columnCd));
    }

    public clearCache() {
        this._value = null;
        this._valErrors = undefined;
        this._pk = undefined;
        this._stringPk = undefined;
        this._fValues.clearAll(); // this._fValues = {};
        this._tValues.clearAll(); // this._tValues = {};
        this._refPksEncoded.clearAll(); // this._refPksEncoded = {};
        this._refPks.clearAll();

        this._cValues.clearAll(); // this._cValues = {};
        this._links.clearAll(); // this._links = {};
        this.__toString = undefined;
        this._roOptions = {};
        this._rwOptions = {};
    }

    public rollbackChanges() {
        if (!this._value)
            return;

        this.clearCache(); // TODO: Add some record data pre-processing here if needed
        this._canceled = true;
        this._isDeleted = false;
        this.updateCalcs();
        ObjExt.each(this._value, (cd) => {
            this.checkChangedOptions(cd);
        });
        this.raiseColumnChanged(undefined, undefined);
    }
    /**
     * @returns {Object} A primary key key-value pairs
     */
    public getPk() {
        if (!Types.isNullOrUndefined(this._pk))
            return this._pk;

        const pk = {};
        const keys = this._entity.getKeys();
        if (keys) {
            const len = keys.length;
            for (let i = 0; i < len; i++) {
                const key = keys[i];
                const v = this.get(key);
                const isNull = Types.isEmptySwsValue(v);
                // var isNull = rec.Types.isEmpty(key);
                if (isNull) continue;
                pk[key] = v; // rec.get(key);
            }
        }
        this._pk = pk;
        return pk;
    }

    public getPkAsString() {
        const pk = this.getPk();
        return ArrExt.arrayAsComaSep(ObjExt.objectAsString(pk, (cd, value) => {
            const col = this._entity.getColumn(cd);
            return Fmt.format("{0} = {1}", col.getCaption(), value);
        }));
    }

    /**
     * @param {BaseColumn} column
     * @returns {{}}
     */
    public getRefPk(column: BaseColumn): object {
        const colCd = column.getColumnCd();
        const v = this._refPks.getCachedValue(colCd);
        if (v !== undefined)
            return v;

        const pk = {};
        const keys = column.getThisKey();
        const otherKey = column.getOtherKey();

        const len = keys.length;
        let nEmpty = true;
        for (let i = 0; i < len; i++) {
            const thisV = keys[i];
            const otherV = otherKey[i];
            const v1 = this.get(thisV);
            if (Types.isNullOrUndefined(v1))
                nEmpty = false;
            pk[otherV] = v1;
        }

        return this._refPks.setCachedValue(colCd, nEmpty ? pk : null);
    }

    public getRefStringPk(columnCd) {
        let v = this._refPksEncoded.getCachedValue(columnCd);
        if (v !== undefined)
            return v;

        const col = this._entity.getColumn(columnCd);
        v = this.getRefPk(col);
        return this._refPksEncoded.setCachedValue(columnCd, ObjHash.objectHash(v));
    }

    /**
     * @param {Column} column
     * @returns {{}}
     */
    public getThisKeys(column) {
        const r = {};
        column.getThisKey().forEach((key) => {
            r[key] = this.get(key);
        });
        return r;
    }

    public addThisKeysTo(column, r) {
        if (!r)
            r = {};

        column.getThisKey().forEach((key) => {
            r[key] = this.get(key);
        });
        return r;
    }

    public addOtherKeysTo(column, r) {
        if (!r)
            r = {};
        const otherKeys = column.getOtherKey();
        column.getThisKey().forEach((key, i) => {
            const otherKey = otherKeys[i];
            r[otherKey] = this.get(key);
        });
        return r;
    }

    /**
     * @param {BaseColumn} column
     * @param {Entity} refEntity
     */
    public getRefColumnMd(column: BaseColumn, refEntity) {
        const entityCd = this._entityCd;
        return refEntity.findColumnMd((cd, refCol) => {
            if (!refCol.isRef() || refCol.getRefEntity() !== entityCd) return undefined;
            if (!ObjExt.areObjectPropsEqual(column.getOtherKey(), refCol.getThisKey())) return undefined;
            return refCol;
        });
    }
    public getRefToParent(column, refEntity) {
        const r = createCachedObject();
        const col = this.getRefColumnMd(column, refEntity);
        if (col)
            r.setCachedValue(col.getColumnCd(), column.getColumnCd());
        else {
            const thisKey = column.getThisKey();
            column.getOtherKey().forEach((cd, i) => {
                r.setCachedValue(cd, thisKey[i]);
            });
        }
        return r;
    }
    public getStringPk() {
        if (!Types.isNullOrUndefined(this._stringPk)) return this._stringPk;
        this._stringPk = ObjHash.objectHash(this.getPk());
        return this._stringPk;
    }
    /**
     * @param {Record|Object} keys
     * @returns {boolean} whether keys has the same keys as current
     */
    public samePk(keys) {
        if (!keys) return false;
        const fn = Utils.getGetter(keys);

        const k = this._entity.getKeys();
        for (const prop of k) {
            const s = this.get(prop);
            const n = fn(prop);
            // tslint:disable-next-line:triple-equals
            if (s != n) return false;
        }
        return true;
    }
    public isInserted() {
        return !this._source || this._isDb && Types.isEmpty(this.getPk());
    }
    public isCopied() {
        return this._isCopied;
    }
    public isDeleted() {
        return this._isDeleted;
    }
    /**
     * @param {Dataset} ds
     * @returns {Record}
     */
    public setDataset(ds) {
        this._dataset = ds;
        return this;
    }
    /**
     *
     * @param {String} columnCd - when empty it means that options for the record
     * @param {Boolean} ro
     * @param {Boolean} [noCache]
     * @param {CellOptions} [prevOptionsObj]
     * @returns {CellOptions}
     */
    public getOptions(columnCd: string, ro: boolean, noCache?: boolean, prevOptionsObj?: CellOp.CellOptions): CellOp.CellOptions {
        if (columnCd === Const.toStringColumn)
            columnCd = undefined;
        const opSet = ro ? this._roOptions : this._rwOptions;
        let cached = opSet[columnCd];
        if (noCache || !cached) {
            cached = this.calcOptions(columnCd, ro);
            opSet[columnCd] = cached;
        }
        return cloneOptions(cached, prevOptionsObj); // objectClone(cached);
    }
    public calcOptions(columnCd, ro): CellOp.CellOptions {
        let r = this._dataset && this._dataset.getOptions
            ? this._dataset.getOptions(columnCd, this, ro)
            : this._entity.getOptions(columnCd, this, ro);
        r = this.mergeStyleOptions(columnCd, r, ro);
        if (columnCd === Const.toStringColumn || this.isInserted()) return r;

        // var col = entity.getColumn(columnCd);
        // if(col.isPk && col.isPk())
        //     res.readonly = true;
        return r;
    }

    public mergeStyleOptions(columnCd, options, ro): CellOp.CellOptions {
        if (!columnCd)
            return options;
        const recOptions = this.getOptions(undefined, ro);
        if (recOptions.background === options.background)
            options.background = undefined;
        return options;
    }

    public checkOptionsChanged(columnCd, ro, noraise) {
        if (columnCd === Const.toStringColumn)
            columnCd = undefined;
        const opSet = ro ? this._roOptions : this._rwOptions;
        const cached = opSet[columnCd];
        if (Types.isNullOrUndefined(cached))
            return false;

        const newOp = this.calcOptions(columnCd, ro);
        if (CellOp.sameOptions(newOp, cached))
            return false;
        opSet[columnCd] = newOp;
        if (!noraise)
            this.raiseOptionsChanged(columnCd, cloneOptions(newOp), !ro);
        if (!columnCd)
            this.checkChangedOptions(columnCd);
        return true;
    }

    public isChanged() {
        return this.isInserted() && !this._canceled || Types.isEmpty(this._valErrors) && !Types.isEmpty(this._value) || this._isDeleted;
    }
    public hasDataset() {
        return !!this._dataset;
    }
    public setDeleted() {
        this._isDeleted = true;
    }
    public cancelDelete() {
        this._isDeleted = false;
    }
    public wasChanged(columnCd) {
        return this._value && this._value.hasOwnProperty(columnCd);
    }
    public wasRefChanged(col) {
        const keys = col.getThisKey();
        return ObjExt.objectAny(keys, (i, key) => this.wasChanged(key));
    }
    public canUpdate() {
        return this._dataset ? this._dataset.canUpdate() : this._entity && this._entity.canUpdate();
    }
    public canInsert() {
        return this._dataset ? this._dataset.canInsert() : this._entity && this._entity.canInsert();
    }
    public canCopy() {
        return this._dataset ? this._dataset.canCopy() : this._entity && this._entity.canCopy();
    }
    public setSets(sets) {
        this._sets = sets;
    }
    // new change request processing
    // public getCh(): DM.ChangeRequest {
    //     if (!this.isChanged()) return null;

    //     if (this.isDeleted())
    //         return DM.getRecDeleteCh(this, null, this.getSourceForDelete());

    //     if (!this._value)
    //         Ex.raiseError("Value is empty in get update changes, record is changed");

    //     const value = {};
    //     if (this.isInserted()) {
    //         let sets;
    //         this._entity.eachCanChangeOnAddColumn((cd, col) => {
    //             if (col.isRef() || col.isSet())
    //                 return;

    //             const newProp = this._value[cd];
    //             // for all not set properties
    //             if (!Types.isNullOrUndefined(newProp))
    //                 value[cd] = newProp;
    //         });
    //         if (this.isCopied()) {
    //             sets = ObjExt.objectCopy(this._sets, (i, setRecordsArray) => {
    //                 // remove rec from sets array
    //                 return setRecordsArray.map((item) => {
    //                     item.rec = undefined;
    //                     return item;
    //                 });
    //             });
    //             return DM.getRecCopyCh(this, value).setOwner(this._sourcePk).setSets(sets);
    //         } else {
    //             sets = {};
    //             this._entity.eachCanChangeOnAddColumn((cd, col) => {
    //                 if (!col.isSet())
    //                     return; // only for set columns

    //                 const ds = this.getDataset(col);
    //                 if (!ds || !Types.isMethod(ds.getAllFromCache))
    //                     return;
    //                 const detRecs = ds.getAllFromCache();
    //                 const arr = detRecs.map((item) => {
    //                     if (!item)
    //                         return;
    //                     const ch = item.getCh();
    //                     return ch ? ch.value : undefined;
    //                 });
    //                 if (arr.length > 0)
    //                     sets[cd] = arr;
    //             });
    //         }
    //         return DM.getRecInsertCh(this, value).setSets(sets);
    //     }

    //     // here we if we are in update mode
    //     this._entity.eachUpdatableColumn((cd, col) => {
    //         if (!this._value.hasOwnProperty(cd) || col.isRef()) return;
    //         const oldProp = this._source[cd];
    //         const newProp = this._value[cd];
    //         // tslint:disable-next-line:triple-equals
    //         if (oldProp == newProp) return;
    //         value[cd] = newProp;
    //     });
    //     return DM.getRecUpdateCh(this, value, this.getSourceForUpdate());
    // }
    public getListOfUpdateColumns(updateObj) {
        const r = [];
        const entity = this._entity;
        ObjExt.objectEachSimple(updateObj, (cd, value) => {
            const col = entity.getColumn(cd);
            const partOf = col.getPartOfRefs();
            if (Types.isArray(partOf)) {
                for (const c of partOf)
                    ArrExt.arrayAddIfNotExist(r, c);
            } else {
                ArrExt.arrayAddIfNotExist(r, cd);
            }
        });
        return r;
    }

    // public commitCh(control, onOk, onError) {
    //     if (this._parentRecord) {
    //         this._parentRecord.commitCh(control, onOk, onError);
    //         return;
    //     }
    //     if (this._dataset)
    //         return this._dataset.saveChanges(control, onOk, onError, this);

    //     DM.commitChSet(this, null, control, (batch, result) => {
    //         if (Types.isArray(result))
    //             result = result[0];
    //         const r = result.retval === undefined ? result : result.retval;
    //         this.update(r.source);
    //         FnExt.safeCall(this, onOk);
    //     }, onError);
    // }

    public getChanges() {
        const value = {};
        const vv = this._value;
        const src = this._source || {};
        this._entity.eachUpdatableColumn((cd, col) => {
            if (!vv.hasOwnProperty(cd) || col.isRef()) return;
            const oldProp = src[cd];
            const newProp = vv[cd];
            // tslint:disable-next-line:triple-equals
            if (oldProp == newProp) return;
            value[cd] = newProp;
        });
        return value;
    }

    /**
     * set old properties to current, old properties lost
     */
    public save() {
        if (!this._value) return;
        this._source = this._value;
        this._value = null;
    }

    public saveValues() {
        if (!this._value) return;
        this._source = ObjExt.objectAddProps(this._source, this._value);
        this._value = null;
        this.raiseColumnChanged(null, this);
    }

    public cancelChanges() {
        this.rollbackChanges();
        this.markChangesInDs();
    }
    public toString() {
        if (Types.isNullOrUndefined(this.__toString)) {
            const toStr = this._entity.getAsString(this);
            this.__toString = (toStr === "") ?
                (this.isInserted() ? R(_res.NewRecordFmt) : R(_res.EmptyTostringFmt)) :
                toStr;
        }
        return this.__toString;
    }

    /**
     * @param {String} columnCd name
     * @param newValue
     */
    public set(columnCd, newValue) {
        const columnMd = this._entity.getColumn(columnCd);
        if (Types.isNullOrUndefined(columnMd))
            Ex.raiseErrorFmtR(ColumnRes.NoField, columnCd, this._entityCd);

        // Ex.raiseErrorIf(Types.isEmpty(newValue) && !col.isNullable(), "Trying to set null to column ["+columnCd+"] that can't be null");

        const isRec = ObjExt.checkPrototype(newValue, Record.prototype);
        if (!columnMd.isRef()) {
            let vv = columnMd.valuePreprocessor ? columnMd.valuePreprocessor(newValue) : newValue;

            if (vv === "")
                vv = null;
            if (isRec)
                return LOG.errorFmt("Try to set not ref property with ref value", "[{0}] = {1}", columnCd, newValue);
            return this.setValue(columnCd, vv);
        }

        this.setRefsValue(columnCd, newValue);
        const empty = Types.isEmpty(newValue);

        if (!empty)
            return updateRefNotEmptyValue(this, columnCd, columnMd, newValue);

        if (columnMd.isParentChild()) // empty and parent-child
            return updateParentRefEmptyValue(this, columnCd, columnMd);

        return updateRefEmptyValue(this, columnCd, columnMd);
    }
    public setF(columnCd, fValue) {
        let error;
        try {
            const val = this.getUnF(columnCd, fValue);
            if (this._valErrors && this._valErrors.hasOwnProperty(columnCd))
                delete this._valErrors[columnCd];
            this.set(columnCd, val);
        } catch (ex) {
            error = ex.message || ex;
            if (!this._valErrors)
                this._valErrors = {};
            this._valErrors[columnCd] = error;
            this.set(columnCd, fValue);
            this._fValues.setCachedValue(columnCd, fValue);
            this._tValues.setCachedValue(columnCd, fValue);
        }
        return error;
    }

    public getIfExists(columnCd) {
        if (this._value && this._value.hasOwnProperty(columnCd))
            return this._value[columnCd];
        if (this._source && this._source.hasOwnProperty(columnCd))
            return this._source[columnCd];
        return this._entity.hasColumn(columnCd) ? null : undefined;
    }

    public getRefOrValue(columnCd) {
        const v = this.getRefRecOrValue(columnCd);
        if (Types.isEmpty(v)) return;
        const col = this._entity.getColumn(columnCd);
        return col.isRef() ? v.internalGetRecordValues() : v;
    }

    public getRefRecOrValue(columnCd) {
        if (this.isEmpty(columnCd)) return null;
        const col = this._entity.getColumn(columnCd);
        if (!col.isRef()) return this.get(columnCd);
        const ds = this.getRefDataset(col);
        if (!ds) return undefined;
        return ds.getCurrentRecord();
    }

    public getValueByPath(path, fn, callback, inAsync, noRaise) {
        const parts = Types.getStringParts(path, ".");
        if (!parts)
            return FnExt.callOnRes(null, callback, inAsync, fn);

        const refCd = parts.f;

        if (Strings.isEmptyOrWhiteSpace(parts.s))  // mean current record property
            return FnExt.callOnRes(this.get(refCd, undefined, noRaise), callback, inAsync, fn);

        const col = this._entity.getColumn(refCd);
        if (!col)
            // todo need to show warning about not found column
            return FnExt.callOnResWithWarn(null, callback, inAsync, fn, Fmt.formatR(_res.ColumnNotFound, refCd));
        if (!col.isRef())
            Ex.raiseErrorFmt("Unable to get '{0}' for entity '{1}' because '{2}' is not reference", path, this._entity.getCaption(), refCd);

        const v = this.getRefValueFromDataset(refCd, col, (value, async, loaded) => {
            if (!value)
                return fn ? fn(null) : null;
            return value.getValueByPath(parts.s, fn, callback, inAsync || async);
        });
        return inAsync ? callback(v) : v;
    }

    public getValueByPathForCalc(path) {
        return this.getValueByPath(path, undefined, undefined, false, true);
    }

    public getRecOrValueByPath(path, callback, inAsync) {
        // todo: remove copy paste with getValueByPath
        const parts = Types.getStringParts(path, ".");
        if (!parts)
            return FnExt.callOnRes(null, callback, inAsync);

        const refCd = parts.f;
        if (Const.isThisColumn(refCd))
            return inAsync ? callback(this) : this;

        const col = this._entity.getColumn(refCd);
        if (!col.isRef()) {
            if (Strings.isEmptyOrWhiteSpace(parts.s)) // mean current record property
                return FnExt.callOnRes(this.get(refCd), callback, inAsync);

            // tslint:disable-next-line:max-line-length
            return Ex.raiseErrorFmt("Unable to get '{0}' for entity '{1}' because '{2}' is not reference", path, this._entity.getCaption(), refCd);
        }

        const isLast = Types.isNullOrUndefined(parts.s);
        const v = this.getRefValueFromDataset(refCd, col, (value, async) => {
            if (value && !isLast)
                return value.getRecOrValueByPath(parts.s, callback, inAsync || async);
            FnExt.safeCall(this, callback, value);
            return value;
        });
        return inAsync ? undefined : v;
    }

    public findRefAndSet(refCd, searchedFields, callback) {
        const col = this._entity.getColumn(refCd);
        if (!col.isRef())
            // tslint:disable-next-line:max-line-length
            return Ex.raiseErrorFmt("Error on find reference value. Entity '{1}' column '{2}' is not reference", this._entity.getCaption(), col.getCaption());

        const ds = this.getRefDataset(col);
        ds.findFirst(searchedFields, (value) => {
            this.set(refCd, value);
            FnExt.callCallback(callback);
        });
    }

    public internalGetRecordValues(noToString) {
        const r = {};
        const setResValue = (nm, value) => { r[nm] = value; };
        ObjExt.objectEachSimple(this._source, setResValue);
        ObjExt.objectEachSimple(this._value, setResValue);
        if (!noToString)
            r[Const.toStringColumn] = this.toString();
        return r;
    }

    public cancelColumnChanges(columnCd) {
        if (!this._value)
            return undefined;
        const colMd = this._entity.getColumn(columnCd);
        if (colMd.isCalc())  // nothing to cancel in calc column
            return true;

        if (!this._value || !this._value.hasOwnProperty(columnCd))
            return false;

        if (colMd.isSet())
            Ex.raiseErrorFmt("Not supported cancel changes in set column [{0}]", columnCd);

        if (colMd.isRef())
            return this.cancelRefColumn(columnCd, colMd);

        let v = this._source ? this._source[columnCd] : undefined;
        if (v === undefined)
            v = colMd.getDefValue();
        this.set(columnCd, v);
        return true;
    }

    public getF(columnCd) {
        const v = this._fValues.getCachedValue(columnCd);
        if (v !== undefined)
            return v;

        return this.setFValue(columnCd, this.get(columnCd));
    }

    public updateFValue(columnCd) {
        const oldF = this._fValues.getCachedValue(columnCd);
        const v = this.get(columnCd);
        const fv = this.setFValue(columnCd, v);
        return fv !== oldF;
    }

    public getNative(columnCd) {
        const v = this.get(columnCd);
        const col = this._entity.getColumn(columnCd);
        return col.toNative(v, this);
    }

    public getDeserialized(columnCd) {
        const v = this.get(columnCd);
        const col = this._entity.getColumn(columnCd);
        return Types.isMethod(col.deserialize) ? col.deserialize(v, this) : v;
    }

    public getTitle(columnCd) {
        if (columnCd === undefined)
            return this.toString();

        let t = this._tValues.getCachedValue(columnCd);
        if (t !== undefined)
            return t;

        const v = this.get(columnCd);
        const fV = this.getF(columnCd);
        const col = this._entity.getColumn(columnCd);
        t = col.title(v, this, fV);
        this._tValues.setCachedValue(columnCd, t);
        return t;
    }

    public isNotLoaded(columnCd) {
        const col = this._entity.getColumn(columnCd);
        return FnExt.callByName(col, "isNotLoaded", this) || false;
    }

    public getForString(columnCd) {
        const c = this.isEmpty(columnCd);
        return c ? "" : this.getF(columnCd);
    }

    public getUnF(columnCd, v) {
        const col = this._entity.getColumn(columnCd);
        return col.unformat ? col.unformat(v) : v;
    }

    public isEmpty(columnCd) {
        const v = this.get(columnCd);
        return Types.isEmptySwsValue(v);
    }

    public getByName(name) {
        const columnCd = ObjExt.objectFirst(this._entity.getColumns(), (n, column) => {
            return n === name || column.getCaption() === name;
        });
        if (columnCd === null)
            Ex.raiseErrorFmtR(ColumnRes.NoField, name, this._entity._entityCd);
        return this.get(columnCd);
    }

    /**
     * validates current record properties and return array of validation errors
     * @returns {Object}
     */
    public validate() {
        if (this._isDeleted)
            return undefined;
        if (Types.notEmpty(this._valErrors))
            return this._valErrors;
        if (this._noValidateEmpty && this._source && !this._value)
            return {};

        if (this._dataset && Types.isMethod(this._dataset.validate))
            return this._dataset.validate(this);

        return this._entity.validate(this);
    }

    public applyDefaults(dset?, callback?) {
        const d = dset || this._dataset;
        if (d && d.setDefaults)
            d.setDefaults(this);
        else
            this._entity.setDefaults(this);
        // this.loadRefs(true, callback);
        return this;
    }
    public copy(allColumns) {
        const ss = {};
        const entity = this._entity;
        if (allColumns) {
            ObjExt.objectEachSimple(this._entity.getColumns(), (cd, col) => {
                if (col.isSet() || cd === Const.toStringColumn) return;
                const v = this.get(cd);
                if (Types.isNullOrUndefined(v)) return;
                ss[cd] = v;
            });
        } else {
            ObjExt.objectEachSimple(this._source, (n, s) => {
                const col = entity.getColumn(n);
                if (!col.canCopy()) return;

                if (col.isRef()) {
                    const r = this.getThisKeys(col);
                    ObjExt.objectEachSimple(r, (n1, s1) => {
                        ss[n1] = s1;
                    });
                    return;
                }

                ss[n] = s;
            });
        }

        return new Record(entity, undefined, ss, allColumns ? undefined : this).loadRefs(true);
    }
    public getRecordDataset() {
        return this._dataset;
    }
    /**
     * @param column
     * @return {Dataset}
     */
    public getDataset(column) {
        // if (!column.getColumnCd)
        //     Ex.raiseError("ColumnMd expected");
        // const c = column.getColumnCd();
        // if (!column.isSet())
        //     Ex.raiseErrorFmt(_res.NotSet, c, this._entity);

        // let ds = this._dataSets[c];
        // if (ds) return ds;

        // const entityCd = column.getRefEntity();
        // const ref = Sws.dataset.createRef(this, column).update();

        // if (this.isInserted())
        //     ds = this._newWithDetails ? Sws.memoryDs.createDataset(undefined, column.getRefEntity(), ref) : undefined;
        // else
        //     ds = Sws.dataset.create(entityCd, ref, ref._filter);
        // this._dataSets[c] = ds;
        // return ds;
    }

    public getDatasetByColumnCd(columnCd) {
        const col = this._entity.getColumn(columnCd);
        return this.getDataset(col);
    }

    public setParentRecord(parentRecord) {
        this._parentRecord = parentRecord;
        return this;
    }

    public getSubRecord() {
        return this._subRecord;
    }

    public addSubRecord(subRecord) {
        this._subRecord = subRecord;
        this._subRecord.setParentRecord(this);
        // this._subRecord.setParentDataset(_dataset);
        return this;
    }
    public setListOfValues(columnCd, values) {
        const old = this._lValues.getCachedValue(columnCd);
        if (old === values) return this;
        this._lValues.setCachedValue(columnCd, values);
        if (this.isEmpty(columnCd)) return this;

        const v = this.get(columnCd);
        const f = values.find((lv) => LV.equalLValue(v, lv));
        if (f !== null) {
            this.setFValue(columnCd, v, values);
            return this;
        }

        let fv = this.getF(columnCd);
        if (Types.isNullOrUndefined(fv))
            fv = v;
        C.handleException(Fmt.format("Value '{0}' not exists in list of values for column '{1}', values : [{2}]", fv, columnCd, values));
        this.set(columnCd, undefined);
        return this;
    }
    public setCachedListOfValues(columnCd, listOfValues) {
        if (Types.isMethod(listOfValues))
            this._cachedListOfValues = listOfValues;
        return this;
    }
    public getListOfValues(columnCd, callback) {
        const values = this.getLValues(columnCd);
        if (Types.isNullOrUndefined(values)) {
            if (this._cachedListOfValues)
                return this._cachedListOfValues(this, (vv) => {
                    this.setListOfValues(columnCd, vv);
                    FnExt.safeCallCallback(this, callback, vv);
                });
            const columnMd = this._entity.getColumn(columnCd);
            columnMd.getListOfValues(this, callback);
            return;
        }
        FnExt.safeCallCallback(this, callback, values);
    }
    public loadRefs(onlyChanged, callback?) {
        const refs = this._entity.getRefsMd();
        if (Types.isEmpty(refs)) {
            FnExt.safeCall(this, callback);
            return this;
        }

        const onLoad = () => {
            count--;
            if (count > 0) return;
            FnExt.safeCall(this, callback);
        };
        let count = refs.length;
        refs.forEach((field) => {
            if (onlyChanged && !this.wasRefChanged(field)) return onLoad();
            const ds = this.getRefDataset(field, onLoad);
            // update ref dataset - should set properly ref value if we had defaults with ref this key
            if (ds && ds.isNotLoaded()) return;
            onLoad();
        });
        return this;
    }
    public getLValues(columnCd) {
        return this._lValues.getCachedValue(columnCd);
    }

    public getFValues() {
        if (!this._fValues) return undefined;
        return this._fValues._cache;
    }
    // todo: not sure that we neeed vales param
    public setFValue(columnCd, v, values?) {
        const col = this._entity.getColumn(columnCd);
        const needRefresh = !!col.formatWithValues;
        const ff = col.formatWithValues ? col.formatWithValues(v, this.getLValues(columnCd)) : col.format(v, this);
        if (!col._noCacheStr)
            this._fValues.setCachedValue(columnCd, ff);
        if (needRefresh)
            this.raiseRefreshColumn(null, columnCd);
        return ff;
    }
    public clearCachedValue(columnCd) {
        this._fValues.clearValue(columnCd);
        this._cValues.clearValue(columnCd);
        this._links.clearValue(columnCd);
        this._tValues.clearValue(columnCd);
        this._pk = undefined;
    }
    public clearCachedValueAndRefs(columnCd) {
        this.clearCachedValue(columnCd);
        this._refPks.clearValue(columnCd);
        this._refs.clearValue(columnCd);
    }
    public raiseValueChanged(columnCd, v, old, noUpdateCalcs?) {
        this.__toString = undefined;
        this.clearCachedValue(columnCd);
        this.updateColumn(columnCd);
        if (!noUpdateCalcs)
            this.updateCalcs();
        this.checkChangedOptions(columnCd); // calculate columns that need to be refreshed
        this.raiseColumnChanged(columnCd, v, old);
        this.markChangesInDs();
        if (this._inPropChanged) return;

        try {
            this._inPropChanged = true;
            FnExt.safeCallByName(this._entity, "propChanged", this, columnCd, old, v);
        } finally {
            this._inPropChanged = false;
        }
    }
    public raiseRefreshColumn(i, columnCd) {
        this.$NeedRefreshColumn.trigger(columnCd);
    }

    public raiseOptionsChanged(columnCd, options, isRw) {
        this.$OptionsChanged.trigger(columnCd, options, isRw);
    }

    public checkChangedOptions(changedColumnCd) {
        const cols = this._entity.getVisibleColumns();
        const len = cols ? cols.length : 0;
        for (let i = 0; i < len; i++) {
            const columnCd = cols[i];
            const wasChanged = columnCd === changedColumnCd;
            this.checkOptionsChanged(columnCd, true, wasChanged);
            this.checkOptionsChanged(columnCd, false, wasChanged);
        }
    }

    public updateCachedOptions(columnCd) {
        this.checkOptionsChanged(columnCd, true, false);
        this.checkOptionsChanged(columnCd, false, false);
    }

    public setValue(columnCd, v) {
        const old = this.get(columnCd);
        // tslint:disable-next-line:triple-equals
        if (old == v)
            return;

        if (Types.isNullOrUndefined(v) && !(this._source && !Types.isNullOrUndefined(this._source[columnCd]))) {
            this.removeValue(columnCd);
        } else {
            if (!this._value)
                this._value = { [columnCd]: v };
            else if (this._source && this._source[columnCd] === v)
                this.removeValue(columnCd);
            else
                this._value[columnCd] = v;
        }
        this.raiseValueChanged(columnCd, v, old);
    }

    public setRecordValues(...params) {
        const l = params.length;
        for (let i = 0; i < l; i = i + 2) {
            const n = params[i];
            this.set(n, params[i + 1]);
        }
        return this;
    }

    public raiseColumnChanged(columnCd, v, old?) {
        C.info("Column changed", columnCd, "new:", v, "old:", old);
        this.$Changed.trigger(columnCd, v, old);
    }

    public updateCalcs() {
        const entity = this._entity;
        ObjExt.each(entity.getCalcColumns(), (i, colCd) => {
            const col = entity.getColumn(colCd);
            const v = FnExt.safeCall(col, col.updateCalc, this);
            const old = this._calcs[colCd];
            if (old === v) return;
            this._calcs.setCachedValue(colCd, v);
            this.raiseValueChanged(colCd, v, old, true);
        });
    }

    public markChangesInDs() {
        const ds = this._dataset || FnExt.callByName(this._parentRecord, "getRecordDataset");
        FnExt.callByName(ds, "registerRecordChange", this);
    }

    // region check version support
    public getSrc(list) {
        if (!list || !list.indexOf)
            Ex.raiseError("Incorrect list of columns");

        return ObjExt.objectCopy(this._source, (cd, value) => {
            if (list.indexOf(cd) > -1)
                return value;
        });
    }

    public getSourceForDelete() {
        const v = this._entity.getCheckOnDeleteColumnsCd();
        return this.getSrc(v);
    }

    public getSourceForUpdate() {
        const v = this._entity.getCheckOnUpdateColumnsCd();
        return this.getSrc(v);
    }
    // endregion

    public removeValue(colCd) {
        if (this._valErrors && this._valErrors.hasOwnProperty(colCd))
            delete this._valErrors[colCd];
        this._cValues.clearValue(colCd);
        // if(this._cValues && this._cValues.hasOwnProperty(colCd))
        //     delete this._cValues[colCd];
        if (!this._value || !this._value.hasOwnProperty(colCd)) return;

        delete this._value[colCd]; // ????
        this._fValues.clearValue(colCd);
        // if(this._fValues.hasOwnProperty(colCd))
        //     delete this._fValues[colCd];
        this.checkChangedOptions(colCd);
        this.raiseColumnChanged(colCd, undefined);
    }

    public cancelRefColumn(colCd, columnMd) {
        columnMd.getThisKey().forEach((col) => { this.removeValue(col); });
        this.removeValue(colCd);
        this.markChangesInDs();
        return true;
    }

    // region refValues
    /**
     * @param columnMd
     * @param [callback]
     * @return {Dataset}
     */
    public getRefDataset(columnMd, callback?) {
        if (!columnMd.getColumnCd)
            Ex.raiseError("ColumnMd expected");
        const columnCd = columnMd.getColumnCd();
        if (!columnMd.isRef())
            Ex.raiseErrorFmtR(_res.NotRef, columnCd, this._entity);

        if (inStacked(this, columnCd))
            return C.info("in loop update", columnCd);

        let ds = this._dataSets[columnCd];

        if (!ds) {
            ds = createRefDs(this, columnCd, columnMd);
            this._dataSets[columnCd] = ds;
        } else {
            if (this._refs.hasCachedValue(columnCd)) {
                FnExt.callCallback(callback, this._refs.getCachedValue(columnCd));
                return ds;
            }
        }
        const pk = this.getRefPk(columnMd);
        const refPk = this.getRefStringPk(columnCd);

        const onGotRec = (refRec) => {
            C.info("in got ref dataset " + columnCd, pk);
            this.set(columnCd, refRec);
            if (this._reqKeys && this._reqKeys[columnCd] === refPk)
                delete this._reqKeys[columnCd];

            if (Types.isNullOrUndefined(refRec) && pk) {
                C.warnFmt(`${R(_res.RefRecordNotFound)} ${R(_res.RefRecordNotFoundDetails)}`, columnMd.getQuotedCaption(), pk);
                this.raiseColumnChanged(columnCd, undefined);
            }
            FnExt.callCallback(callback, refRec);
        };

        if (this._dataset && this._dataset.isParentRef(columnCd)) {
            onGotRec(this._dataset.getParentRecord());
            return ds;
        }

        const loadRefByKey = () => {
            const needUpdate = this._reqKeys === undefined || this._reqKeys[columnCd] !== refPk;
            if (this._reqKeys === undefined)
                this._reqKeys = {};
            this._reqKeys[columnCd] = refPk;

            if (needUpdate) {
                C.info("in get ref dataset " + columnCd, this, pk);
                ds.getRecordByKey(pk, onGotRec);
            } else {
                if (callback)
                    ds.getRecordByKey(pk, callback);
                else
                    C.warn("Skip", columnCd);
            }
        };

        if (Types.isMethod(columnMd.parseColFilter))
            columnMd.parseColFilter(this, (f) => {
                ds.setColumnFilter(f);
                loadRefByKey();
            });
        else
            loadRefByKey();

        return ds;
    }

    public isParentRef(columnCd) {
        const pi = this._dataset ? this._dataset.getParentRef() : undefined;
        return pi && pi.hasCachedValue(columnCd);
    }

    public setRefsValue(columnCd, value) {
        this._refs.setCachedValue(columnCd, value);
        this._refPks.clearValue(columnCd);
        this._refPksEncoded.clearValue(columnCd);
    }

    public getRefValueFromDataset(columnCd, columnMd, callback) {
        let v = this._refs.getCachedValue(columnCd);
        if (v !== undefined)
            return FnExt.getFnResult(v, callback);

        const d = this._dataset;

        if (!d)
            return this.getRefValueOrLoad(columnCd, columnMd, callback);
        // Ex.raiseError("No dataset when try to get ref value from dataset");

        if (this.isParentRef(columnCd)) {
            const info = d.getParentInfo();
            v = info._record;
            if (v) {
                this.setRefsValue(columnCd, v);
                return FnExt.getFnResult(v, callback);
            }
        }

        return d.getRefRecord(columnMd.getRefEntity(), this.getRefPk(columnMd), (record, inAsync) => {
            this.setRefsValue(columnCd, record);
            return FnExt.getFnResult(record, callback, inAsync);
        });
    }

    public getRefValueOrLoad(columnCd, columnMd, callback) {
        let v = this._refs.getCachedValue(columnCd);
        if (v !== undefined)
            return FnExt.getFnResult(v, callback);

        if (this.isParentRef(columnCd)) {
            const info = this._dataset.getParentInfo();
            v = info._record;
            if (v) {
                this.setRefsValue(columnCd, v);
                return FnExt.getFnResult(v, callback);
            }
        }

        const encoded = this.getRefStringPk(columnCd);
        if (Types.isNullOrUndefined(encoded)) { // empty ref props
            this.setRefsValue(columnCd, undefined);
            return FnExt.getFnResult(null, callback);
        }

        if (this._pendingRefs[columnCd]) {
            this._pendingRefs[columnCd].push(callback);
            return;
        }

        this._pendingRefs[columnCd] = [callback];
        this.getRefDataset(columnMd, (vv) => {
            this._pendingRefs[columnCd].forEach((handler) => {
                if (handler)
                    return handler(vv, true, true);
            });
            this._pendingRefs[columnCd] = undefined;
        });
    }
    public getColumnContext(columnCd) {
        return {
            getValueByPathForCalc: (path) => {
                return this.getValueByPathForCalc(path);
            },
            isColumn(colCd) {
                return columnCd === colCd;
            },
            isEmpty(colCd) {
                return this.isEmpty(colCd);
            },
        };
    }
}
