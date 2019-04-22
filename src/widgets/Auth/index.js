import React from 'react';
import Formsy from 'formsy-react';
import { Field } from 'widgets/fields';
import { Column, Row } from 'ui/Layout';
import { Button } from 'ui/Button';
import { Title } from 'ui/Title';
import { Description } from 'ui/Description';
import { getValidationForField } from './validations';
import { inject, observer } from 'mobx-react';
import config from './config';
import style from './style.scss';

function getTitle(authType) {
    switch (authType) {
        case 'auth':
        default:
            return { title: 'Sign Up', button: 'Sign Up' };
        case 'login':
            return { title: 'Sign In', button: 'Sign In' };
        case 'reset':
            return { title: 'Restore password', button: 'Restore' };
    }
}

function BottomPanel({ authType, handleAuthType }) {
    return (
        <Row>
            <Button
                className={style.auth__button_more}
                margin="right"
                onClick={() => handleAuthType(authType === 'auth' ? 'login' : 'auth')}
            >
                {authType === 'auth' ? 'Sign In' : 'Sign Up'}
            </Button>
            <Button className={style.auth__button_more} onClick={() => handleAuthType('reset')}>
                Restore password
            </Button>
        </Row>
    );
}

@inject('authStore')
@observer
class Auth extends React.Component {
    state = {
        valid: false,
        error: '',
        authType: 'login',
    };

    formRef = ref => (this.form = ref);

    onValid = () => {
        this.setState({ valid: true });
    };

    onInvalid = () => {
        this.setState({ valid: false });
    };

    onSubmit = () => {
        const model = this.form.getModel();
        const { username, password, database } = model;
        this.props.authStore.setUserData(username, password, database);
        this.props.authStore.login();
    };

    handleAuthType = type => {
        this.setState({ authType: type });
    };

    render() {
        const { valid, error, authType } = this.state;
        return (
            <Column className={style.auth}>
                <Title uppercase weight="600" size="s">
                    {getTitle(authType).title}
                </Title>
                <Formsy
                    onValidSubmit={this.onSubmit}
                    ref={this.formRef}
                    onValid={this.onValid}
                    onInvalid={this.onInvalid}
                >
                    {config[authType].map((item, i) => {
                        const {
                            type,
                            id,
                            name,
                            placeholder,
                            validations,
                            validationsError,
                            margin,
                            autoComplete,
                            required,
                        } = item;
                        return (
                            <Field
                                type={type}
                                id={id}
                                placeholder={placeholder}
                                validations={getValidationForField(validations)}
                                validationsError={validationsError}
                                name={name}
                                margin={margin}
                                autoComplete={autoComplete}
                                key={i}
                                required={required}
                            />
                        );
                    })}
                    <Button className={style.auth__button} type="submit" size="full" margin="top_x2" disabled={!valid}>
                        {getTitle(authType).button}
                    </Button>
                    <BottomPanel authType={authType} handleAuthType={this.handleAuthType} />
                </Formsy>
            </Column>
        );
    }
}

export { Auth };
