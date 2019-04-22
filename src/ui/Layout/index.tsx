import cx from "classnames";
import * as React from "react";

import "./style.scss";
import * as style from "./style.scss";

export interface ILayout {
    noFlex?: boolean;
    hidden?: boolean;
    multiStr?: boolean;
    disabled?: boolean;
    onScroll?: () => void;
    tagName: string;
    className?: string;
    direction: "row" | "column";
    ai: "flex-start" | "center" | "stretch" | "flex-end";
    jc: "flex-start" | "center" | "stretch" | "flex-end" | "space-around" | "space-between";
}

// tslint:disable-next-line:variable-name
const Layout: React.FC<ILayout> = ({ direction, jc, ai, noFlex, multiStr, hidden, disabled, className, children, ...params }) => {
    const classNames = cx(
        "layout",
        noFlex && "l_no_flex",
        direction === "column" && "layout_column",
        multiStr && "l_wrap",
        hidden && "l_hidden",
        jc && `l_jc_${jc}`,
        ai && `l_ai_${ai}`,
        disabled && "l_disabled",
        className
    );

    return (
        <div className={classNames} {...params}>
            {children}
        </div>
    );
};

Layout.displayName = "Layout";

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
