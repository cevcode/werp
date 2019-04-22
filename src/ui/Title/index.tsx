import * as React from "react";

import cx from "classnames";

import "./style.scss";
import * as style from "./style.scss";
import { AlignType, ISize, MarginType, WeightEnum } from "ui/enums";

import { Color } from "csstype";

export interface ITitle {
    size: ISize;
    align: AlignType;
    weight: WeightEnum;
    margin: MarginType;
    tagName: "h1" | "h2";
    color: Color;
    extraCLass: string;
    uppercase?: boolean;
    containerClassName?: string;
}

// tslint:disable-next-line:variable-name
const Title: React.FC<ITitle> = ({
    size = "m",
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
        <div className={cx("title__container", containerClassName)}>
            {React.createElement(tagName, { className }, children)}
        </div>
    );
};

Title.defaultProps = {
    size: ISize.m,
    align: AlignType.left,
    tagName: "h2",
    color: "black",
    weight: WeightEnum.w500,
    containerClassName: "",
    margin: MarginType.none,
    uppercase: false,
};

export { Title };
