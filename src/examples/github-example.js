import PropTypes from 'prop-types';
import React from 'react';
import { render } from 'react-dom';

import * as Schema from '../Schema';
import { ObjectEditor, ArrayEditor } from '../Editor';
import { PropTypes as Props } from '../constants'

import update from 'react-addons-update';
import * as R from 'ramda'

import './main.css'
import SchemaView from '../SchemaView'
import * as util from '../util'

const APP_ROOT = document.getElementById('root')

// Sets the element at idx to updated
function updateArray (updated, idx) {
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
}

// A test wrapper around Editor that keeps track of state
class Wrapper extends React.Component {
    static displayName = 'Wrapper';

    static propTypes = {
      // Initial object to edit
      initialObject: PropTypes.any.isRequired,

      // Schema to use
      type: Props.Schema.isRequired,

      // [optional] handler to use when the object is updated
      onUpdate: PropTypes.func,
    };

    constructor (props) {
        super(props);

        // Initialize state to empty object
        this.state = {
            object: props.initialObject
        };

        // If update handler was specified in props, use that -- otherwise,
        // use the function updateArray
        this.change = (this.props.onUpdate && this.props.onUpdate.bind(this)) ||
                updateArray.bind(this);
    }


    // Handler called when a new object is added.
    // Just adds the object to the end of the array.
    add (newObject) {
        this.setState({ object: [ ...this.state.object, newObject ]});
        return true;
    };

    // Handler called when an element is removed.
    remove (removedIndices) {
        const wasRemovedByIndex = util.keyBy(R.identity, removedIndices)
        this.setState({
            object: R.addIndex(R.reject)(
                (__, idx) => idx in wasRemovedByIndex,
                this.state.object
            )
        });
    };

    render () {
      // Choose between object and array components based on whether
      // the object in state is an array.
      const EditorComponent = Array.isArray(this.state.object)
        ? ArrayEditor
        : ObjectEditor;

      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
          <EditorComponent
            className='editor--outside'
            object={this.state.object}
            type={this.props.type}
            onUpdateElement={this.change.bind(this)}
            onAddElement={this.add.bind(this)}
            onRemoveElements={this.remove.bind(this)}/>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#f6f6f6',
            padding: '6px',
            boxShadow: '0px 6px 14px 0px #0000003d, 0px 2px 3px 0px #00000040',
            marginLeft: '10px',
            marginTop: 0,
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Data</h4>
            <pre>{JSON.stringify(this.state.object, null, '   ')}</pre>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#f6f6f6',
            padding: '6px',
            boxShadow: '0px 6px 14px 0px #0000003d, 0px 2px 3px 0px #00000040',
            marginLeft: '10px',
            marginTop: 0,
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Schema</h4>
            <SchemaView schema={this.props.type} />
          </div>
        </div>
      )
    }
}

const schema = {
  name: Schema.SchemaTypes.string({ required: true }),
  age: Schema.SchemaTypes.number(),
  jobs: Schema.SchemaTypes.arrayOf({
    year: Schema.SchemaTypes.number(),
    title: Schema.SchemaTypes.string(),
  })(),
};

const value = [
  {
    name: 'Jane Doe',
    age: 29,
    jobs: [
      {
        year: 2006,
        title: 'Software Engineer'
      },
    ],
  },
]

const b = <Wrapper initialObject={value} type={schema} />

render(
    b,
    APP_ROOT.appendChild(document.createElement('div'))
);
