import cx from "classnames";
import * as React from "react";
import * as style from "./style.scss";

export  enum AlignType {
    left,
    center,
    right
}

export enum MarginType {
    left,
    right,
    top,
    bottom,
    left_x2,
    right_x2,
    top_x2,
    bottom_x2
}

export interface IDescription {
    children: string;
    className: string;
    align: AlignType;
    margin: MarginType;
}

// tslint:disable-next-line:variable-name
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

Description.defaultProps = {
    children: "",
    className: "",
    align: "left",
    margin: false,
};
export { Description };
