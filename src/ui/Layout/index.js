import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import style from './style.scss';

function Layout({ direction, jc, ai, noFlex, multiStr, hidden, disabled, className, children, ...params }) {
    const classNames = cx(
        'layout',
        noFlex && 'l_no_flex',
        direction === 'column' && 'layout_column',
        multiStr && 'l_wrap',
        hidden && 'l_hidden',
        jc && `l_jc_${jc}`,
        ai && `l_ai_${ai}`,
        disabled && 'l_disabled',
        className
    );

    return (
        <div className={classNames} {...params}>
            {children}
        </div>
    );
}

Layout.displayName = 'Layout';

Layout.propTypes = {
    noFlex: PropTypes.bool,
    hidden: PropTypes.bool,
    multiStr: PropTypes.bool,
    disabled: PropTypes.bool,
    onScroll: PropTypes.func,
    tagName: PropTypes.string,
    className: PropTypes.string,
    direction: PropTypes.oneOf(['row', 'column']),
    ai: PropTypes.oneOf(['flex-start', 'center', 'stretch', 'flex-end']),
    jc: PropTypes.oneOf(['flex-start', 'center', 'stretch', 'flex-end', 'space-around', 'space-between']),
};

Layout.defaultProps = {};

function Row(props) {
    const { children } = props;
    return (
        <Layout {...props} direction="row">
            {children}
        </Layout>
    );
}

function Column(props) {
    const { children } = props;
    return (
        <Layout {...props} direction="column">
            {children}
        </Layout>
    );
}

export { Row, Column };
