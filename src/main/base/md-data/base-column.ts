import * as ArrExt from "../arr-extension";
// TODO: import FILTER
import { FmtRes } from "../formatter";
import * as Fmt from "../formatting";
import * as FnExt from "../func-extension";
import LOG from "../logger/logger";
import * as LV from "../lvalue";

import Agg from "./data/agg";
import * as Data from "./data/data";
import FieldType, * as FieldTypes from "./data/field-type";
import * as Strings from "../str-extension";
import * as Types from "../types-utils";

import { DEF, R } from "../resources";
import { getFieldType } from "./field-types";

export const _res = {
    ColumnRequired: DEF("Entity.ColumnRequired", "[{0}] is required"),
    FormulaInOldFormat: DEF("Entity.FormulaInOldFormat", "Old format formula for [{0}.{1}]"),
    IncorrectFormula: DEF("Entity.IncorrectFormula", "Incorrect formula for [{0}.{1}]"),
    InvalidRef: DEF("Entity.InvalidRef", "Incorrect entity ref metadata"),
    NoField: DEF("Entity.NoField", "Field [{0}] not defined in entity [{1}]"),
    NoRightToUpdateColumn: DEF("Entity.NoRightToUpdateColumn", "No right update [{0}] in {1}"),
};

export function getCalcFieldCtx() {
    // return PARSER.getNamedCtx(nmGetCalcFieldCtx);
}

function calcNewFormula(columnMd, formula) {
    // try {
    //     columnMd._formula = EXPR.getCalcFunction(formula);
    //     if (columnMd.isCalc())
    //         columnMd.updateCalc = columnMd._formula;
    //     else {
    //         const getDefValue = columnMd.getDefValue;
    //         columnMd.getDefValue = (record) => {
    //             const v = columnMd._formula(record);
    //             if (!Types.isNullOrUndefined(v))
    //                 return v;
    //             return getDefValue.call(columnMd);
    //         };
    //     }
    // } catch (ex) {
    //     logParseError(columnMd, ex);
    // }
}

function logParseError(columnMd, ex) {
    // LOG.error(Fmt.formatR(_res.IncorrectFormula, columnMd._entityCd, columnMd._columnCd), ex.message);
}

export type ValidateColumnFunc = (value: any, caption: string, columnMd: BaseColumn) => string;

export class BaseColumn {
    public _columnCd: string;
    public _path: string;
    public _caption: string;
    public _tooltip: string;
    public _orderNum: number;
    public _format: string;
    public _fieldTypeCd: string;
    public _dataTypeCd: string;
    public _precision: number;
    public _length: number;
    public _params: object;
    public _isNullable: boolean;
    public _visible: boolean;
    public _isPk: boolean;
    public _isPartOfPk: boolean;
    public _isCalc: boolean;
    public _isRef: boolean;
    public _isSet: boolean;
    public _isField: boolean;
    public _isReadonly: boolean;
    public _refEntity;
    public _thisKey;
    public _otherKey;
    public _isParentChild: boolean;
    public _invalidRef;
    public _entity;
    public _entityCd: string;
    public _formula;
    public _dependentCols;
    public _emptyValue;
    public _visLen: number;
    public _validate: ValidateColumnFunc;
    public _class: string;
    public _align: string;
    public f;
    public unfmf; // todo: name???
    public _defaultWidth: number;
    public _maxLineCount: number;
    public _minLineCount: number;
    public _defLineCount: number;
    public valuePreprocessor;
    // public _title;

    public toNative;
    public serialize;
    public deserialize;
    public _getSerialized;
    public _getDeserialized;
    public validateOp;
    // tslint:disable-next-line:variable-name
    public __fParsed;
    // tslint:disable-next-line:variable-name
    public __formula;
    public _filter;
    public _filterParsed;
    public _mainCols;
    public _partOfRef: [string];
    public _fixedSize: boolean;
    public updateCalc;
    public title;

    public _checkRefValue;
    public _noClearOnEmpty: [string];
    public _isIdentity: boolean;

    constructor(column) {
        this._columnCd = column.ColumnCD;
        this._path = column.Path || this._columnCd;
        this._caption = column.Caption || this._columnCd;
        this._tooltip = column.ToolTip;
        this._orderNum = column.OrderNum;
        this._format = column.DisplayFormat;
        this._fieldTypeCd = Strings.getNotEmptyLowerCase(column.FieldTypeCD);
        this._dataTypeCd = Strings.getNotEmptyLowerCase(column.DataTypeCD);
        this._precision = column.Precision;
        this._length = column.Length;
        this._params = column.Params;
        this._isNullable = column.IsNullable;
        this._visible = column.Visible;
        this._isPk = !!column.IsPK;
        this._isPartOfPk = this._isPk;
        this._isCalc = this._dataTypeCd === "_calc";
        this._isRef = this._dataTypeCd === "_ref";
        this._isSet = this._dataTypeCd === "_set";
        this._isField = !(this._isCalc || this._isRef || this._isSet);
        this._isReadonly = this._isCalc || column.IsReadonly || false;
        // calculated fields are always readonly
        this._dependentCols = [];
        this._emptyValue = R(FmtRes.emptyValue);

        this._visLen = this._isRef && (!this._length || this._length > 30) ? 30 : this._length;

        if (this._isRef || this._isSet) {
            this._refEntity = column.RefEntityCD;
            this._otherKey = column.OtherKey ? column.OtherKey.split(",") : undefined;
        }
        this._thisKey = column.ThisKey ? column.ThisKey.split(",") : undefined;

        const r = Data.getColumnFormat(this);
        if (r._formatStr)
            this._format = r._formatStr;
        this._validate = r.validate;
        this._class = r._class;
        this._align = r._align;

        this.f = r._format;
        this.unfmf = r._unformat;
        this._defaultWidth = r._defaultWidth;
        this._maxLineCount = r.maxLineCount;
        this._minLineCount = r.minLineCount;
        this._defLineCount = r.defaultLineCount;
        this.valuePreprocessor = r.valuePreprocessor;

        const t = r.title || this.f;
        this.title = (value, rec, fValue) => {
            return Types.isEmpty(value) ? R(FmtRes.emptyValue) : t ? t(value, rec, fValue, this) : fValue;
        };
        this.toNative = r.toNative;
        this.serialize = r.serialize;
        this.deserialize = r.deserialize;
        this._getSerialized = (v) => {
            return Types.isMethod(this.serialize) ? this.serialize(v) : v;
        };
        this._getDeserialized = (v) => {
            return Types.isMethod(this.deserialize) ? this.deserialize(v) : v;
        };
        this.validateOp = r.validateOp;
        this.__fParsed = column.FormulaParsed;
        this.__formula = column.Formula;
        this._filter = column.Filter;
        this._filterParsed = undefined;
        this._mainCols = [this._columnCd];
        this._partOfRef = undefined;
        this._fixedSize = column.FixedSize;
        // if(fParsed || formula)
        //     this.initFormula(fParsed, formula);
    }

    private logParseError(ex) {
        LOG.error(Fmt.formatR(_res.IncorrectFormula, this._entityCd, this._columnCd), ex.message);
    }

    public initFormula() {
        const fParsed = this.__fParsed;

        if (fParsed) {
            const ctx = getCalcFieldCtx();
            try {
                // TODO: parse formula
                // this._formula = ctx.createFunc(fParsed);
                LOG.info("Old format formula", Fmt.formatR(_res.FormulaInOldFormat, this._entityCd, this._columnCd));
            } catch (ex) {
                this.logParseError(ex);
            }
        } else {
            const formula = this.__formula;
            if (Strings.isEmptyOrWhiteSpace(formula))
                return;

            // Sws.async(function () {
            calcNewFormula(this, formula);
            // });
        }
    }

    public getColumnCd(): string {
        return this._columnCd;
    }

    public getQuotedCaption(): string {
        return Strings.getQuotedString(this._caption);
    }

    public getPath(): string {
        return this._path;
    }

    public getCaption() {
        return this._caption;
    }
    public getTooltip() {
        return this._tooltip;
    }
    public toString() {
        return this.getCaption();
    }

    public isVisible(): boolean {
        return this._visible;
    }
    public isNullable(): boolean {
        return this._isNullable;
    }

    public getVisLen(): number {
        return this._visLen;
    }

    public isPk(): boolean {
        return this._isPk;
    }

    public isPartOfPk(): boolean {
        return this._isRef && this._isPartOfPk;
    }

    public isField(): boolean {
        return this._isField;
    }

    public isRef(): boolean {
        return this._isRef;
    }

    public isSet(): boolean {
        return this._isSet;
    }

    public isCalc(): boolean {
        return this._isCalc;
    }

    public isParentChild(): boolean {
        return this._isParentChild;
    }

    public isRequired(addMode): boolean {
        return (addMode && FnExt.callByName(this, "canInsert") || !addMode && FnExt.callByName(this, "canEdit")) && !this._isNullable;
    }

    public getPrecision(): number {
        return this._precision;
    }

    public getLength(): number {
        return this._length;
    }

    public getDefValue(): any {
        return this._isNullable ? null : Data.getFieldTypeDefault(this._fieldTypeCd);
    }

    public getFieldTypeCd(): string {
        return this._fieldTypeCd;
    }

    public getFieldType(): FieldType {
        return getFieldType(this._fieldTypeCd);
    }

    public getDataTypeCd(): string {
        return this._dataTypeCd;
    }

    public getBaseTypeCd(): string {
        const ft = this.getFieldType();
        return ft ? ft.getBaseTypeCd() : undefined;
    }

    public getRefEntity() {
        return this._refEntity;
    }
    public getThisKey() {
        return this._thisKey;
    }
    public getOtherKey() {
        return this._otherKey;
    }
    public getRefColumns() {
        return ArrExt.arrayAdd([this._columnCd], this._thisKey);
    }
    public getColumnAsLValue(caption) {
        const cls = FieldTypes.getColumnTypeUiClass(this._fieldTypeCd, this._dataTypeCd);
        const s = caption && caption !== this._caption ? Fmt.format("{0} ({1})", caption, this._caption) : this._caption;
        return LV.createLValueExt(this._columnCd, s, cls);
    }

    public isSupportAgg(aggregation): boolean {
        if (this._isSet)
            return aggregation === Agg.group || aggregation === Agg.count;

        if (aggregation === Agg.count) return true;
        const t = this.getFieldType();
        return t && t.supportAgg(aggregation);
    }

    public isSupportFunc(uFunction): boolean {
        const t = this.getFieldType();
        return t && t.supportFunc(uFunction);
    }

    public useStringInFilter(): boolean {
        const t = this.getFieldType();
        return t && t._useStringInFilter;
    }

    public supportFilter(op): boolean {
        const t = this.getFieldType();
        return Types.isNullOrUndefined(t) || t.supportFilter(op);
    }

    public getParam(param) {
        return !this._params ? undefined : this._params[param];
    }

    public setParams(params) {
        this._params = params;
        return this;
    }

    public getLoadedFileMaxSize(): number {
        return this.getParam("FileMaxSize");
    }

    public getRefEntityParam(): string {
        return this.getParam("refEntityCd");
    }

    public getThisKeyParam() {
        return this.getParam("thisKey");
    }

    public getOtherKeyParam() {
        return this.getParam("otherKey");
    }

    public getRelationType() {
        return this.getParam("oneToMany");
    }

    public getFormatStr() {
        return this._format;
    }

    public getPlaceholder() {
        return this._format;
    }

    public setBadMetadata(tooltip) {
        this._class = (Types.isEmpty(this._class) ? "" : "bad-metadata ") + this._class;
        this._tooltip = tooltip;
    }

    public finalizeInitRefs(entity, noPkValidation: boolean = false) {
        this._entity = entity;
        this._entityCd = entity.getEntityCd();
        if (this._isRef) {
            this._isParentChild = this._entityCd === this._refEntity;
            const colCd = this._columnCd;
            this._invalidRef = this._thisKey && this._thisKey.some( key => {
                const col = entity.getColumn(key, true);
                if (Types.isNullOrUndefined(col))
                    return true;
                col.setPartOfRef(colCd);
                return false;
            });
        }
        if (this._invalidRef) {
            this.setBadMetadata(R(_res.InvalidRef));
        } else {
            if (!noPkValidation) {
                this._isPartOfPk = this._thisKey && this._thisKey.some( key => {
                    const col = entity.getColumn(key);
                    return col && col.isPk();
                });
            }
        }
        Data.finalizeInitColumn(this, entity);
    }

    public addNoClearOnEmpty(columnCd: string) {
        if (this._noClearOnEmpty === undefined)
            this._noClearOnEmpty = [columnCd];
        else
            this._noClearOnEmpty.push(columnCd);
    }

    public needClearOnEmpty(columnCd: string) {
        return this._noClearOnEmpty === undefined || this._noClearOnEmpty.indexOf(columnCd) === -1;
    }

    public setPartOfRef(refColCd: string) {
        if (this._partOfRef === undefined)
            this._partOfRef = [refColCd];
        else {
            if (this._partOfRef.indexOf(refColCd) === -1)
                this._partOfRef.push(refColCd);
        }
    }

    public getPartOfRefs() {
        return this._partOfRef;
    }

    public setEmptyValue(emptyValue: string) {
        this._emptyValue = emptyValue || R(FmtRes.emptyValue);
        return this;
    }

    public getEmptyValue() {
        return this._emptyValue;
    }

    public getClass() {
        return this._class;
    }

    public getHeaderClass(addMode?) {
        let r = this.isRequired(addMode) ? "required" : "";
        const isIdentity = FnExt.callByName(this, "isIdentity");
        if (!isIdentity)
            return r;
        if (r.length > 0)
            r += " ";
        return r + "generated";
    }

    public format(value, rec?): string {
        return Types.isEmpty(value) ? this._emptyValue : this.f ? this.f(value, rec) : value;
    }

    public formatInFilter(value) {
        if (Strings.isParameter(value))
            return value; //  FILTER.isFilteredByColumn(value) ? FILTER.formatFilterByColumn(this._entity, value)
        if (Strings.isRefColumn(value))
            return value;
        return this.format && !this.useStringInFilter() ? this.format(value) : value;
    }

    public unformat(value, rec) {
        return value === this._emptyValue ? undefined : (this.unfmf ? this.unfmf(value, rec) : value);
    }

    public unformatInFilter(value: string): any {
        const v = LV.getLValue(value);
        if (Strings.isParameter(v))
            return /*FILTER.isFilteredByColumn(v) ? FILTER.unFormatFilterByColumn(this._entity, value) :*/ v;
        if (Strings.isRefColumn(v))
            return v;
        return this.unformat && !this.useStringInFilter() ? this.unformat(value, true) : value;
    }

    public getSerialized(v) {
        if (this._getSerialized)
            return this._getSerialized(v);
        return Types.isMethod(this.serialize) ? this.serialize(v) : v;
    }

    public getDeserialized(v) {
        if (this._getDeserialized)
            return this._getDeserialized(v);
        return Types.isMethod(this.deserialize) ? this.deserialize(v) : v;
    }

    public getAlign(record) {
        return this._align;
    }

    public getDefaultWidth(): number {
        return this._defaultWidth;
    }

    public getMaxLineCount(): number {
        return this._maxLineCount;
    }
    public getMinLineCount(): number {
        return this._minLineCount;
    }
    public getDefaultLineCount(): number {
        return this._defLineCount;
    }

    public canChangeWidth(): boolean {
        return !this._fixedSize && !!this.getDefaultWidth();
    }

    public validate(record) {
        if (this._isSet || this._isCalc)
            return null; // we will not check sets here

        const can = this._entity.canUpdateColumn(this._columnCd, record);
        if (!can) {
            if (!this._isIdentity && record.wasChanged(this._columnCd))
                return Fmt.formatR(_res.NoRightToUpdateColumn, this._caption, this._entityCd);
            return null;
        }

        const value = record.get(this._columnCd);
        if (Types.isEmpty(value)) {
            if (!this._isIdentity && !this._isNullable && this._visible)
                return Fmt.formatR(_res.ColumnRequired, this._caption);
            return null;
        }

        const ft = this.getFieldType();
        if (ft && ft.validate) {
            const rr = ft.validate(value, this);
            if (!Types.isNullOrUndefined(rr))
                return rr;
        }

        if (this._validate) {
            const vv = this._validate(value, this._caption, this);
            if (!Types.isNullOrUndefined(vv))
                return vv;
        }
        return null;
    }
    public validateValue(value: any) {
        if (!this._validate)
            return;

        const vv = this._validate(value, this._caption, this);
        if (!Types.isNullOrUndefined(vv))
            return vv;
    }

    public addDependency(column) {
        if (!this._dependentCols.some((c) => c === column))
            this._dependentCols.push(column);
        return this;
    }
    public getDependencies() {
        return this._dependentCols;
    }
    public removeDependency(column) {
        if (!this._dependentCols) return;
        ArrExt.arrayRemove(this._dependentCols, column);
    }

    public parseColFilter(record, callback) {
        // TODO: implement FILTER
        // FILTER.parseFilter(this._filterParsed, record, callback);
    }

    public finalizeFilter(entity) {
        // TODO: implement FILTER
        // // this._filter = this.getParam('filter');
        // if (Types.isNullOrUndefined(this._filter)) return;
        // const columnMd = this;
        // try {
        //     const f = FILTER.deserializeFilter(this._filter);
        //     f.eachValue((condition) => {
        //         const cols = condition.getValuePath();
        //         if (Types.isEmpty(cols))
        //             return;
        //         const columnCd = cols[0];
        //         const col = entity.getColumn(columnCd);
        //         if (Types.isNullOrUndefined(col))
        //             Ex.raiseErrorFmtR(_res.NoField, columnCd, entity._entityCd);
        //         col.addDependency(columnMd._columnCd);
        //         columnMd._mainCols.push(columnCd);
        //     });
        //     this._filterParsed = f;
        // } catch (e) {
        //     Ex.raiseErrorFmt("Error applying filter to column {0} in entity {1}: {2}", columnMd._columnCd, columnMd._entityCd, e);
        // }
    }
}
