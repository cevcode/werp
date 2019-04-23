import * as FnExt from "../func-extension";
import { BaseColumn } from "./base-column";

export function createColumn(props) {
    return new EntityColumn(props);
}

export class EntityColumn extends BaseColumn {
    public _flags;
    public _domain;

    public _canEdit;
    public _canSort;
    public _canInsert;
    public _canUpdate;
    public _canResize;
    public _isIdentity;
    public _canGroup;
    public _canCopy;
    public _lValues;

    public _editMask;
    public _groupCd;

    constructor(props) {
        super(props);
        const _flags = (props.Flags || "").toUpperCase();
        this._flags = _flags;
        this._canEdit = _flags.contains("E") && !this.isCalc();
        this._canInsert = _flags.contains("A") || this._canEdit;
        this._canSort = _flags.contains("O");
        this._canResize = _flags.contains("W");
        this._isIdentity = _flags.contains("I");
        this._canGroup = _flags.contains("G");
        this._canCopy = _flags.contains("C");

        this._editMask = props.EditMask;
        this._domain = props.DomainCD;
        this._groupCd = props.FieldGroupCD;
    }

    public toString() {
        return this.getCaption();
    }
    public finalizeInit(entity) {
        this.finalizeInitRefs(entity);

        const rcols = this.getParam("RefreshColumns");
        if (rcols)
            rcols.forEach((cd) => this.addDependency(cd));
        this.finalizeFilter(entity);
    }
    public getGroupCd() {
        return this._groupCd;
    }
    public getMainColumns() {
        return this._mainCols;
    }

    public isIdentity() {
        return this._isIdentity;
    }
    public isQuickAdd() {
        return this._canInsert && !this._isNullable;
    }
    public canAutoAdd() {
        return this._isNullable || this._isIdentity;
    }
    public canInsert() {
        return this._canInsert;
    }
    public canEdit() {
        return this._canEdit;
    }
    public canCopy() {
        return this._canCopy && !this._isIdentity && !this.isPk();
    }
    public canBulkUpdate() {
        return this._visible && this._canEdit && !this._isIdentity && !this.isPk();
    }
    public setListOfValues(values) {
        this._lValues = values;
    }
    public getListOfValues(record, callback) {
        FnExt.safeCall(this, callback, this._lValues);
    }
}
