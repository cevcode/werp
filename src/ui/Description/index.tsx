import cx from "classnames";
import * as React from "react";
import {AlignType, ISize, MarginType} from "../enums";
import { Color } from "csstype";
import * as style from "./style.scss";

export interface IDescription {
    size?: ISize;
    children: string;
    className?: string;
    color?: Color;
    align?: AlignType;
    margin: MarginType;
}

// tslint:disable-next-line:variable-name
const Description: React.FC<IDescription> = ({ children, align, className, margin, size, color }) => {
    return (
        <p
            className={cx(
                style.description,
                style[`description__align_${align}`],
                style[`description__margin_${margin}`],
                style[`description__size_${size}`],
                style[`description__color_${color}`],
                className
            )}
        >
            {children}
        </p>
    );
};

Description.defaultProps = {
    children: "",
    className: "",
    align: AlignType.left,
    margin: MarginType.none,
    size:ISize.s,
    color: "black",
};

export { Description };
