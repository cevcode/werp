import FieldType from "./data/field-type";

export type GetFieldTypeHandler = (fieldTypeCd: string) => FieldType;

export let getFieldType: GetFieldTypeHandler = (fieldTypeCd: string) => {
    return null;
};

