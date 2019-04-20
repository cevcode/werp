import React from 'react';
import * as Formsy from 'formsy-react';

function oneLetterOneNumberAtLeast(value) {
    if (!value) return false;
    return /[a-zA-Zа-яА-Я]+/.test(value.toString()) && /\d+/.test(value.toString());
}

function allLettersIsLatin(value) {
    if (!value) return false;
    return /[A-z\u00C0-\u00ff]+/g.test(value.toString());
}

function onlyLettersAndNumbers(value) {
    if (!value) return false;
    return /^[a-zA-Z0-9]+$/.test(value.toString());
}

export function minLength(value, number) {
    if (!value) return false;
    return value.toString().length >= number;
}

export function maxLength(value, number) {
    if (!value) return false;
    return value.toString().length <= number;
}

Formsy.addValidationRule('isLogin', function(values, value) {
    return onlyLettersAndNumbers(value) && minLength(value, 4) && maxLength(value, 16);
});

Formsy.addValidationRule('isPassword', function(values, value) {
    return oneLetterOneNumberAtLeast(value) && minLength(value, 8) && allLettersIsLatin(value);
});

export function getValidationForField(validation) {
    switch (validation) {
        case 'email':
            return 'isEmail';
        case 'login':
            return 'isLogin';
        case 'password':
            return 'isPassword';
    }
}
