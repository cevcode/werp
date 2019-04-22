import React from 'react';
import { FieldWrapperHOC } from 'widgets/FieldHOC';
import { Input } from 'ui/Input';
import { Textarea } from 'ui/Textarea';

const WrappedInput = FieldWrapperHOC(Input);
const WrappedTextarea = FieldWrapperHOC(Textarea);

function Field({ type, ...props }) {
    switch (type) {
        case 'textarea':
            return <WrappedTextarea type={type} {...props} />;
        default:
            return <WrappedInput type={type} {...props} />;
    }
}

export { Field };
