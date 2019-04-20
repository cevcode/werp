import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import style from './style.scss';

const Description = ({ children, align, className, margin }) => {
    return (
        <p
            className={cx(
                style.description,
                style[`description__align_${align}`],
                style[`description__margin_${margin}`],
                className
            )}
        >
            {children}
        </p>
    );
};

Description.PropTypes = {
    children: PropTypes.string,
    className: PropTypes.string,
    align: PropTypes.oneOf(['left', 'center', 'right']),
    margin: PropTypes.oneOf(['left', 'right', 'top', 'bottom', 'left_x2', 'right_x2', 'top_x2', 'bottom_x2']),
};

Description.defaultProps = {
    children: '',
    className: '',
    align: 'left',
    margin: false,
};
export { Description };
