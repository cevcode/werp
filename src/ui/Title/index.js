import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { PropTypesGlobal } from 'helpers/PropTypes';
import style from './style.scss';

const Title = ({
    size = 'm',
    children,
    align,
    tagName,
    extraCLass,
    containerClassName,
    margin,
    color,
    uppercase,
    weight,
}) => {
    const className = cx(
        style[`title__size_${size}`],
        style[`title__align_${align}`],
        style[`title__margin_${margin}`],
        style[`title__weight_${weight}`],
        style[`title__color_${color}`],
        uppercase && style.title__uppercase,
        extraCLass
    );
    return (
        <div className={cx('title__ontainer', containerClassName)}>
            {React.createElement(tagName, { className }, children)}
        </div>
    );
};

Title.propTypes = {
    size: PropTypes.oneOf(['s', 'm', 'l']),
    align: PropTypesGlobal('align'),
    weight: PropTypesGlobal('weight'),
    margin: PropTypesGlobal('margin'),
    tagName: PropTypes.oneOf(['h1', 'h2']),
    color: PropTypes.oneOf(['white', 'orange', 'black']),
    extraCLass: PropTypes.string,
    uppercase: PropTypes.bool,
    containerClassName: PropTypes.string,
};

Title.defaultProps = {
    size: 'm',
    align: 'left',
    tagName: 'h2',
    color: 'black',
    className: '',
    weight: '500',
    containerClassName: '',
    margin: '',
    uppercase: false,
};

export { Title };
