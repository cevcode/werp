import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import style from './style.scss';

function Button({ onClick, className, children, size, disabled, style, type, margin }) {
    return (
        <button
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={cx(
                'ux-button',
                `ux-button__size_${size}`,
                `ux-button__style_${style}`,
                `ux-button__margin_${margin}`,
                className
            )}
        >
            {children}
        </button>
    );
}

Button.propTypes = {
    onClick: PropTypes.func,
    size: PropTypes.oneOf(['s', 'l', 'full']),
    text: PropTypes.string,
    style: PropTypes.oneOf(['void', 'fill']),
    margin: PropTypes.oneOf(['left', 'right', 'top', 'bottom', 'left_x2', 'right_x2', 'top_x2', 'bottom_x2']),
    disabled: PropTypes.bool,
    type: PropTypes.string,
};

Button.defaultProps = {
    size: 's',
    style: 'void',
    disabled: false,
    margin: false,
};

export { Button };
