import * as React from "react";
import { Row, Column } from "ui/Layout";
import { Title } from "ui/Title";
import { Auth } from "widgets/Auth";
import { Header } from "widgets/Header";
import * as style from "./style.scss";

class AuthPage extends React.Component {

    public render() {
        return (
            <Column jc="center" ai="center" className={style.auth__page}>
                <Header />
                <Column jc="center" ai="center" className={style.auth__inner}>
                    <Auth />
                </Column>
            </Column>
        );
    }
}

export { AuthPage };
