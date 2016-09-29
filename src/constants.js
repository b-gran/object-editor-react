import { invalidSchemaMessage, validateSchema } from './Schema';

// Returns a version of `validator` that will accept the prop
// if it's undefined.
// That validator returned by this function will have a `isRequired`
// field that is a function that runs the original validator.
function addIsRequiredProperty (validator) {
    const func = function (props, propName) {
        if (typeof props[propName] === 'undefined') {
            return null;
        }

        return validator.apply(null, arguments);
    };

    func.isRequired = validator;

    return func;
}

// React propType validator that ensures the prop is a SchemaType
function validateSchemaTypeProp (props, propName, componentName) {
    const schemaType = props[propName];

    if (schemaType && schemaType.isSchemaType) {
        return null;
    }

    throw new Error(invalidSchemaMessage(schemaType, componentName + '.' + propName));
}

// React propType validator that ensures the prop is a Schema.
function validateSchemaProp (props, propName, componentName) {
    const schema = props[propName];
    return validateSchema(schema, componentName + '.' + propName);
}

// Some useful React PropTypes applicable across the project
export const PropTypes = {
    // Requires the prop to be a valid SchemaType
    SchemaType: addIsRequiredProperty(validateSchemaTypeProp),

    // Requires the prop to be a valid Schema
    Schema: addIsRequiredProperty(validateSchemaProp)
};

// Returns a function that appends suffix to base.
function appendTo (base) {
    return (suffix = '') => base + suffix;
}

// Base CSS class names for different elements
export const BaseClassnames = {
    // Corresponds to the outer <table /> for ObjectEditor and ArrayEditor
    Editor: appendTo('editor'),

    // Corresponds to <td /> elements in ElementRow
    Cell: appendTo('cell'),

    // Corresponds to ElementRow
    ElementRow: appendTo('editor__row'),

    // The row for adding objects
    AddObjectRow: appendTo('editor__add-object'),

    // <tr /> containing column titles
    ColumnTitles: appendTo('editor__column-titles'),

    // Individual <th /> column title
    ColumnTitle: appendTo('column-title'),

    // <input /> in a cell
    EditorInput: appendTo('editor__input'),
};