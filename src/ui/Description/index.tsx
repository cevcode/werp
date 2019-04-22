import cx from "classnames";
import * as React from "react";
import { AlignType, MarginType } from "../enums";

import "./style.scss";
import * as style from "./style.scss";

export interface IDescription {
    children: string;
    className: string;
    align: AlignType;
    margin: MarginType;
}

// tslint:disable-next-line:variable-name
const Description: React.FC<IDescription> = ({ children, align, className, margin }) => {
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
    align: AlignType.left,
    margin: MarginType.none,
};

export { Description };
