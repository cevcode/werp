import * as React from "react";
import cx from "classnames";
import { withFormsy } from "formsy-react";
import { Column } from "ui/Layout";

import "./style.scss";
import * as style from "./style.scss";

type StringOrBool = string | boolean;

export interface ILabel {
    text?: StringOrBool;
    error?: StringOrBool;
}

// tslint:disable-next-line:variable-name
const Label: React.FC<ILabel> = ({ text, error }) => {
    return <p className={cx(style.field__label, error && style.field__error)}>{text || error}</p>;
};

export interface IFieldWrapperHOC {
    label: StringOrBool;
    error: StringOrBool;
    getErrorMessage: () => StringOrBool;
    margin: any;
    getValue: () => any;
    setValue: (value) => void;
}

// tslint:disable-next-line:variable-name
const FieldWrapperHOC = (Component) => {
    if (!Component) {
        return "no component pasted";
    }

    class Wrapped extends React.Component <IFieldWrapperHOC>{
        constructor(props) {
            super(props);
        }

        private changeValue = event => {
            const { setValue } = this.props;
            setValue(event.currentTarget.value);
        }

        public render() {
            const { label, getErrorMessage, getValue, margin } = this.props;
            const error = getErrorMessage();
            return (
                <Column className={cx(style.field, style[`field__margin_${margin}`])}>
                    {label && <Label text={label} />}
                    <Component {...this.props} onChange={this.changeValue} value={getValue() || ""} />
                    {error && <Label error={error} />}
                </Column>
            );
        }
    }
    return withFormsy(Wrapped);
};

FieldWrapperHOC.defaultProps = {
    label: false,
    error: false,
};

export { FieldWrapperHOC };
