import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames';

import Table, {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from 'material-ui/Table';
import Checkbox from 'material-ui/Checkbox';

import { BaseClassnames, PropTypes as Props } from './constants';

import * as Schema from './Schema';

// Base propTypes for all editor variants
export const BASE_EDITOR_PROPTYPES = {
  // Schema for the elements in the array
  // TODO: add "render" functions to type somehow, so that an element can provide a custom
  // TODO: render function for any of its cells
  // TODO: pass validation functions through schema
  type: Props.Schema.isRequired,

  // Optional: classes to apply to the editor wrapper
  className: PropTypes.string,
};

// Returns true if `schemaType` is one of the array types -- "array", or "arrayOf".
const isArraySchemaType = schemaType => {
  return schemaType._type && schemaType._type.match(/array/) !== null;
};


function columnTitle (schemaType) {
  // Complex object schema
  if (typeof schemaType === 'object') {
    return 'Object';
  }

  // If it's an array type, use the elementType property.
  if (isArraySchemaType(schemaType)) {
    return 'Array of ' + columnTitle(schemaType._elementType || Schema.SchemaTypes.any);
  }

  // Otherwise, just use the _type field.
  return _.capitalize(schemaType._type);
}


// Returns the column title for the SchemaType `schemaType`.
// A <th /> Element with a the class ".editor__column-title"
const ColumnTitle = props => {
  const classes = cx(
    BaseClassnames.ColumnTitle(),
    props.className
  );

  return (
    <TableCell className={classes}>
      {props.children}
    </TableCell>
  );
};
ColumnTitle.displayName = 'ColumnTitle';
ColumnTitle.propTypes = {
  // Optional extra classes for the <th />
  className: PropTypes.string,

  // Children of the <th />
  children: PropTypes.node,
};

export default class BaseTable extends React.Component {
  static displayName = 'BaseTable';

  static propTypes = {
    ...BASE_EDITOR_PROPTYPES,

    // The thing to edit
    // Can be anything for a base editor (which doesn't actually render an editor)
    object: PropTypes.any,

    // Handler called when the "select all/none" checkbox is clicked.
    // If the handler isn't provided, the checkbox isn't rendered.
    onSelectAll: PropTypes.func,
  };

  // Render the column titles based on a primitive schema type.
  renderPrimitiveColumns = () => {
    return <ColumnTitle>{columnTitle(this.props.type)}</ColumnTitle>;
  };

  // Render column titles based on a complex object-schema
  renderObjectColumns = () => {
    // A column for each element key
    return Object.keys(this.props.type).map(
      field => (
        <ColumnTitle>{field}</ColumnTitle>
      )
    );
  };

  render () {
    const isPrimitiveSchema = Boolean(this.props.type._isSchemaType);

    return (
      <Table className={cx(BaseClassnames.Editor(), this.props.className)}>
        <TableHead>
          <TableRow className={BaseClassnames.ColumnTitles()}>
            <TableCell padding="checkbox">
              {
                this.props.onSelectAll &&
                <Checkbox checked={Math.random() > 0.5} onChange={this.props.onSelectAll}/>
              }
            </TableCell>

            {
              isPrimitiveSchema
                ? this.renderPrimitiveColumns()
                : this.renderObjectColumns()
            }

            <TableCell>
              {/* Blank -- just for spacing */}
              {/* This is the delete object column */}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.children}
        </TableBody>
      </Table>
    );
  }
}

