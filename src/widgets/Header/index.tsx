import * as React from "react";
import { Title } from "ui/Title";
import { Button } from "ui/Button";
import { Icon } from "ui/Icon";
import { Row, Column } from "ui/Layout";
import { Profile } from 'widgets/Profile';
import { Link } from "react-router-dom";
import {Colors, ISize, ISizeIcon, PaddingType, MarginType } from "ui/enums";

import "statics/logo.svg";
import { default as logo } from "statics/logo.svg";

import * as style from "./style.scss";
import config from './config';

// tslint:disable-next-line:no-empty-interface
export interface IHeader {
    authorized?: boolean;
}

function renderLogo(title) {
    return (
    <Row jc="center" ai="center">
        <img className={style.header__logo} src={logo} alt="logo"/>
        <Title color="white" size={ISize.s}>{title}</Title>
    </Row>
    )
}

function IconButton({ icon }) {
    if(!icon) {
        return null;
    }
    return (
        <Button size={ISize.auto} margin={MarginType.right} padding={PaddingType.s}>
            <Icon color="white" size={ISizeIcon.s} icon={icon} />
        </Button>
    )
}

// tslint:disable-next-line:variable-name
const Header: React.FC<IHeader>  = ({ authorized = false }) => {
    if(!authorized) {
        return (
            <Column className={style.header}>
                <Link to="/auth">
                    {renderLogo('WERP')}
                </Link>
            </Column>
        );
    }
    return (
        <Row ai="center" jc="space-between" className={style.header__home}>
            <Button size={ISize.xl}>{renderLogo('projects')}</Button>
            <Row>
                <Row jc="flex-end">
                    {config.map(item => {
                        const { icon, name } = item;
                        console.log(icon);
                        return <IconButton key={name} icon={icon} />

                    })}
                </Row>
                <Button size={ISize.xxl}>
                    <Profile size={ISize.s} />
                </Button>
            </Row>
        </Row>
    )
};

export { Header };
