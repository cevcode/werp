import * as React from 'react';
import { ISizeIcon } from "../enums";
import MaterialIcon, {colorPalette} from 'material-icons-react';
import { Color } from "csstype";

export interface IIcon {
    icon?: string;
    color: Color;
    size: ISizeIcon;
    disabled?: boolean;
}

const Icon: React.FC<IIcon> = ({ icon, size, color, disabled }) => {
    return (
        <MaterialIcon icon={icon} size={size} color={color} inactive={disabled} />
    );
};

Icon.defaultProps = {
    size: ISizeIcon.s,
    disabled: false,
    icon: 'dashboard',
    color: 'black',
};

export { Icon };