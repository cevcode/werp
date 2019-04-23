import * as React from "react";
import cx from 'classnames';
import { Title } from "ui/Title";
import { Button } from "ui/Button";
import { Icon } from "ui/Icon";
import { Row, Column } from "ui/Layout";
import { Profile } from 'widgets/Profile';
import { Link } from "react-router-dom";
import {ISize, ISizeIcon, PaddingType, MarginType } from "ui/enums";

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
        <Row ai="center" jc="space-between">
            <Row jc="flex-start">
                <Column className={style.header__item}>
                    <Button size={ISize.xl}>{renderLogo('projects')}</Button>
                </Column>
                <Column className={cx(style.header__item, style.search)}>
                    search...
                </Column>
            </Row>
            <Row jc="flex-end">
                <Row className={cx(style.header__item, style.header__buttons)}>
                    {config.map(item => {
                        const { icon, name } = item;
                        return <IconButton key={name} icon={icon} />

                    })}
                </Row>
                <Column className={style.header__item}>
                    <Button size={ISize.xxl}>
                        <Profile size={ISize.s} />
                    </Button>
                </Column>
            </Row>
        </Row>
    )
};

export { Header };
