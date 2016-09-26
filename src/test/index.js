import React from 'react';
import { render } from 'react-dom';

import * as Schema from '../Schema';
import Editor from '../Editor';
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

class Wrapper extends React.Component {
    static displayName = 'Wrapper';

    static propTypes = {
        initialObject: React.PropTypes.any.isRequired,
        type: PropTypes.Schema.isRequired,
    };

    constructor (props) {
        super(props);

        this.state = {
            object: props.initialObject
        };

        this.change = this.change.bind(this);
    }

    change = function (updated, idx) {
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

    render () {
        return (
        <div>
            <Editor
                className='editor--outside'
                object={this.state.object}
                type={this.props.type}
                onUpdateElement={this.change}
                onRemoveElement={empty}
                onAddElement={empty} />;

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
