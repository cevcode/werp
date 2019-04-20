import React from 'react';
import { Title } from 'ui/Title';
import { Row } from 'ui/Layout';
import { Link } from 'react-router-dom';
import logo from 'statics/logo.svg';
import style from './style.scss';

function Header() {
    return (
        <Row jc="center" ai="center" className={style.header}>
            <Link to="/auth">
                <img className={style.header__logo} src={logo} alt="logo" />
            </Link>
            <Title>WERP</Title>
        </Row>
    );
}

export { Header };
