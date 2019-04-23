export class ColumnGroup {

    public _groupCd;
    public _caption;
    public _orderNum;
    public _columns;

    constructor(props) {
        this._groupCd = props.FieldGroupCD;
        this._caption = props.Caption;
        this._orderNum = props.OrderNum;
    }

    public setColumns(columns) {
        this._columns = columns;
    }
    public getColumns() {
        return this._columns;
    }
    public getCaption() {
        return this._caption || this._groupCd;
    }
}
