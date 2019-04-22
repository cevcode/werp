import React from 'react';
import PropTypes from 'prop-types';

const CONFIG = {
    margin: PropTypes.oneOf(['left', 'right', 'top', 'bottom', 'left_x2', 'right_x2', 'top_x2', 'bottom_x2', '']),
    align: PropTypes.oneOf(['left', 'center', 'right']),
    weight: PropTypes.oneOf(['500', '600', '700']),
};

export function PropTypesGlobal(type) {
    if (CONFIG.hasOwnProperty(type)) {
        return CONFIG[type];
    }
    return null;
}
