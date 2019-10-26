import * as React from 'react'

type IsRequiredOption = {
  required: boolean,
}

// TODO: all of the schema types can be enumerated
type FunctionSchemaType <TOptions> = ((x: unknown) => boolean)
  & { _isSchemaType: true, _type: string, } & TOptions
interface ObjectSchemaType {
  // TODO: avoid hardcoded option type
  [key: string]: FunctionSchemaType<IsRequiredOption> | ObjectSchemaType,
}
type SchemaType = FunctionSchemaType<IsRequiredOption> | ObjectSchemaType
type SchemaTypeFactory = (options?: IsRequiredOption) => SchemaType

export const SchemaTypes: {
  any: SchemaTypeFactory,
  string: SchemaTypeFactory,
  boolean: SchemaTypeFactory,
  function: SchemaTypeFactory,
  number: SchemaTypeFactory,
  date: SchemaTypeFactory,
  array: SchemaTypeFactory,
  object: SchemaTypeFactory,
  arrayOf: (type: SchemaType) => SchemaTypeFactory,
};

export const matchesSchema: (schema: SchemaType, test: unknown) => boolean

type BaseEditorProps = {
  // TODO: this is wrong. The set of valid schematypes and options should be predefined
  type: SchemaType,
  className?: string,
}

type EditablePrimitive = number | string | boolean
interface EditableObject {
  [key: string]: Editable,
}
interface EditableArray {
  [key: number]: Editable,
}
type Editable = EditablePrimitive | EditableObject | EditableArray

export class ObjectEditor <TObject extends Editable> extends
  React.Component<BaseEditorProps & {
    object?: TObject,
    onUpdateElement: (object: TObject) => void,
    parentVisible?: boolean,
  }> {}

export class ArrayEditor <TObject extends Editable> extends
  React.Component<BaseEditorProps & {
    object?: Array<TObject>,
    onUpdateElement: (object: TObject, index: number) => void,
    onRemoveElements: (indices: Array<Number>) => void,
    onAddElement: (object: TObject) => void,
    parentVisible?: boolean,
    defaultRowsPerPage?: number,
  }> {}

export const PropTypes: {
  SchemaType: unknown, // TODO
  Schema: unknown, // TODO
}
