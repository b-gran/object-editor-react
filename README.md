# `object-editor-react`

[![Build Status](https://travis-ci.org/b-gran/object-editor-react.svg?branch=master)](https://travis-ci.org/b-gran/object-editor-react) [![npm version](https://badge.fury.io/js/object-editor-react.svg)](https://badge.fury.io/js/object-editor-react)

`object-editor-react` is a table-based `JSON` object editor built using `React.js`.

It enables drop-in, structured editing of deeply nested JSON objects with minimal configuration.

## Preview

![](assets/demo.gif)

## How it works:

1. Create a `Schema` -- it can be as deeply nested as you need.
```
import { SchemaTypes } from 'object-editor-react';

const schema = {
    foo: SchemaTypes.string({ required: true }),
    
    bar: {
        baz: SchemaTypes.arrayOf({
            nested: SchemaTypes.string(),
        }),
    },
}
```

2. Drop in an `ObjectEditor` or `ArrayEditor` and provide modification handlers.
```
import { ArrayEditor, ObjectEditor } from 'object-editor-react';

const YourComponent = props => {
    return (
        <ArrayEditor
            type={schema}
            object={[{ foo: 'bar' }, { foo: 'baz' }]}
            onUpdateElement={(el, index) => ...}
            onAddElement={(newElement) => ...}
            onAddElement={(removedElement, index) => ...}
            />
    );
}
```

A table-based editor is generated based on the `Schema`. For properties
with types like string and number, you can just edit the values directly
using an `<input />` element.

For more complex properties (object, array, or other complex types), an
"Edit" button in the cell creates a nested Editor (type chosen
automatically) for editing the nested object.

## Installation

```
npm install object-editor-react
```

__NOTE:__ object-editor-react has `react > 14.0.0` and `react-dom > 14.0.0` as peer dependencies.

## Usage

To use `object-editor-react`, all you need to do is create a schema and provide object modification handlers.
It's similar to a controlled `<input />` element.

### Schemas

There are many different `SchemaTypes` that can be combined and nested however you need.
They are similar to `React` PropTypes and to `mongoose` SchemaTypes, but with a few key differences.

A valid schema is either:

* An object whose leaves are `SchemaTypes`
* A `SchemaType`

Examples:
```
import { SchemaTypes } from 'object-editor-react';

const schema = {
    foo: SchemaTypes.string({ required: true }),
    bar: {
        baz: SchemaTypes.any(),
    }
};
// Some valid instances:
// { foo: 'bar' }
// { foo: 'bar', bar: { baz: [] } }

const schema = SchemaTypes.arrayOf(SchemaTypes.string())();
// Some valid instances:
// [ 'one', 'two', 'three' ],
// [ ]

const schema = {
    foo: SchemaTypes.arrayOf({
        bar: SchemaTypes.array()
    })({ required: true }),
};
// Some valid instances:
// { foo: [ { bar: [] } ] }
// { foo: [] }
```

#### `SchemaTypes`

##### `any`

The value can be any non-`undefined` value.
The value must have a type other than `undefined`.

##### `string`

The value must have type `string`.

##### `boolean`

The value must have type `boolean`.

##### `function`

The value must have type `function`.

##### `number`

The value must have type `number`.

##### `date`

The value must be a `Date` instance with a non-`NaN` time.
Specifically, `Object.toString()` must return `"[object Date]"`, and `date.getTime()` must be non-`NaN`.

##### `array`

The value must be an `Array` instance.
Specifically, `Array.isArray()` must return `true`.

##### `object`

The value must have type `object`.

##### `arrayOf`

The value must be an `array` whose elements all conform to a specific `SchemaType`.

Specifically, the value must pass the `SchemaTypes.array` validation test, and each 
element of the array must pass the validation test of the `SchemaType` passed
as the argument to `arrayOf`.

##### `SchemaType` options

Each `SchemaType` is a function. Every `SchemaType` except for `arrayOf` 
takes a single, optional configuration object as its parameter. 

These are the possible configuration options.

| Key | Note | Required? | Default | 
| --- | ---  | ---       | ---     |
| `required` | is the key corresponding to this `SchemaType` required? | `false` | `false` |

In the case of `arrayOf`, the `arrayOf` function takes a schema as its
only parameters and returns a function that accepts a configuration object.

Example:
```
const schema = SchemaTypes.arrayOf({
    foo: SchemaTypes.string()
})({ required: false });
```

### Editors

There are two top-level Editor components: `ObjectEditor` and `ArrayEditor`.

Both Editor types are "controlled" components: any changes to the objects are passed to a change handler,
but the Editors themselves don't have internal state to track changes.

#### `ObjectEditor`

An Editor for editing a single `JSON` object.

```
import { ObjectEditor } from 'object-editor-react';
```

`props`

| Prop | Type | Note | Required? | Default |
| ---  | ---  | ---  | ---       | ---     |
| `type` | `Schema` | The `Schema` to use when generating the Editor and validating objects. <br> Must be a valid `Schema` (an object whose keys are `SchemaType:s`, or a `SchemaType`) | `true` |
| `object` | `any` | the object to edit. must validate according to the `Schema` passed in the `type` prop. | `false` |
| `onUpdateElement` | `function` | `function onUpdateElement (updatedElement: Object ) -> void`. <br> Handler called when the object is updated | `true` |
| `className` | `string` | any additional class names for the editor table wrapper | `false` |
| `icon` | `function` | a function that returns an icon to use for each row in the table | `false` | no icon used |

#### `ArrayEditor`

An Editor for editing an array of objects, where each element in the array conforms to a `Schema`.

```
import { ArrayEditor } from 'object-editor-react';
```

`props`

| Prop | Type | Note | Required? | Default |
| ---  | ---  | ---  | ---       | ---     |
| `type` | `Schema` | The `Schema` to use when generating the Editor and validating objects. <br> Each element in the array must conform to this `Schema`. <br> Must be a valid `Schema` (an object whose keys are `SchemaType:s`, or a `SchemaType`) | `true` |
| `object` | `any` | The array to edit. <br> Each element must validate according to the `Schema` passed in the `type` prop. | `false` |
| `onUpdateElement` | `function` | `function onUpdateElement (updatedElement: Object, updatedIndex: Number) -> void` <br> Handler called when an element in the array is updated <br> The updated element and the index are passed | `true` |
| `onAddElement` | `function` | `function onAddElement (newElement: Object) -> boolean` <br> Handler called when a new element is added to the array <br> If this function returns true, the "add object" row is cleared  | `true` |
| `onRemoveElements` | `function` | `function onRemoveElements (removedIndices: [Number]) -> void` <br> Handler called when an element in the array is removed <br> The indices of removed elements are passed | `true` |
| `className` | `string` | any additional class names for the editor table wrapper | `false` |
| `icon` | `function` | a function that returns an icon to use for each row in the table | `false` | no icon used |

### Styling

Styling `object-editor-react` is accomplished via global CSS styles.

All Editors are rendered as `<table />`s. For nested objects and arrays,
object/array Editors are rendered as `Scrim`s next to the relevant cells.

The general shape of an Editor's markup for an object `obj` is
```
<table>
    <thead>
    Column titles...
    </thead>
    
    <tbody>
    
    In an ArrayEditor, a row is rendered for each element in the array.
    For an ObjectEditor, only a single row is rendered.
    <tr>
        <td>
            Value of obj[k_i]
                <input value={obj[k_i]} ... />
            
            If props.type[k_i] is an object, then another Editor in rendered
                <Editor type={props.type[k_i]} ... />
        </td>
    </tr>
    
    If obj is an array, the <AddObjectRow /> is rendered as the last row in the table.
    <AddObjectRow type={props.type} />
    
    </tbody>
</table>
```

##### CSS classes

Non-nested Editors (i.e. top-level), outer `<table />`
```
/* All editors */
table.editor.editor--outside

/* Object editor */
table.editor.editor--object.editor--outside

/* Array editor */
table.editor.editor--array.editor--outside
```

Nested Editors (i.e. Editors rendered from within another Editor), outer `<table />`
```
/* All editors */
table.editor.editor--inside

/* Object editor */
table.editor.editor--object.editor--inside

/* Array editor */
table.editor.editor--array.editor--inside
```

Cells that spawn nested editors
```
td.cell--object
```

Cells that allow direct editing of a value
```
td.cell--value
```

An element in an `ArrayEditor`
```
tr.editor__row.editor__row--array
```

An element in an `ObjectEditor`
```
tr.editor__row.editor__row--object
```

The Add Object Row in an ArrayEditor
```
tr.editor__row.editor__add-object
```

An input that allows editing a property value directly
```
input.editor__input--value
```

Column titles at the top of an editor
```
tr.editor__column-titles
```

Individual column title
```
th.column-title
```

## Examples

See `src/test/index.js` for a stateful implementation with a deeply nested `Schema`.