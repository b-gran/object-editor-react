import React from 'react';
import cx from 'classnames';
import update from 'react-addons-update';

import { PropTypes } from './constants';

import Scrim from './Scrim';

import * as Schema from './Schema';

import _ from 'lodash';

const empty = () => null;

// A tabular editor for editing an array of JSON objects in real time
class Editor extends React.Component {
    static displayName = 'Editor';

    static propTypes = {
        // Schema for the elements in the array
        type: PropTypes.Schema.isRequired,

        // An array of elements to edit
        elements: React.PropTypes.array.isRequired,

        // Optional: classes to apply to the editor wrapper
        className: React.PropTypes.string,

        // Optional.
        // A function that returns a react node to use for the icon
        icon: React.PropTypes.func,

        // Handler called when one of the elements is modified
        onUpdateElement: React.PropTypes.func.isRequired,

        // Handler called when one of the elements is removed
        onRemoveElement: React.PropTypes.func.isRequired,

        // Handler called when a new element is added
        onAddElement: React.PropTypes.func.isRequired,
    };

    static defaultProps = {
        className: '',
    };

    render () {
        return (
            <table className={cx('editor', this.props.className)}>
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
                        this.props.elements,
                        el => <ElementRow
                            icon={this.props.icon || undefined}
                            type={this.props.type}
                            element={el}
                            onChange={empty}
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

class StringCell extends React.Component {
    static displayName = 'StringCell';

    static propTypes = {
        // The type of this cell
        type: PropTypes.Schema.isRequired,

        // Current value of this cell
        value: React.PropTypes.any,
    };

    render () {
        return (
            <td>
                <input
                    className='form-control'
                    type='text'
                    value={this.props.value || ''}
                    required={this.props.type.required}
                    onChange={empty}/>
            </td>
        );
    }
}

const ScrimEditor = Scrim(Editor);

class ObjectCell extends React.Component {
    static displayName = 'ObjectCell';

    static propTypes = {
        // The type of this cell
        type: PropTypes.Schema.isRequired,

        // Current value of this cell
        value: React.PropTypes.any,
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
                elements={[ this.props.value ]}
                onUpdateElement={empty}
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

                        const value = props.element
                            ? props.element[key]
                            : null;

                        return <CellType
                            type={props.type[key]}
                            value={value}/>;
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
    element: React.PropTypes.any,

    // Handlers for updating/removing the element
    onChange: React.PropTypes.func.isRequired,
    onRemove: React.PropTypes.func.isRequired,
};

export default Editor;
