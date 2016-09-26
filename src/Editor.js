import React from 'react';
import cx from 'classnames';
import update from 'react-addons-update';

import { PropTypes } from './constants';

import Scrim from './Scrim';

import * as Schema from './Schema';

import _ from 'lodash';

const empty = () => null;

// Base propTypes for all editor variants
const BASE_EDITOR_PROPTYPES = {
    // Schema for the elements in the array
    type: PropTypes.Schema.isRequired,

    // Optional: classes to apply to the editor wrapper
    className: React.PropTypes.string,

    // Optional.
    // A function that returns a react node to use for the icon
    icon: React.PropTypes.func,

    // Handler called when one of the elements is modified
    //
    // function onUpdateElement (element, index) -> void
    // where `index` is the index
    onUpdateElement: React.PropTypes.func.isRequired,

    // Handler called when one of the elements is removed
    onRemoveElement: React.PropTypes.func.isRequired,

    // Handler called when a new element is added
    onAddElement: React.PropTypes.func.isRequired,
};

// General Editor component that selects from Array and
// single Object Editor variants.
class Editor extends React.Component {
    static displayName = 'Editor';

    static propTypes = {
        ...BASE_EDITOR_PROPTYPES,

        // The thing to edit. Can be any type (or undefined)
        object: React.PropTypes.any,
    };

    constructor (props) {
        super(props);
    }

    render () {
        const EditorComponent = Array.isArray(this.props.object)
            ? ArrayEditor
            : ObjectEditor;

        return (
            <EditorComponent { ...this.props } />
        )
    }
}

// A tabular editor for editing a single JSON object
class ObjectEditor extends React.Component {
    static displayName = 'ObjectEditor';

    static propTypes = {
        ...BASE_EDITOR_PROPTYPES,

        // The thing to edit. Can be either
        // * an object
        // * undefined
        object: React.PropTypes.object,
    };

    static defaultProps = {
        className: '',
    };

    render () {
        return (
            <table className={cx('editor', 'editor--object', this.props.className)}>
                <thead>
                <tr>
                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the icon column */}
                    </th>

                    {
                        // A column for each element key
                        Object.keys(this.props.type).map(
                            field => (
                                <th>{ field }</th>
                            )
                        )
                    }

                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the delete object column */}
                    </th>
                </tr>
                </thead>

                <tbody>

                    { /* Object is just an individual object, so there's only one row */ }
                    <ElementRow
                        icon={this.props.icon || undefined}
                        type={this.props.type}
                        object={this.props.object}
                        onChange={this.props.onUpdateElement}
                        onRemove={empty} />

                </tbody>
            </table>
        );
    }
}

// A tabular editor for editing an array of JSON objects in real time
class ArrayEditor extends React.Component {
    static displayName = 'Editor';

    static propTypes = {
        ...BASE_EDITOR_PROPTYPES,

        // The thing to edit. Can be any type (or undefined)
        object: React.PropTypes.array,
    };

    static defaultProps = {
        className: '',
    };

    render () {
        return (
            <table className={cx('editor', 'editor--array', this.props.className)}>
                <thead>
                <tr>
                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the icon column */}
                    </th>

                    {
                        // A column for each element key
                        Object.keys(this.props.type).map(
                            field => (
                                <th>{ field }</th>
                            )
                        )
                    }

                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the delete object column */}
                    </th>
                </tr>
                </thead>

                <tbody>

                {
                    _.map(
                        this.props.object,
                        (el, idx) => <ElementRow
                            icon={this.props.icon || undefined}
                            type={this.props.type}
                            object={el}
                            onChange={updated => this.props.onUpdateElement(updated, idx)}
                            onRemove={empty} />
                    )
                }

                </tbody>
            </table>
        );
    }
}

const STRING_INPUT_TYPES = [
    'string', 'boolean', 'number', 'date'
];

// A td cell for editing a property whose type is anything by object
class StringCell extends React.Component {
    static displayName = 'StringCell';

    static propTypes = {
        // The type of this cell
        type: PropTypes.Schema.isRequired,

        // Current value of this cell
        value: React.PropTypes.any,

        onChange: React.PropTypes.func.isRequired,
    };

    render () {
        return (
            <td>
                <input
                    className='form-control'
                    type='text'
                    value={this.props.value || ''}
                    required={this.props.type.required}
                    onChange={evt => this.props.onChange(evt.target.value)}/>
            </td>
        );
    }
}

const ScrimEditor = Scrim(Editor);

// A td cell for editing a property of type `object`
class ObjectCell extends React.Component {
    static displayName = 'ObjectCell';

    static propTypes = {
        // The type of this cell
        type: PropTypes.Schema.isRequired,

        // Current value of this cell
        value: React.PropTypes.any,

        onChange: React.PropTypes.func.isRequired,
    };

    state = {
        open: false
    };

    // Toggle open the editor when the edit button is clicked.
    clickEdit = evt => {
        this.setState({
            open: !this.state.open
        });
    };

    // Close the editor
    close = evt => {
        this.setState({
            open: false,
        });
    };

    // Conditionally renders the value editor (depending on whether
    // the cell is toggled open)
    renderEditor = () => {
        // Cell is closed -- render nothing
        if (!this.state.open) {
            return <div></div>
        }

        // Cell is open -- render the value editor
        return (
            <ScrimEditor
                onClickScrim={this.close}

                className='editor--inside'
                type={this.props.type}
                object={this.props.value}
                onUpdateElement={this.props.onChange}
                onRemoveElement={empty}
                onAddElement={empty} />
        );
    };

    render () {
        return (
            <td className='object-cell'>
                <button onClick={this.clickEdit}>Edit</button>

                { this.renderEditor() }
            </td>
        );
    }
}

const ElementRow = props => {
    return (
        <tr>
            <td>
                {
                    // Icon for the element
                    (props.icon && props.icon()) ||
                    <i>C</i>
                }
            </td>

            {
                _.map(
                    Object.keys(props.type),
                    key => {
                        const isStringType = _.includes(STRING_INPUT_TYPES, props.type[key].type)

                        const CellType = isStringType
                            ? StringCell
                            : ObjectCell;

                        const value = props.object
                            ? props.object[key]
                            : null;

                        return <CellType
                            type={props.type[key]}
                            value={value}
                            onChange={newValue => props.onChange(
                                update(
                                    props.object,
                                    {
                                        [key]: {
                                            $set: newValue
                                        }
                                    }
                                )
                            )} />;
                    }
                )
            }

            <td>
                trash
                {/*<Icon*/}
                    {/*which="trash"*/}
                    {/*onClick={empty}/>*/}
            </td>
        </tr>
    );
};
ElementRow.displayName = 'ElementRow';
ElementRow.propTypes = {
    // The type of this field -- a SchemaType
    // type: PropTypes.SchemaType.isRequired,
    type: PropTypes.Schema.isRequired,

    // Icon to use for the field
    icon: React.PropTypes.func,

    // The element itself (should have the type `type`)
    object: React.PropTypes.any,

    // Handlers for updating/removing the element
    onChange: React.PropTypes.func.isRequired,
    onRemove: React.PropTypes.func.isRequired,
};

export default Editor;
