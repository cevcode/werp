import * as React from "react";
import cx from "classnames";
import { ISize, MarginType, FillType, ButtonType } from "../enums";

import "./style.scss";

export interface IButton {
    className?: string;
    onClick?: () => void;
    size: ISize;
    text?: string;
    style?: FillType;
    margin?: MarginType;
    disabled?: boolean;
    type?: ButtonType;
    icon?: string;
}

// tslint:disable-next-line:variable-name
const Button: React.FC<IButton> = ({ onClick, className, children, size, disabled, style, type, margin, icon }) => {
    return (
        <button
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={cx(
                "ux-button",
                `ux-button__size_${size}`,
                `ux-button__style_${style}`,
                `ux-button__margin_${margin}`,
                className
            )}
        >
            {children}
        </button>
    );
};

Button.defaultProps = {
    size: ISize.s,
    style: FillType.void,
    disabled: false,
    margin: MarginType.none,
};

export { Button };
