import * as ArrExt from "../arr-extension";
import * as AsyncExt from "../async-extension";
import * as AsyncRes from "../async-result";
import DebugSetting from "../debug-setting";
import * as Ex from "../exceptions";
import * as Fmt from "../formatting";
// TODO: import FILTER
import LOG from "../logger/logger";
import { BaseEntity } from "./base-entity";
import * as Const from "./const";
import * as DataTypes from "./data/data-type";
import { EntityColumn } from "./entity-column";
import { ColumnGroup } from "./entity-column-group";
import * as ObjExt from "../obj-extension";
import * as Sequences from "../sequences";
import * as Types from "../types-utils";

import { DEF, R } from "../resources";

export const _res = {
    ErrorApplyDefaultsToEmpty: DEF("Entity.ErrorApplyDefaultsToEmpty", "Trying to apply entity defaults to empty object"),
    MissedMasterColumn: DEF("Entity.MissedMasterColumn", "Master column not found in entity"),
    NoFormatStringForEntity: DEF("Entity.NoFormatStringForEntity", "Server must provide format string for entity [{0}]"),
    NoKeyColumnValue: DEF("Entity.NoKeyColumnValue", "key column '{0}' should have an value"),
    NoKeyDefined: DEF("Entity.NoKeyDefined", "Entity {0} has no defined keys"),
    NoMasterColumn: DEF("Entity.NoMasterColumn", "Couldn't find the column {0} in {1} on which the {2} is dependent"),
    NoSuchColumnInKey: DEF("Entity.NoSuchColumnInKey", "there is no '{0}' key column"),
};

export function sameEntity(first, second) {
    if (!first && !second) return true;
    if (!first && second || !second && first) return false;
    return !Types.isNullOrUndefined(first.__Uid) && (first.__Uid === second.__Uid);
}

export const _debug = new DebugSetting("entity-parse-func");

function splitComaIfNotEmpty(value) {
    return !value ? [] : value.split(",");
}

function parseFunc(xml, context) {
    if (!xml) return null;
    try {
        const r = context.createFunc(xml);
        _debug.write("Function", r);
        return r;
    } catch (e) {
        // APP.handleError(e);
    }
}

export function addFmtMethods(entity, formatString) {

    const addDep = (columnCd) => {
        const col = entity.getColumn(columnCd);
        if (col)
            col.addDependency(Const.toStringColumn);
        return columnCd;
    };

    if (!formatString) {
        entity.eachVisibleColumn(addDep);
        entity.getAsString = (record) => {
            const values = {};
            entity.eachVisibleColumn((columnCd, field) => {
                values[field.getCaption()] = record.getF(columnCd);
            });
            return ObjExt.objectAsString(values, ", ", ":");
        };
        return;
    }

    let s = "'" + formatString.replace(/'/g, "\\'") + "'";
    const r = /({[\w+\.]*(\,[\w+\.\:]*)*})/g;

    function recField(match) {
        const cd = match.substr(1, match.length - 2);
        return "'+ record.getForString('" + addDep(cd) + "') +'";
    }

    s = s.replace(r, recField);
    if (s.substr(0, 3) === "''+") s = s.substr(4);
    if (s.substr(s.length - 3, 3) === "+''")
        s = s.substr(0, s.length - 3);
    const _formatFunction = new Function("record", "return " + s + ";"); // jshint ignore:line

    /**
     * @param {Record} record
     * @returns {String}
     */
    entity.getAsString = (record) => {
        if (_formatFunction)
            return _formatFunction(record);
        return formatString;
    };
}

export interface IEntityRights {
    canDelete(): boolean;
    canUpdate(): boolean;
    canInsert(): boolean;
    canCopy(): boolean;
}

export interface IVisibleColumnProvider {
    getVisibleColumnsMd(): EntityColumn[];
}

export class Entity extends BaseEntity implements IEntityRights, IVisibleColumnProvider {
    public _rights;
    public _viewCd;
    public _canSearch;
    public _checkOnUpdate;
    public _checkOnDelete;
    public _canChangeOnAddFields;
    public _hasSets;
    public _hasRefs;
    public _hasIdentity;
    public _canCopy;
    public _canQuickAdd;
    public _clientValidators;
    public _cFmtXml;
    public _propChXml;

    public _params;
    public _uiViews;
    public _subEntityColumnCd;
    public _subTypeColCd;
    public _views;

    public _condFormatFunc;
    public _propChFunc;
    public _formatFunction;
    public _entityReady;
    public _onEntityReady;

    public _setsMd;
    public _refsMd;
    public _visibleColumnsMd;
    public _quickAddColumnsMd;
    public _notQuickAddColumnsMd;

    constructor(entity, sync: boolean = false) {
        super();

        this._caption = entity.Description;
        this._entityCd = entity.EntityCD;
        this._rights = entity.Rights ? entity.Rights.toUpperCase() : "";
        this._canInsert = this._rights.indexOf("I") > -1;
        this._canUpdate = this._rights.indexOf("U") > -1;
        this._canDelete = this._rights.indexOf("D") > -1;
        this._canSelect = this._rights.indexOf("S") > -1;
        this._viewCd = entity.EntityViewCd || ".";
        this._canSearch = !!entity.Searchable;

        this._checkOnUpdate = splitComaIfNotEmpty(entity.CheckOnUpdate);
        this._checkOnDelete = splitComaIfNotEmpty(entity.CheckOnDelete);

        const _visibleColumns = [];
        const _updatableFields = {};
        const _canChangeOnAddFields = {};
        const _fields = {} as {BaseColumn};
        const _fieldsArr = [];
        let _hasIdentity = false;
        const fields = entity.Fields;
        const _keys = [];
        const _sets = [];
        const _refs = [];
        const _calcFields = [];
        fields.forEach((item) => {
            const field = new EntityColumn(item);
            if (field.isIdentity())
                _hasIdentity = true;
            const columnCd = field._columnCd;
            if (field.isVisible()) {
                if (field.isSet())
                    _sets.push(columnCd);
                else {
                    if (field.isRef()) {
                        _refs.push(columnCd);
                    }
                    _visibleColumns.push(columnCd);
                }
            }
            _fields[columnCd] = field;
            _fieldsArr.push(field);
            if (field.isPk() && field.isField()) {
                _keys.push(columnCd);
            }
            if (field.isCalc()) {
                _calcFields.push(columnCd);
            } else {
                if (field.canEdit())
                    _updatableFields[columnCd] = field;
                if (field.canInsert())
                    _canChangeOnAddFields[columnCd] = field;
            }
        });
        this._visibleColumns = _visibleColumns;
        this._fields = _fields;
        this._fieldsArr = _fieldsArr;
        this._updatableFields = _updatableFields;
        this._canChangeOnAddFields = _canChangeOnAddFields;
        this._keys = _keys;
        this._sets = _sets;
        this._hasSets = _sets.length > 0;
        this._hasRefs = _refs.length > 0;
        this._refs = _refs;
        this._calcFields = _calcFields;
        this._hasIdentity = _hasIdentity;
        this._canCopy = this._rights.indexOf("C") > -1 && this._fieldsArr.some(f => (f as EntityColumn).canCopy());
        this._canQuickAdd = this._canInsert && !this._fieldsArr.some(f => !(f as EntityColumn).canAutoAdd());

        // tslint:disable-next-line:max-line-length
        const toStringCol = new EntityColumn({ ColumnCD: Const.toStringColumn, Caption: this._caption, FieldTypeCD: DataTypes.t.string, Length: 50 });
        this._fields[Const.toStringColumn] = toStringCol;
        _fieldsArr.push(toStringCol);

        const _groups = [];
        const grp = entity.Groups;
        if (grp) {
            grp.forEach((item) => {
                const g = new ColumnGroup(item);

                const columns = [];
                ObjExt.each(_fields, (columnCd, column) => {
                    if (column._groupCd === g._groupCd)
                        columns.push(column);
                });
                g.setColumns(columns);
                // todo: add columns to group here
                _groups.push(g);
            });
        }
        this._formatString = entity.FormatString;
        if (!this._formatString)
            Ex.raiseErrorFmtR(_res.NoFormatStringForEntity, this._entityCd);

        this._clientValidators = entity.ClientValidators || [];
        this._cFmtXml = entity.ConditionalFormatingParsed;
        this._propChXml = entity.OnPropertyChangedParsed;

        this._defaults = entity.Defaults;
        this._params = entity.Params;
        this._uiViews = entity.UIViews;
        this._subEntityColumnCd = this._params ? this._params.SubEntityCd : undefined;
        this._subTypeColCd = undefined;

        if (this._subEntityColumnCd) {
            const fld = _fields[this._subEntityColumnCd];
            if (fld)
                this._subTypeColCd = ArrExt.arrayFirstOrDefault(fld.getThisKey(), null);
        }
        this._views = undefined;
        this._groups = _groups;
        Sequences.setUid(this);

        // region async function generation
        this._condFormatFunc = undefined;
        this._propChFunc = undefined;
        this._formatFunction = undefined;
        this._entityReady = false;
        this._onEntityReady = [];

        const createFunctions = () => {
            // if (this._cFmtXml)
            //     this._condFormatFunc = parseFunc(this._cFmtXml, Ctx.getCondFmtCtx());
            // if (this._propChXml)
            //     this._propChFunc = parseFunc(this._propChXml, Ctx.getPropChangedCtx());

            addFmtMethods(this, this._formatString);
            _fieldsArr.forEach((field) => {
                field.initFormula();
            });
            this._entityReady = true;
            this._onEntityReady.forEach((callBack) => {
                callBack(this);
            });
        };

        if (!sync)
            AsyncExt.async2(createFunctions, this);
        else
            createFunctions();

        // endregion

        _fieldsArr.forEach((field) => {
            field.finalizeInit(this);
        });
        _fieldsArr.forEach((field) => {
            const e = field._entity;
            const fld = field.getParam("Field");

            if (fld) {
                const col = e.getColumn(fld);
                if (!col)
                    // tslint:disable-next-line:max-line-length
                    return LOG.warnFmt(R(_res.MissedMasterColumn), R(_res.NoMasterColumn), fld, e.getQuotedCaption(), field._caption);
                col.addDependency(field.getColumnCd());
            }

            const pp = field._partOfRef;
            const len = pp ? pp.length : 0;
            if (len === 0) return;

            for (let i = 0; i < len; i++) {
                const cd = pp[i];
                field.addDependency(cd);
                if (len === 1)
                    continue;
                const cc = e.getColumn(cd);
                const tk = cc.getThisKey();
                if (tk.length > 1)
                    cc.addNoClearOnEmpty(field.getColumnCd());
            }
        });
    }

    public onEntityReady(): Promise<Entity> {
        return new Promise<Entity>((resolve) => {
            if (this._entityReady)
                return resolve(this);
            this._onEntityReady.push(resolve);
        });
    }

    public getSubEntityColumnCd() {
        return this._subEntityColumnCd;
    }

    public getSubTypeColCd() {
        return this._subTypeColCd;
    }

    public getSets() {
        return this._sets;
    }

    public getSetsMd() {
        if (this.hasOwnProperty("_setsMd"))
            return this._setsMd;
        const fields = this._fields;
        this._setsMd = this._sets.map((col) => fields[col]);
        return this._setsMd;
    }

    public hasSets() {
        return this._sets.length > 0;
    }

    public getRefs() {
        return this._refs;
    }
    public getRefsMd() {
        if (this.hasOwnProperty("_refsMd"))
            return this._refsMd;

        const fields = this._fields;
        this._refsMd = this._refs.map((col) => fields[col]);
        return this._refsMd;
    }

    public hasRefs() {
        return this._refs.length > 0;
    }
    public canInsert() {
        return this._canInsert;
    }
    public canUpdate() {
        return this._canUpdate;
    }
    public canDelete() {
        return this._canDelete;
    }

    public getViewCd() {
        return this._viewCd;
    }
    public canCopy() {
        return this._canCopy;
    }
    public canSelect() {
        return this._canSelect;
    }
    public canSearch() {
        return this._canSearch;
    }
    public hasIdentity() {
        return this._hasIdentity;
    }

    public getAddFromRefColumns(parentRef) {
        if (this._hasIdentity) {
            // since we have identity we can add from any ref
            return this.getEditableColumns((columnCd) => {
                if (parentRef && parentRef.hasCachedValue(columnCd)) return;
                const col = this.getColumn(columnCd);
                return col.isRef() && col.getParam("DisableCreateFromRef") !== true;
            });
        }
        return this.getEditableColumns((columnCd) => {
            if (parentRef && parentRef.hasCachedValue(columnCd)) return;
            const col = this.getColumn(columnCd);
            return col.isPartOfPk();
        });
    }
    public getAddFromRefColumnsMd(parentRef) {
        const cols = this.getAddFromRefColumns(parentRef);
        const fields = this._fields;
        return cols.map((colCd) => fields[colCd]);
    }
    public getGroups() {
        return this._groups;
    }
    public hasGroups() {
        return this._groups.length > 0;
    }

    public canUpdateColumn(name, record) {
        if (record && record.isCopied()) return true;
        if (record && record.isInserted())
            return this._canInsert && this.canChangeColumnOnAdd(name);
        return this._canUpdate && this.canEditColumn(name);
    }

    public getCheckOnUpdateColumnsCd() {
        return this._checkOnUpdate ? this._checkOnUpdate : this._keys;
    }
    public getCheckOnDeleteColumnsCd() {
        return this._checkOnDelete ? this._checkOnDelete : this._keys;
    }
    public canEditColumn(name) {
        return this._updatableFields.hasOwnProperty(name);
    }

    public canChangeColumnOnAdd(name) {
        return this._canChangeOnAddFields.hasOwnProperty(name);
    }

    public getCondFormatFunc() {
        return this._condFormatFunc;
    }
    public propChanged(record, columnCd) {
        if (!this._propChFunc) return;

        const propChFunc = this._propChFunc;

        AsyncRes.execAsyncFunc(propChFunc, () => {
            AsyncRes.execAsyncFunc(propChFunc, undefined, record, columnCd);
        }, record, columnCd);
    }

    public setDefValue(columnCd, value) {
        if (!this._defaults)
            this._defaults = {};
        this._defaults[columnCd] = value;
        return this;
    }

    public getDefault(columnCd) {
        return this._defaults[columnCd];
    }

    /**
     * @param {MD.Record} record
     */
    public setDefaults(record) {
        if (!record)
            return Ex.raiseErrorR(_res.ErrorApplyDefaultsToEmpty);

        const locked = record.lockDependencies();
        ObjExt.objectEachSimple(this._defaults, (name, value) => record.set(name, value));

        ObjExt.objectEachSimple(this._fields, (cd, column) => {
            if (!column.isField() || !record.isEmpty(cd)) return; // already has value for this field
            const v = column.getDefValue(record);
            if (!Types.isEmpty(v))
                record.set(cd, v);
        });
        if (locked)
            record.unlockDependencies();
    }

    /**
     * @param {Function} fn
     * @param {Object} [scope] - optional will be available as this in callback
     */
    public forEachColumn(fn, scope?) {
        if (scope)
            return ObjExt.objectEach(this._fields, fn, scope);
        ObjExt.objectEachSimple(this._fields, fn);
    }

    public eachUpdatableColumn(fn, scope?) {
        if (scope)
            return ObjExt.objectEach(this._updatableFields, fn, scope);
        ObjExt.objectEachSimple(this._updatableFields, fn);
    }

    public eachCanChangeOnAddColumn(fn, scope) {
        if (scope)
            return ObjExt.objectEach(this._canChangeOnAddFields, fn, scope);
        ObjExt.objectEachSimple(this._canChangeOnAddFields, fn);
    }

    /**
     * @param {Function} fn
     * @param visibleOnly
     * @returns {boolean}
     */
    public anyColumn(fn, visibleOnly) {
        return ObjExt.objectAny(visibleOnly ? this.getVisibleColumnsMd() : this._fields, fn);
    }

    public getColumnByCaption(caption) {
        const cd = ObjExt.objectFirst(this._fields, (_cd, column) => column.getCaption() === caption);
        return this._fields[cd];
    }

    public findColumnMd(fn, visibleOnly) {
        const arr = visibleOnly ? this.getVisibleColumnsMd() : this._fieldsArr;
        return ArrExt.arrayFirst(arr, fn);
    }

    public findColumns(fn, visibleOnly): EntityColumn[] {
        return ObjExt.objectToArray(visibleOnly ? this.getVisibleColumnsMd() : this._fields, (cd, col) => !fn || fn(cd, col) ? col : undefined);
    }

    public getColumnOrFirst(columnCd, fn) {
        const column = columnCd ? this.getColumn(columnCd) : undefined;
        return column && fn(columnCd, column) ? column : this.findColumnMd(fn, true);
    }

    public getColumnCdOrFirst(columnCd, fn) {
        const col = this.getColumnOrFirst(columnCd, fn);
        return col ? col.getColumnCd() : null;
    }

    /**
     * @returns {Array.<string>}
     */
    public getVisibleColumns() {
        return this._visibleColumns;
    }
    public getCalcColumns() {
        return this._calcFields;
    }

    public getVisibleColumnsMd(): EntityColumn[] {
        if (this.hasOwnProperty("_visibleColumnsMd"))
            return this._visibleColumnsMd;

        const flds = this._fields;
        this._visibleColumnsMd = this._visibleColumns.map((columnCd) => flds[columnCd]);
        return this._visibleColumnsMd;
    }

    public getQuickAddColumns() {
        if (this.hasOwnProperty("_quickAddColumnsMd"))
            return this._quickAddColumnsMd;

        const flds = this.getVisibleColumnsMd();
        const cols = flds.map((field) => field.isQuickAdd() ? field : undefined);
        this._quickAddColumnsMd = Types.isEmpty(cols) ? flds : cols;
        return this._quickAddColumnsMd;
    }

    public getNotQuickAddColumns() {
        if (this.hasOwnProperty("_notQuickAddColumnsMd"))
            return this._notQuickAddColumnsMd;

        const flds = this.getVisibleColumnsMd();
        const anyQuickAdd = flds.some((field) => field.isQuickAdd());

        if (!anyQuickAdd) {
            this._notQuickAddColumnsMd = null;
            return null;
        }

        this._notQuickAddColumnsMd = flds.map((field) => field.isNullable() && field.canInsert() ? field : undefined);
        return this._notQuickAddColumnsMd;
    }

    public eachVisibleColumn(fn) {
        const flds = this._fields;
        return this._visibleColumns.map((columnCd) => {
            const f = flds[columnCd];
            return fn(columnCd, f);
        });
    }

    public getEditableColumns(checkFunc) {
        // tslint:disable-next-line:max-line-length
        return this._visibleColumns.map((col) => this.canEditColumn(col) ? (checkFunc ? (checkFunc(col) ? col : null) : col) : null);
    }

    public getColumnsForAdd(checkFunc) {
        return this._visibleColumns.map((columnCd) => {
            return this.canChangeColumnOnAdd(columnCd) ? (checkFunc ? (checkFunc(columnCd) ? columnCd : null) : columnCd) : null;
        });
    }

    /**
     * @returns {Array.<string>}
     */
    public getKeys() {
        return this._keys;
    }

    public isIdentityPk() {
        return this._keys.some((cd) => {
            const f = this._fields[cd];
            return f.isIdentity();
        });
    }

    /**
     * @param {Record} record
     * @return {Object}
     */
    public validate(record) {
        return ObjExt.objectCopy(this._fields, (n, f) => {
            return f.validate(record);
        });
    }

    /**
     * @param {Record|Object} record
     * @returns {Filter}
     */
    public getKeyCondition(record) {
        // TODO: implement FILTER
        // Ex.raiseErrorIfFmt(!this._keys || this._keys.length === 0, R(_res.NoKeyDefined), this._entityCd);
        // return FILTER.getKeyCondition(this._keys, record);
    }

    public validateKey(key) {
        const errors = [];
        const entity = this;
        this._keys.forEach((k) => {
            const v = key[k];
            if (Types.isNullOrUndefined(v))
                return errors.push(Fmt.formatR(_res.NoKeyColumnValue, this.getColumn(k).getCaption()));
        });

        ObjExt.objectEachSimple(key, (cd, value) => {
            if (this._keys.indexOf(cd) < 0)
                return errors.push(Fmt.formatR(_res.NoSuchColumnInKey, cd));
            const col = this.getColumn(cd);
            const e = col.validateValue(value);
            if (e)
                errors.push(e);
        });
        return errors.length === 0 ? undefined : errors;
    }

    public getVisibleColumn(name) {
        const f = this._fields[name];
        if (!f || !f.isVisible()) return null;
        return f;
    }

    /**
     * @returns {Object} Columns list
     */
    public getColumns() {
        return this._fields;
    }
    public getColumnArray() {
        return this._fieldsArr;
    }

    public getColumnGroup(groupCd) {
        if (Types.isEmpty(groupCd) || !this._groups) return undefined;
        return this._groups.find((group) => group._groupCd === groupCd);
    }

    /**
     * @param {String} groupCd
     * @returns {String|undefined}
     */
    public getColumnGroupCaption(groupCd) {
        const g = this.getColumnGroup(groupCd);
        return g ? g._caption || groupCd : undefined;
    }

    public getParam(name) {
        return this._params ? this._params[name] : undefined;
    }

    public getDuplicatedColumns() {
        const paths = this.getParam("DuplicatedColumns");

        const getPathAsObject = (pp, root) => {
            if (Types.isEmptySwsValue(pp)) return;
            const e = pp[0];
            let p = root[e];
            if (Types.isEmpty(p))
                root[e] = p = {};
            pp.splice(0, 1);
            getPathAsObject(pp, p);
        };

        const cols = {};
        paths.forEach((path) => {
            getPathAsObject(path.split("."), cols);
        });

        return cols;
    }
    public getBulkUpdateColumns() {
        const columns = this.getParam("BulkUpdateColumns") || this.getVisibleColumns();
        return columns.map((cd) => {
            const column = this.getColumn(cd);
            return column && (column as EntityColumn).canBulkUpdate() ? cd : undefined;
        });
    }
    public getViews() {
        if (this._views === undefined)
            this._views = this.getParam("views") || this._uiViews;
        return this._views;
    }
    public canUseView(cd) {
        const limit = this.getParam("limitViews");
        return limit ? this.getViews().includes(cd) : true;
    }
}
