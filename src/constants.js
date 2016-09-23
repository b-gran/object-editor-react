import { invalidSchemaMessage, validateSchema } from './Schema';

// Returns a version of `validator` that will accept the prop
// if it's undefined.
// That validator returned by this function will have a `isRequired`
// field that is a function that runs the original validator.
function withIsRequired (validator) {
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

export const PropTypes = {
    // Requires the prop to be a valid SchemaType
    SchemaType: withIsRequired(validateSchemaTypeProp),

    Schema: withIsRequired(validateSchemaProp)
};