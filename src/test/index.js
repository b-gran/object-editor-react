import React from 'react';
import { render } from 'react-dom';

import * as Schema from '../Schema';
import { ObjectEditor, ArrayEditor } from '../Editor';
import { PropTypes } from '../constants';

import update from 'react-addons-update';

const empty = () => null;

const schema = {
    foo: Schema.SchemaTypes.string({ required: true }),
    bar: Schema.SchemaTypes.number(),
    baz: {
        biz: Schema.SchemaTypes.number(),
        boz: Schema.SchemaTypes.number(),

        booz: {
            barz: {
                nested: Schema.SchemaTypes.number(),
            }
        }
    },
};

function updateArray (updated, idx) {
    console.log('args', arguments);
    this.setState({
        object: update(
            this.state.object,
            {
                [idx]: {
                    $set: updated
                }
            }
        )
    })
};

class Wrapper extends React.Component {
    static displayName = 'Wrapper';

    static propTypes = {
        initialObject: React.PropTypes.any.isRequired,
        type: PropTypes.Schema.isRequired,

        onUpdate: React.PropTypes.func,
    };

    constructor (props) {
        super(props);

        this.state = {
            object: props.initialObject
        };

        this.change = (this.props.onUpdate && this.props.onUpdate.bind(this)) ||
                updateArray.bind(this);
    }


    add = newObject => {
        console.log('adding', newObject);
        this.setState({ object: [ ...this.state.object, newObject ]});
        return true;
    };

    render () {
        const EditorComponent = Array.isArray(this.state.object)
            ? ArrayEditor
            : ObjectEditor;

        return (
        <div>
            <EditorComponent
                className='editor--outside'
                object={this.state.object}
                type={this.props.type}
                onUpdateElement={this.change}
                onAddElement={this.add}
                onRemoveElement={empty} />

            <p>
                { JSON.stringify(this.state.object, null, '\t')}
            </p>
        </div>
        );
    }
}

const b = <Wrapper
    initialObject={[
        {
            foo: 'something',
            bar: 4,
            baz: {
                biz: 3,
                booz: {
                    barz: {
                        nested: 2
                    }
                }
            }
        },

        {
            foo: 'baz baz',
        },

        {
            foo: 'baz baz',
        },
    ]}
    type={schema} />;

render(
    b,
    document.getElementById('app')
);

const c = <Wrapper
    initialObject={{
        foo: 'something',
        bar: 4,
        baz: {
            biz: 3,
            booz: {
                barz: {
                    nested: 2
                }
            }
        }
    }}
    type={schema}
    onUpdate={function (updated) { this.setState({ object: updated }) }}
/>;

render(
    c,
    document.getElementById('app2')
);
