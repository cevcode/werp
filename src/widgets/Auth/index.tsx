import * as React from "react";
import Formsy from "formsy-react";
import { Input } from "widgets/fields";
import { Column } from "ui/Layout";
import { Button } from "ui/Button";
import { Title } from "ui/Title";
import { getValidationForField } from "./validations";
import {default as config} from "./config.json";


import "./style.scss";
import * as style from "./style.scss";
import { WeightEnum, ISize, MarginType } from "ui/enums";

function getTitle(authType) {
    switch (authType) {
        case "auth":
        default:
            return { title: "Регистрация", button: "Зарегистрироваться" };
        case "login":
            return { title: "Авторизация", button: "Войти" };
        case "reset":
            return { title: "Восстановить пароль", button: "Восстановить" };
    }
}

// tslint:disable-next-line:no-empty-interface
export interface IAuth {
    authType?: "login";
}

class Auth extends React.Component<IAuth, {}> {
    public state = {
        valid: false,
        error: "",
    };

    private _form;

    private formRef = ref => (this._form = ref);

    private onValid = () => {
        this.setState({ valid: true });
    }

    private onInvalid = () => {
        this.setState({ valid: false });
    }

    private onSubmit = () => {
        console.log(this.props);
    }

    public render() {
        const { valid, error } = this.state;
        const { authType = "login" } = this.props;
        return (
            <Column className={style.auth}>
                <Title uppercase weight={WeightEnum.w600}>
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
                    <Button className={style.auth__button} type="submit" size={ISize.full} margin={MarginType.top_x2} disabled={!valid}>
                        {getTitle(authType).button}
                    </Button>
                </Formsy>
            </Column>
        );
    }
}

export { Auth };
