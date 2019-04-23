import * as Fmt from "../../formatting";
import * as Types from "../../types-utils";

import { DEF } from "../../resources";
import { getFieldType } from "../field-types";

import Agg from "./agg";
import * as DataTypes from "./data-type";
import * as FieldTypes from "./field-type";

export const _res = {
    ValueExceedsLength: DEF("Entity.ValueExceedsLength", "[{0}] exceeds max length {2}"),
    ValueGreaterThanMax: DEF("Entity.ValueGreaterThanMax", "[{0}] should be < {2}."),
    ValueLessThanMin: DEF("Entity.ValueLessThanMin", "[{0}] should be > {2}."),
};

export function getColumnTypeUiClass(fieldTypeCd, dataTypeCd) {
    let cls = "icon ColumnType ";
    if (fieldTypeCd) {
        const fieldType = getFieldType(fieldTypeCd.toLowerCase());
        if (fieldType)
            cls += fieldType._typeCd + (fieldType.isSet() ? " set" : (fieldType.isRef() ? " ref" : ""));
    }
    if (!dataTypeCd)
        return cls;

    if (DataTypes.isRef(dataTypeCd)) {
        cls += " ref ";
        return cls;
    }
    if (DataTypes.isSet(dataTypeCd))
        cls += " set ";
    return cls;
}

export default class FieldType {
    public _agg;
    public _f;
    public _typeCd;
    public _dataTypeCd;
    public _isRef;
    public _isSet;
    public _typeName;
    public _baseTypeCd;
    public _params;
    public _useStringInFilter;

    constructor(fieldType) {
        const _flt = (fieldType.FilterOperations || "").split(",");
        const _f = {};
        _flt.map((v) => {
            _f[v.trim().toLowerCase()] = true;
        });

        this._agg = fieldType.SupportedAgg || "";
        this._f = _f;
        this._typeCd = fieldType.FieldTypeCd;
        this._dataTypeCd = fieldType.DataTypeCd;
        this._isRef = DataTypes.isRef(this._dataTypeCd);
        this._isSet = DataTypes.isSet(this._dataTypeCd);
        this._typeName = fieldType.FieldTypeName;
        this._baseTypeCd = fieldType.BaseTypeCd;
        this._params = fieldType.Params;
        this._useStringInFilter = fieldType.UseStringInFilter;
    }

    public getCaption() {
        return this._typeName;
    }
    public supportFilter(operation) {
        if (Types.isEmptySwsValue(this._f)) return true;
        return this._f[operation] === true;
    }
    public isRef() {
        return this._isRef;
    }
    public isSet() {
        return this._isSet;
    }
    public supportAgg(agg) {
        switch (agg) {
            case Agg.avg: return this._agg.indexOf("a") > -1;
            case Agg.sum: return this._agg.indexOf("s") > -1;
            case Agg.min: return this._agg.indexOf("i") > -1;
            case Agg.max: return this._agg.indexOf("m") > -1;
            case Agg.count: return true; // _agg.indexOf('c') > -1; // not sure that always count should be supported
            default:
                return false;
        }
    }
    public supportFunc(uFunction) {
        return uFunction._baseTypeCd === this._baseTypeCd;
    }
    public validate(value, col) {
        if (!col) return undefined;

        switch (this._baseTypeCd) {
            case "number":
            case "date":
            case "time":
                return this.validateMinMax(value, col);
            case "string":
                return this.validateLen(value, col);
        }
    }
    public validateLen(value, col) {
        if (!col || Types.isNullOrUndefined(value)) return;

        const len = value.toString().length;
        const maxLen = col._length;
        if (!Types.isNullOrUndefined(maxLen) && len > maxLen)
            return Fmt.formatR(_res.ValueExceedsLength, col._caption, this._typeName, maxLen);
    }
    public validateMinMax(value, col) {
        if (!col) return;

        const max = col.getParam("max");
        const min = col.getParam("min");
        if (!Types.isNullOrUndefined(min) && value < min)
            return Fmt.formatR(_res.ValueLessThanMin, col._caption, this._typeName, min);
        if (!Types.isNullOrUndefined(max) && value > max)
            return Fmt.formatR(_res.ValueGreaterThanMax, col._caption, this._typeName, max);
    }
    public getDataTypeCd() {
        return this._dataTypeCd;
    }
    public getBaseTypeCd() {
        return this._baseTypeCd;
    }
    public getUiClass() {
        return FieldTypes.getColumnTypeUiClass(this._typeCd, this._dataTypeCd);
    }
}
