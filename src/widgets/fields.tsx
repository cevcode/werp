import { FieldWrapperHOC } from "widgets/FieldHOC";
import { Input } from "ui/Input";

// tslint:disable-next-line:variable-name
const WrappedInput = FieldWrapperHOC(Input);

export { WrappedInput as Input };
