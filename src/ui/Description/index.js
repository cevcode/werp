import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { PropTypesGlobal } from 'helpers/PropTypes';
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
    align: PropTypesGlobal('align'),
    margin: PropTypesGlobal('margin'),
};

Description.defaultProps = {
    children: '',
    className: '',
    align: 'left',
    margin: false,
};
export { Description };
