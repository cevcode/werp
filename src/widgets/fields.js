import { FieldWrapperHOC } from 'widgets/FieldHOC';
import { Input } from 'ui/Input';

const WrappedInput = FieldWrapperHOC(Input);

export { WrappedInput as Input };
