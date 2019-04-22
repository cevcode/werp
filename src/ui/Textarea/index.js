import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import style from './style.scss';

function Textarea({
    value,
    onBlur,
    onClick,
    onFocus,
    onChange,
    disabled,
    extraClass,
    placeholder,
    onEnterPress,
    name,
    id,
    autoComplete,
    required,
}) {
    const className = cx(style['ux-textarea'], { [style['ux-textarea_disabled']]: disabled }, extraClass);

    const _handleKeyPress = e => {
        if (e.key === 'Enter') {
            onEnterPress();
        }
    };
    return (
        <textarea
            id={id}
            name={name}
            value={value}
            onBlur={onBlur}
            onClick={onClick}
            onFocus={onFocus}
            disabled={disabled}
            className={className}
            autoComplete={autoComplete}
            placeholder={placeholder}
            onKeyPress={_handleKeyPress}
            onChange={onChange}
            required={required}
        />
    );
}

Textarea.propTypes = {
    type: PropTypes.string,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autoComplete: PropTypes.string,
    id: PropTypes.string,
    required: PropTypes.bool,
};

Textarea.defaultProps = {
    disabled: false,
    autoComplete: '',
    id: null,
    onClick: i => i,
    onChange: i => i,
    placeholder: '',
    value: '',
    required: false,
};

export { Textarea };
