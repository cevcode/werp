import * as React from "react";
import { Header } from 'widgets/Header';
import { Column, Row } from 'ui/Layout';

function Home() {
    return (
        <Column>
            <Header authorized={true} />
        </Column>
    )
}

export { Home };
