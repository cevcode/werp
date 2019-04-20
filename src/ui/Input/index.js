import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import MaskedInput from 'react-text-mask';
import { getMask } from './masks';
import style from './style.scss';

function Input({
    value,
    mask,
    onBlur,
    onClick,
    onFocus,
    onChange,
    disabled,
    readonly,
    extraClass,
    placeholder,
    onEnterPress,
    type,
    name,
    id,
    autoComplete,
}) {
    const className = cx(style['ux-input'], { [style['ux-input_disabled']]: disabled }, extraClass);

    const _handleKeyPress = e => {
        if (e.key === 'Enter') {
            onEnterPress();
        }
    };
    if (mask) {
        return (
            <MaskedInput
                guide
                type={type}
                name={name}
                mask={getMask(mask)}
                value={value}
                onBlur={onBlur}
                onClick={onClick}
                onFocus={onFocus}
                id={id}
                autoComplete={autoComplete}
                disabled={disabled}
                readOnly={readonly}
                className={className}
                placeholder={placeholder}
                placeholderChar={'\u2000'}
                onKeyPress={_handleKeyPress}
                onChange={e => onChange(e.target.value)}
            />
        );
    }
    return (
        <input
            type={type}
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
        />
    );
}

Input.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autoComplete: PropTypes.string,
    id: PropTypes.string,
};

Input.defaultProps = {
    readonly: false,
    type: 'text',
    disabled: false,
    autoComplete: '',
    id: null,
    onClick: i => i,
    onChange: i => i,
    placeholder: '',
    value: '',
};

export { Input };
