import React from 'react';
import { render } from 'react-dom';

import * as Schema from '../Schema';
import Editor from '../Editor';

const empty = () => null;

const schema = {
    foo: Schema.SchemaTypes.string({ required: true }),
    bar: Schema.SchemaTypes.number(),
    baz: {
        biz: Schema.SchemaTypes.number(),
    },
};

const b = <Editor
    className='editor--outside'
    elements={[
        {
            foo: 'something',
            bar: 4,
        },

        {
            foo: 'baz baz',
        },

        {
            foo: 'baz baz',
        },
    ]}
    type={schema}
    onUpdateElement={empty}
    onRemoveElement={empty}
    onAddElement={empty} />;

render(
    b,
    document.getElementById('app')
);
