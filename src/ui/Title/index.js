import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import style from './style.scss';

const Title = ({ size = 'm', children, align, tagName, extraCLass, containerClassName, margin, color }) => {
    const className = cx(
        style[`title__size_${size}`],
        style[`title__align_${align}`],
        style[`title__margin_${margin}`],
        style[`title__color_${color}`],
        extraCLass
    );
    return (
        <div className={cx('title__container', containerClassName)}>
            {React.createElement(tagName, { className }, children)}
        </div>
    );
};

Title.PropTypes = {
    size: PropTypes.oneOf(['s', 'm', 'l']),
    align: PropTypes.oneOf(['left', 'center', 'right']),
    margin: PropTypes.oneOf(['left', 'right', 'top', 'bottom', 'left_x2', 'right_x2', 'top_x2', 'bottom_x2']),
    tagName: PropTypes.oneOf(['h1', 'h2']),
    color: PropTypes.oneOf(['white', 'orange']),
    extraCLass: PropTypes.string,
    containerClassName: PropTypes.string,
};

Title.defaultProps = {
    size: 'medium',
    align: 'left',
    tagName: 'h2',
    color: 'white',
    className: '',
    containerClassName: '',
    margin: false,
};

export { Title };
