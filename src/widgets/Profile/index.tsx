import * as React from 'react';
import cx from 'classnames';
import { Row, Column } from 'ui/Layout';
import { Description } from 'ui/Description';
import { getFirstLetter } from './helpers';
import { MarginType, ISize, Colors } from "ui/enums";
import * as style from './style.scss';

export interface IProfile {
    size?: ISize;
    firstName?: string;
    lastName?: string;
}

const ProfileImage: React.FC<IProfile> = ({ firstName, lastName, size }) => {
    const text = `${getFirstLetter(firstName)}${getFirstLetter(lastName)}`;
    return (
        <Column ai="center" jc="center" className={cx(style.profile__image, style[`profile__image__size_${size}`])}>
            {text}
        </Column>
    )
};

const Profile: React.FC<IProfile>  = ({ firstName = 'Ivan', lastName = 'Ivanov', size }) => {
    const text = `${firstName} ${lastName}`;
    return (
        <Row jc="center" ai="center">
            <ProfileImage firstName={firstName} lastName={lastName} size={size} />
            <Description margin={MarginType.left} size={size} color="white">{text}</Description>
        </Row>
    )
};

export { Profile };