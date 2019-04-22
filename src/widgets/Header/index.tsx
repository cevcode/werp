import * as React from "react";
import { Title } from "ui/Title";
import { Row } from "ui/Layout";
import { Link } from "react-router-dom";

import "statics/logo.svg";
import { default as logo } from "statics/logo.svg";

import "./style.scss";
import * as style from "./style.scss";

// tslint:disable-next-line:no-empty-interface
export interface IHeader {

}

// tslint:disable-next-line:variable-name
const Header: React.FC<IHeader>  = () => {
    return (
        <Row jc="center" ai="center" className={style.header}>
            <Link to="/auth">
                <img className={style.header__logo} src={logo} alt="logo" />
            </Link>
            <Title>WERP</Title>
        </Row>
    );
};

export { Header };
