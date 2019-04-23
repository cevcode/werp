import * as C from "../console";
import * as Ex from "../exceptions";
import * as FnExt from "../func-extension";
import * as CellOptions from "./cell-options";
import * as Const from "./const";
import * as Strings from "../str-extension";
import * as Types from "../types-utils";

import { DEF } from "../resources";
import { BaseColumn } from "./base-column";

export const _res = {
    NoColumnInGetOptions: DEF("Entity.NoColumnInGetOptions", "Column not specified in get record options"),
};

export class BaseEntity {
    public _entityCd: string;

    public _canSelect: boolean;
    public _canUpdate: boolean;
    public _canInsert: boolean;
    public _canDelete: boolean;

    public _caption: string;

    public _visibleColumns: string[];
    public _fields: {BaseColumn};
    public _fieldsArr: BaseColumn[];
    public _sets;
    public _refs;
    public _updatableFields;

    public _calcFields: string[];
    public _keys: string[];
    public _groups;
    public _defaults;

    public _formatString;
    public _validate;
    public _condFmtFunc;

    public toString() {
        return this._caption + "(" + this._entityCd + ")";
    }

    /**
     * @param {string} name
     * @returns {boolean} entity contain column with required name
     */
    public hasColumn(name: string): boolean {
        return this._fields.hasOwnProperty(name);
    }

    /**
     * Return column by name
     * @param {string} name
     * @returns {Column}
     */
    public getColumn(name: string): BaseColumn {
        return this._fields[name];
    }

    public getVisibleColumns(): string[] {
        return this._visibleColumns;
    }

    public getEntityCd(): string {
        return this._entityCd;
    }

    public getCaption(): string {
        return this._caption;
    }
    public getQuotedCaption(): string {
        return Strings.getQuotedString(this._caption);
    }

    /**
     * @param {String} columnCd
     * @param {Record} record
     * @returns {CellOptions}
     */
    public getOptions(columnCd: string, record, isRo: boolean): CellOptions.CellOptions {
        // TODO: should be allowed custom function here
        let s;
        let c;
        let b;
        let d;
        let ro = true;
        let a;
        let cls;
        let empty;
        let loading = false;

        let column;
        // const column = this.getColumn(columnCd, true);
        if (columnCd) {
            column = this.getColumn(columnCd);
            if (columnCd !== Const.toStringColumn) {
                if (Types.isNullOrUndefined(column))
                    Ex.raiseErrorR(_res.NoColumnInGetOptions);
                // d = !column.canEdit();
                cls = column.getClass(record);
                loading = column.isNotLoaded && column.isNotLoaded(record);
                empty = record.isEmpty(columnCd);
                a = column.getAlign(record);
                if (!column) {
                    ro = true;
                } else {
                    if (record.isInserted()) {
                        ro = !column.canInsert();
                    } else {
                        ro = !column.canEdit();
                        if (!ro && column.isPk && column.isPk())
                            ro = true;
                    }
                }

            } else {
                if (column)
                    loading = column.isNotLoaded && column.isNotLoaded(record);
            }
        }
        const condFormatFunc = FnExt.callByName(this, "getCondFormatFunc");

        const onCompleteCondFormat = () => {
            // var mode = !Types.isNullOrUndefined(ro) && isRo !== ro ? ro : isRo;
            record.updateCachedOptions(columnCd);
        };

        if (condFormatFunc) {
            try {
                const oo = condFormatFunc(onCompleteCondFormat, record, columnCd, null);
                if (Types.isNullOrUndefined(oo)) {
                    s = condFormatFunc(onCompleteCondFormat, record, columnCd, "style");
                    d = /*d || */ condFormatFunc(onCompleteCondFormat, record, columnCd, "disable");
                    c = condFormatFunc(onCompleteCondFormat, record, columnCd, "color");
                    b = condFormatFunc(onCompleteCondFormat, record, columnCd, "background");
                    ro = ro || condFormatFunc(onCompleteCondFormat, record, columnCd, "ro");
                } else {
                    s = oo.style;
                    d = oo.disable;
                    c = oo.color;
                    b = oo.background;
                    ro = ro || oo.ro;
                }
            } catch (e) {
                C.handleException(e);
            }
        }
        const changed = !ro && record && record.wasChanged(columnCd);
        const opt = CellOptions.buildOptions(ro, d, c, b, s, null, null, a, cls, empty, loading, changed);
        if (columnCd !== Const.toStringColumn) {
            if (!isRo && !ro)
                FnExt.callByName(column, "parseColFilter", record, (f) => {
                    opt.colFilter = f;
                });
        }
        return opt;
    }

}
