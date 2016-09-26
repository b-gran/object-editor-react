// Returns true if `test` is a __valid__ JS Date object
export function isValidDate (test) {
    if (Object.prototype.toString.call(test) !== '[object Date]') {
        return false;
    }

    return !isNaN(test.getTime());
}

// Returns a function that takes a test variable and returns true
// if it's type is equal to `type`
export function typeValidator (type) {
    return test => typeof test === type;
}

// Returns true if `test` is anything but undefined.
export function isSomething (test) {
    return typeof test !== 'undefined';
}

// Returns true if `test` is an array
export function isArray (test) {
    return Array.isArray(test);
}

// Returns true if predicate returns true for all elements in the array.
// predicate is called with three arguments:
//      function predicate (currentElement, currentIndex, array)
export function every (array, predicate) {
    // Make sure it's an array
    if (!Array.isArray(array)) {
        throw new Error(
            `Expected "array" to be an Array, but got ${Object.prototype.toString.call(array)}`
        );
    }

    // Test predicate on every element in the array.
    return array.reduce(
        (memo, el, idx) => {
            return memo && predicate(el, idx, array);
        },
        true
    );
}

// Returns a function that returns true if
// `test` is an array whose objects match the schema `type`
export function isArrayOfType (type) {
    return function (test) {
        return (
            Array.isArray(test) &&
            every(
                test,
                el => matchesSchema(type, el)
            )
        );
    };
}

// Returns a function that accepts a validator and returns a function
// that takes a boolean and returns a function that takes a variable
// and validates the variables under the following constraints:
//      1) it's valid if the variable is not required, and the variable doesn't exist
//      2) it's valid if the actual validator function returns true
//
// Usage:
//
//      const maybeValidateString = maybeRequired(str => typeof str === 'string');
//
//      const validateString = maybeValidateString(true);
//      console.log(validateString('foo')); // true
//      console.log(validateString(10)); // false
//      console.log(validateString(undefined)); // false
//
//      const validateStringOrNothing = maybeValidateString(false);
//      console.log(validateStringOrNothing('foo')); // true
//      console.log(validateStringOrNothing(10)); // false
//      console.log(validateStringOrNothing(undefined)); // true
export const maybeRequired = actuallyValidate => isRequired => something => {
    return (
        (!isRequired && typeof something === 'undefined') ||
        actuallyValidate(something)
    );
};

// Create a SchemaType (really just a function with `type` and
// `isSchemaType` properties)
export function SchemaType (validate, type, opts = {}) {
    const func = validate;
    func.__proto__ = {
        isSchemaType: true,
        type,
        ...opts
    };

    return func;
};

// A function that returns a SchemaType factory based on a higher-order
// validator and a type name.
//
// The factories themselves take an optional options object and return
// a function (the SchemaType).
const createSchemaType = (maybeValidate, type) => {
    return (opts = {}) => SchemaType(
        maybeValidate(!!opts.required),
        type,
        opts
    );
};

export const SchemaTypes = {
    any: createSchemaType(maybeRequired(isSomething), 'any'),

    string: createSchemaType(maybeRequired(typeValidator('string')), 'string'),
    boolean: createSchemaType(maybeRequired(typeValidator('boolean')), 'boolean'),
    function: createSchemaType(maybeRequired(typeValidator('function')), 'function'),
    number: createSchemaType(maybeRequired(typeValidator('number')), 'number'),
    date: createSchemaType(maybeRequired(isValidDate), 'date'),

    array: createSchemaType(maybeRequired(isArray), 'array'),
    object: createSchemaType(maybeRequired(isObject), 'object'),

    /*
     * Usage:
     *      const schema = {
     *          foo: SchemaTypes.arrayOf({
     *              bar: SchemaTypes.string,
     *          })(),
     *
     *          bar: SchemaTypes
     *              .arrayOf(SchemaTypes.string())({ required: true }),
     *      };
     */
    arrayOf: type =>
        opts => createSchemaType(maybeRequired(isArrayOfType(type)), 'arrayOf')({
            // User-specified options
            ...opts,

            // Make the element type available
            elementType: type,
        })
};

// Returns a message for an error caused by an invalid Schema type.
export function invalidSchemaMessage (badLeaf, location) {
    return `(At ${location}): Expected a SchemaType, but got ${badLeaf}:${typeof badLeaf}`;
}

// Returns true if `test` is a vanilla object
export function isObject (test) {
    return Object.prototype.toString.call(test) === '[object Object]';
}

// Validates an ObjectEditor schema object
// A valid schema object is an object with SchemaTypes as
// its leaves.
export function validateSchema (schema, location = '') {
    // Base case: leaf is a SchemaType
    if (schema.isSchemaType) {
        return null;
    }

    // Schema is an object -- test each key at this level of the schema
    if (typeof schema === 'object' && Object.keys(schema).length > 0) {
        Object
            .keys(schema)
            .forEach(
                key => validateSchema(schema[key], location + '.' + key)
            );

        // No errors thrown, so schema is valid.
        return null;
    }

    // Schema is bad
    throw new Error(invalidSchemaMessage(schema, location));
}

// Returns true if test is a valid match for schema.
// Schema must be a valid schema (has SchemaTypes in leaves)
// This function just does some validation and then passes control
// to the recursive function, matchesSchemaInner.
export function matchesSchema (schema, test) {
    // Throw if the schema is bad.
    try {
        validateSchema(schema);
    } catch (err) {
        throw new Error('Expected "schema" to be a valid schema');
    }

    // Pass control to rec function
    return matchesSchemaInner(schema, test);
}

// Recursively make sure that `test` is a valid instance of `schema`
function matchesSchemaInner (schema, test) {
    // Base case: SchemaType leaf
    // Just evaluate directly
    if (schema.isSchemaType) {
        return schema(test);
    }

    // We already know schema is a valid schema, so we can go ahead
    // and evaluate it as an object.

    // Object case
    // True if each key of test matches each key of schema
    return Object.keys(schema)
        .map(
            key => matchesSchemaInner(schema[key], test && test[key])
        )
        .reduce(
            (memo, match) => memo && match,
            true
        );
}