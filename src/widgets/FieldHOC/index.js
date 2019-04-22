import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { withFormsy } from 'formsy-react';
import { Column } from 'ui/Layout';
import style from './style.scss';

function Label({ text, error }) {
    return <p className={cx(style.field__label, error && style.field__error)}>{text || error}</p>;
}

const FieldWrapperHOC = Component => {
    if (!Component) {
        return 'no component pasted';
    }

    class Wrapped extends React.Component {
        constructor(props) {
            super(props);
        }

        changeValue = event => {
            const { setValue } = this.props;
            setValue(event.currentTarget.value);
        };

        render() {
            const { label, getErrorMessage, getValue, margin } = this.props;
            const error = getErrorMessage();
            return (
                <Column className={cx(style.field, style[`field__margin_${margin}`])}>
                    {label && <Label text={label} />}
                    <Component {...this.props} onChange={this.changeValue} value={getValue() || ''} />
                    {error && <Label error={error} />}
                </Column>
            );
        }
    }
    return withFormsy(Wrapped);
};

FieldWrapperHOC.PropTypes = {
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};

FieldWrapperHOC.defaultProps = {
    label: false,
    error: false,
};

export { FieldWrapperHOC };
