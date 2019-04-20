import React from 'react';
import { Row, Column } from 'ui/Layout';
import { Title } from 'ui/Title';
import style from './style.scss';

class Auth extends React.Component {
    render() {
        return (
            <Column className={style.auth}>
                <Title>WERP Auth</Title>
            </Column>
        );
    }
}

export { Auth };
