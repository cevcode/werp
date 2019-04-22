import React from 'react';
import Formsy from 'formsy-react';
import { Field } from 'widgets/fields';
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
            return { title: 'Sign Up', button: 'Sign Up' };
        case 'login':
            return { title: 'Sign In', button: 'Sign In' };
        case 'reset':
            return { title: 'Restore password', button: 'Restore' };
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
        const model = this.form.getModel();
        console.log(model);
    };

    render() {
        const { valid, error } = this.state;
        const { authType = 'auth' } = this.props;
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
                </Formsy>
            </Column>
        );
    }
}

export { Auth };
