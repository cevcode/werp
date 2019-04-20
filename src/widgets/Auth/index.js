import React from 'react';
import Formsy from 'formsy-react';
import { Input } from 'widgets/fields';
import { Column } from 'ui/Layout';
import { Button } from 'ui/Button';
import { Title } from 'ui/Title';
import { Description } from 'ui/Description';
import { getValidationForField } from './validations';
import config from './config';
import style from './style.scss';

function getTitle(authType) {
    switch (authType) {
        case 'auth':
        default:
            return { title: 'Регистрация', button: 'Зарегистрироваться' };
        case 'login':
            return { title: 'Авторизация', button: 'Войти' };
        case 'reset':
            return { title: 'Восстановить пароль', button: 'Восстановить' };
    }
}

class Auth extends React.Component {
    state = {
        valid: false,
        error: '',
    };

    formRef = ref => (this.form = ref);

    onValid = () => {
        this.setState({ valid: true });
    };

    onInvalid = () => {
        this.setState({ valid: false });
    };

    onSubmit = () => {
        console.log(this.props);
    };

    render() {
        const { valid, error } = this.state;
        const { authType = 'login' } = this.props;
        return (
            <Column className={style.auth}>
                <Title uppercase weight="600">
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
                        } = item;
                        return (
                            <Input
                                validations={getValidationForField(validations)}
                                margin={margin}
                                key={i}
                                validationError={validationsError}
                                required
                                type={type}
                                autoComplete={autoComplete}
                                id={id}
                                placeholder={placeholder}
                                name={name}
                            />
                        );
                    })}
                    <Button className={style.auth__button} type="submit" size="full" margin="top_x2" disabled={!valid}>
                        {getTitle(authType).button}
                    </Button>
                </Formsy>
            </Column>
        );
    }
}

export { Auth };
