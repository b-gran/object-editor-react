import * as React from 'react'

type IsRequiredOption = {
  required?: boolean,
}

type BaseSchemaType<TOptions> = ((x: unknown) => boolean)
  & { _isSchemaType: true, _type: string, } & TOptions
type SchemaTypeFactory<TOptions> = (options?: TOptions) => BaseSchemaType<TOptions>

type StringSchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type StringSchemaType = BaseSchemaType<IsRequiredOption>

type BooleanSchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type BooleanSchemaType = BaseSchemaType<IsRequiredOption>

type NumberSchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type NumberSchemaType = BaseSchemaType<IsRequiredOption>

type FunctionSchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type FunctionSchemaType = BaseSchemaType<IsRequiredOption>

type DateSchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type DateSchemaType = BaseSchemaType<IsRequiredOption>

type ArraySchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type ArraySchemaType = BaseSchemaType<IsRequiredOption>

type AnyObjectSchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type AnyObjectSchemaType = BaseSchemaType<IsRequiredOption>

type ArrayOfSchemaTypeFactory = (type: SchemaType) => SchemaTypeFactory<IsRequiredOption>
type ArrayOfSchemaType = BaseSchemaType<IsRequiredOption>

type AnySchemaTypeFactory = SchemaTypeFactory<IsRequiredOption>
type AnySchemaType = BaseSchemaType<IsRequiredOption>

interface ObjectSchemaType {
  [key: string]: SchemaType,
}

type SchemaType =
  StringSchemaType
  | BooleanSchemaType
  | NumberSchemaType
  | FunctionSchemaType
  | DateSchemaType
  | ArraySchemaType
  | AnyObjectSchemaType
  | ArrayOfSchemaType
  | AnySchemaType
  | ObjectSchemaType

export const SchemaTypes: {
  any: AnySchemaTypeFactory,
  string: StringSchemaTypeFactory,
  boolean: BooleanSchemaTypeFactory,
  function: FunctionSchemaTypeFactory,
  number: NumberSchemaTypeFactory,
  date: DateSchemaTypeFactory,
  array: ArraySchemaTypeFactory,
  object: AnyObjectSchemaTypeFactory,
  arrayOf: ArrayOfSchemaTypeFactory,
}

export const matchesSchema: (schema: SchemaType, test: unknown) => boolean

type BaseEditorProps = {
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

export class ObjectEditor<TObject extends Editable> extends React.Component<BaseEditorProps & {
  object?: TObject,
  onUpdateElement: (object: TObject) => void,
  parentVisible?: boolean,
}> {
}

export class ArrayEditor<TObject extends Editable> extends React.Component<BaseEditorProps & {
  object?: Array<TObject>,
  onUpdateElement: (object: TObject, index: number) => void,
  onRemoveElements: (indices: Array<Number>) => void,
  onAddElement: (object: TObject) => void,
  parentVisible?: boolean,
  defaultRowsPerPage?: number,
}> {
}

export const PropTypes: {
  SchemaType: unknown, // TODO
  Schema: unknown, // TODO
}
